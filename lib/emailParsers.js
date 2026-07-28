// Extrae monto, comercio/contacto, fecha y tipo de transacción de los correos
// de cada banco. Cada banco (y cada tipo de correo) tiene su propia función,
// porque cada uno viene en un formato distinto. Si un correo no calza con
// ningún patrón conocido, se ignora — nunca se inventa una transacción.

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Saca el contenido de todas las celdas <td>...</td> de una tabla HTML, en orden.
// Sirve para correos con formato de tabla (ej. compras con tarjeta BCR).
function extractCells(html) {
  const cells = [];
  const regex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = decodeEntities(match[1].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    cells.push(text);
  }
  return cells;
}

// Aplana cualquier HTML a texto plano de una sola línea. Sirve para correos
// que no usan tabla, sino líneas tipo "Etiqueta: valor" (ej. SINPE Móvil BCR).
function stripHtmlToText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(raw) {
  const cleaned = (raw || "").replace(/[^\d.,]/g, "").replace(/,/g, "");
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

// "26/07/2026" o "26/07/2026 13:10:35" -> "2026-07-26"
function ddmmyyyyToISO(fecha) {
  const datePart = fecha.trim().split(" ")[0];
  const [d, m, y] = datePart.split("/");
  return `${y}-${m}-${d}`;
}

// ---------------- BCR: compra con tarjeta ----------------
// Remitente: bcrtarjestcta@bancobcr.com
// Tabla con encabezados: Fecha | Autorización | No.Referencia | Monto | Moneda | Comercio | Estado
function parseBcrTarjeta(html, emailId) {
  const cells = extractCells(html);
  const results = [];
  const headerIdx = cells.findIndex((c) => c === "Fecha");
  if (headerIdx === -1) return results;

  const width = 7; // Fecha, Autorización, No.Referencia, Monto, Moneda, Comercio, Estado
  let i = headerIdx + width;
  let row = 0;
  while (i + width <= cells.length) {
    const [fecha, , referencia, monto, , comercio, estado] = cells.slice(i, i + width);
    const amount = parseAmount(monto);
    if (fecha && /\d{2}\/\d{2}\/\d{4}/.test(fecha) && amount) {
      results.push({
        date: ddmmyyyyToISO(fecha),
        amount,
        merchant: (comercio || "").trim(),
        merchantLabel: (comercio || "").trim(),
        approved: !estado || /aprobad/i.test(estado),
        kind: "purchase",
        type: "expense",
        emailRef: `bcr-tarjeta-${referencia || emailId + "-" + row}`,
      });
    }
    i += width;
    row += 1;
  }
  return results;
}

// ---------------- BCR: SINPE Móvil (enviado y recibido) ----------------
// Remitente: mensajero@bancobcr.com. No es tabla, son líneas "Etiqueta: valor".
function parseBcrSinpe(html, emailId) {
  const text = stripHtmlToText(html);
  const isSent = /se le ha debitado/i.test(text);
  const isReceived = /se le ha acreditado/i.test(text);
  if (!isSent && !isReceived) return [];

  const refMatch = text.match(/N[uú]mero de referencia:\s*([A-Za-z0-9]+)/i);
  const montoMatch = text.match(/Monto:\s*([\d.,]+)/i);
  const fechaMatch = text.match(/realizada el (\d{2}\/\d{2}\/\d{4})/i);
  if (!refMatch || !montoMatch) return [];

  const amount = parseAmount(montoMatch[1]);
  if (!amount) return [];

  const date = fechaMatch ? ddmmyyyyToISO(fechaMatch[1]) : new Date().toISOString().slice(0, 10);
  const emailRef = `bcr-sinpe-${refMatch[1]}`;

  if (isSent) {
    const nameMatch = text.match(/Nombre cliente Destino:\s*(.+?)\s*Entidad Destino/i);
    const phoneMatch = text.match(/Tel[eé]fono Destino:\s*(\d+)/i);
    const name = nameMatch ? nameMatch[1].trim() : "Destinatario SINPE";
    const phone = phoneMatch ? phoneMatch[1] : "";
    return [
      {
        date,
        amount,
        merchant: phone && phone !== "0" ? phone : name,
        merchantLabel: "SINPE a " + name,
        approved: true,
        kind: "sinpe_sent",
        type: "expense",
        emailRef,
      },
    ];
  }

  const nameMatch = text.match(/Nombre cliente origen:\s*(.+?)\s*Entidad origen/i);
  const phoneMatch = text.match(/Tel[eé]fono origen:\s*(\d+)/i);
  const name = nameMatch ? nameMatch[1].trim() : "Remitente SINPE";
  const phone = phoneMatch ? phoneMatch[1] : "";
  return [
    {
      date,
      amount,
      merchant: phone && phone !== "0" ? phone : name,
      merchantLabel: "SINPE de " + name,
      approved: true,
      kind: "sinpe_received",
      type: "income",
      emailRef,
    },
  ];
}

// Banco -> remitente exacto que dispara el parser -> función parser.
// IMPORTANTE: solo se incluyen bancos de los que ya tengo un correo real de
// ejemplo. Agregar BAC, Banco Nacional o Banco Popular es sencillo, pero
// necesito un correo de muestra real de cada uno para no adivinar el formato
// (un formato adivinado podría fallar en silencio o clasificar mal).
export const BANK_PARSERS = [
  { bank: "BCR", from: "bcrtarjestcta@bancobcr.com", parse: parseBcrTarjeta },
  { bank: "BCR SINPE", from: "mensajero@bancobcr.com", parse: parseBcrSinpe },
];

export function findParserForSender(fromHeader) {
  const lower = (fromHeader || "").toLowerCase();
  return BANK_PARSERS.find((p) => lower.includes(p.from));
}
