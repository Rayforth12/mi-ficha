"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { CATS_EXPENSE, fmt } from "@/lib/categories";

export default function ReviewSection() {
  const supabase = createClient();
  const [connection, setConnection] = useState(null);
  const [pending, setPending] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [{ data: conn }, { data: needsReview }, { data: retiros }] = await Promise.all([
      supabase.from("gmail_connections").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("needs_review", true).order("date", { ascending: false }),
      supabase
        .from("transactions")
        .select("*")
        .eq("tx_kind", "withdrawal")
        .order("date", { ascending: false })
        .limit(10),
    ]);

    setConnection(conn || null);
    if (conn) setEmailInput(conn.email_address || "");
    setPending(needsReview || []);
    setWithdrawals(retiros || []);
    setLoading(false);
  }

  async function handleSaveConnection(e) {
    e.preventDefault();
    if (!emailInput.trim() || !passInput.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("gmail_connections").upsert(
      {
        user_id: user.id,
        email_address: emailInput.trim(),
        app_password: passInput.replace(/\s+/g, ""),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (!error) {
      setPassInput("");
      setShowForm(false);
      await loadAll();
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(data.error || "No se pudo sincronizar.");
      } else {
        setSyncMsg(
          data.imported > 0
            ? `Listo: ${data.imported} movimiento(s) nuevo(s) importado(s).`
            : "Todo al día — no hay movimientos nuevos."
        );
        await loadAll();
      }
    } catch (e) {
      setSyncMsg("Error de conexión al sincronizar.");
    }
    setSyncing(false);
  }

  async function handleClassify(tx, category) {
    await supabase.from("transactions").update({ category, needs_review: false }).eq("id", tx.id);

    const merchantKey = (tx.merchant_raw || "").toLowerCase().split(/\s+/).slice(0, 2).join(" ");
    if (merchantKey) {
      await supabase
        .from("merchant_categories")
        .upsert({ user_id: tx.user_id, merchant_key: merchantKey, category }, { onConflict: "user_id,merchant_key" });
    }
    setPending((prev) => prev.filter((t) => t.id !== tx.id));
  }

  if (loading) {
    return <div className="text-inksoft text-sm py-10 text-center">Cargando…</div>;
  }

  return (
    <div>
      <div className="bg-card border border-line rounded-xl p-5 mb-5">
        <div className="flex justify-between items-start flex-wrap gap-3 mb-1">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">Importar compras desde correo</h3>
            {connection ? (
              <p className="text-sm text-inksoft">
                Conectado como <b>{connection.email_address}</b>
                {connection.last_synced_at && (
                  <> · última sincronización: {new Date(connection.last_synced_at).toLocaleString("es-CR")}</>
                )}
              </p>
            ) : (
              <p className="text-sm text-inksoft">
                Conectá tu Gmail con una contraseña de aplicación para importar solas las compras y SINPE de BCR.
              </p>
            )}
            {syncMsg && <p className="text-sm text-green mt-1">{syncMsg}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            {connection && (
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="py-2.5 px-5 rounded-lg font-semibold text-white bg-green disabled:opacity-50"
              >
                {syncing ? "Sincronizando…" : "Sincronizar ahora"}
              </button>
            )}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="py-2.5 px-5 rounded-lg font-semibold border border-line text-inksoft"
            >
              {connection ? "Editar conexión" : "Conectar correo"}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSaveConnection} className="mt-3 border-t border-line pt-3 flex flex-col gap-2 max-w-sm">
            <div>
              <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Tu Gmail</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="vos@gmail.com"
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">
                Contraseña de aplicación (16 caracteres)
              </label>
              <input
                type="text"
                required
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="abcd efgh ijkl mnop"
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-sm font-mono"
              />
              <p className="text-xs text-inksoft mt-1">
                Se genera en myaccount.google.com/apppasswords (pide verificación en 2 pasos activada). No es tu
                contraseña normal de Gmail, y la podés revocar cuando quieras desde tu cuenta de Google.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="py-2 rounded-lg font-semibold text-white bg-green text-sm disabled:opacity-50 mt-1"
            >
              {saving ? "Guardando…" : "Guardar conexión"}
            </button>
          </form>
        )}
      </div>

      <h3 className="font-display font-semibold text-lg mb-3">
        Sin clasificar {pending.length > 0 && <span className="text-red">({pending.length})</span>}
      </h3>

      {pending.length === 0 ? (
        <p className="text-inksoft text-sm italic mb-6">No hay compras pendientes de clasificar. 🎉</p>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {pending.map((tx) => (
            <div key={tx.id} className="bg-card border border-line rounded-xl p-4">
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div>
                  <div className="font-body font-semibold">{tx.merchant_raw || tx.description}</div>
                  <div className="text-xs text-inksoft">
                    {tx.bank} ·{" "}
                    {new Date(tx.date + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}
                  </div>
                </div>
                <div className="font-mono font-semibold text-red">{fmt(tx.amount)}</div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {CATS_EXPENSE.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleClassify(tx, c.id)}
                    className="flex flex-col items-center gap-0.5 text-[11px] py-2 px-1 rounded-lg border border-line bg-white text-inksoft hover:border-red hover:text-red"
                  >
                    <span className="text-base leading-none">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {withdrawals.length > 0 && (
        <>
          <h3 className="font-display font-semibold text-lg mb-3">Retiros de efectivo recientes</h3>
          <p className="text-sm text-inksoft mb-3">
            Estos son retiros de cajero, no compras — no se cuentan como gasto todavía. Cuando gastés ese efectivo,
            anotalo vos mismo en "Movimientos" para que quede reflejado correctamente.
          </p>
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            {withdrawals.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center px-5 py-3 dashed-divider text-sm">
                <span>
                  {tx.merchant_raw} ·{" "}
                  {new Date(tx.date + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}
                </span>
                <span className="font-mono font-semibold">{fmt(tx.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
