import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabaseServerComponent";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { fetchBankTransactions } from "@/lib/imapFetch";
import { guessCategory } from "@/lib/merchantDictionary";

// Necesita Node.js (sockets IMAP crudos), no sirve en el runtime "Edge".
export const runtime = "nodejs";
export const maxDuration = 60;

async function syncUser(db, userId, connection) {
  const { data: userRules } = await db
    .from("merchant_categories")
    .select("merchant_key, category")
    .eq("user_id", userId);

  // Siempre revisa el último mes completo (no solo desde la última vez).
  // El índice único de email_ref evita que algo se importe dos veces, así que
  // no hay riesgo — y así, si algún correo no se pudo leer antes (ej. por un
  // formato que no reconocíamos), se vuelve a intentar solo en cada sync.
  const sinceDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const { transactions: parsedTxs, debug } = await fetchBankTransactions({
    emailAddress: connection.email_address,
    appPassword: connection.app_password,
    sinceDate,
  });

  let imported = 0;
  let skipped = 0;

  for (const tx of parsedTxs) {
    const isIncome = tx.type === "income";
    const isForeignCurrency = !!(tx.currency && !/colon|crc/i.test(tx.currency));
    let category;
    let needsReview = false;

    if (isIncome) {
      // SINPE recibido: si ya sabemos de este contacto, usa esa categoría;
      // si no, cae en "Ingreso extra" (no hace falta revisión manual).
      const rule = (userRules || []).find((r) =>
        (tx.merchant || "").toLowerCase().includes(r.merchant_key.toLowerCase())
      );
      category = rule ? rule.category : "extra";
    } else {
      const guessed = guessCategory(tx.merchant, userRules);
      category = guessed || "otros";
      // Si fue en una moneda distinta a colones, SIEMPRE va a revisión — el
      // monto que llega del correo está en esa moneda, no en colones, y
      // convertirlo automáticamente con un tipo de cambio inventado podría
      // quedar mal sin que te dieras cuenta. Mejor que ajustes vos el monto.
      needsReview = !guessed || isForeignCurrency;
    }

    const description = isForeignCurrency
      ? `${tx.merchantLabel || tx.merchant || tx.bank} (pago en ${tx.currency.trim()} — ajustá el monto a colones)`
      : tx.merchantLabel || tx.merchant || tx.bank;

    const row = {
      user_id: userId,
      type: isIncome ? "income" : "expense",
      category,
      amount: tx.amount,
      description,
      date: tx.date,
      source: "email",
      bank: tx.bank,
      merchant_raw: tx.merchant || "",
      email_ref: tx.emailRef,
      needs_review: needsReview,
      tx_kind: tx.kind,
    };

    const { error } = await db.from("transactions").insert(row);
    if (error) {
      // El índice único de email_ref evita duplicados; "duplicate key" es esperado y se ignora.
      if (error.code === "23505") {
        skipped += 1;
      } else {
        console.error("Error insertando transacción de correo:", error.message);
      }
    } else {
      imported += 1;
    }
  }

  await db
    .from("gmail_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { imported, skipped, debug };
}

// Botón "Sincronizar ahora" — el usuario ya está logueado, solo sincroniza SU correo.
// Devuelve "debug" con el detalle de cada correo candidato revisado, para diagnosticar.
export async function POST() {
  const supabase = createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({ error: "Correo no conectado" }, { status: 400 });
  }

  try {
    const result = await syncUser(supabase, user.id, connection);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Llamado por el cron diario de Vercel: sincroniza a TODOS los usuarios con correo conectado.
async function handleCronSync() {
  const admin = createAdminClient();
  const { data: connections, error } = await admin.from("gmail_connections").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const conn of connections || []) {
    try {
      const result = await syncUser(admin, conn.user_id, conn);
      results.push({ user_id: conn.user_id, imported: result.imported, skipped: result.skipped });
    } catch (e) {
      results.push({ user_id: conn.user_id, error: e.message });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}

// Vercel manda "Authorization: Bearer <CRON_SECRET>" automáticamente en cada
// llamada programada; CRON_SECRET ya lo crea Vercel solo, no hay que configurarlo.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return handleCronSync();
}
