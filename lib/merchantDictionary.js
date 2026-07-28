// Diccionario base de palabras clave -> categoría, para clasificar comercios
// conocidos automáticamente. El usuario puede corregir cualquier clasificación,
// y esa corrección se guarda para la próxima vez (aprendizaje simple).

export const DEFAULT_MERCHANT_RULES = [
  { keywords: ["automercado", "walmart", "maxi pali", "maxipali", "mas x menos", "masxmenos", "pricesmart", "super", "market", "pali", "fresh market"], category: "comida" },
  { keywords: ["uber", "didi", "indriver", "taxi", "gasolinera", "servicentro", "delta", "recope", "estacionamiento", "parking"], category: "transporte" },
  { keywords: ["barber", "salon", "spa", "peluqueria", "estetica"], category: "personal" },
  { keywords: ["farmacia", "fischel", "sucre", "farmacias"], category: "personal" },
  { keywords: ["cine", "netflix", "spotify", "disney", "hbo", "amazon prime", "confiteria", "dulce", "heladeria", "cafe", "starbucks", "cafeteria"], category: "antojos" },
  { keywords: ["kolbi", "movistar", "claro", "ice", "cnfl", "aya", "ess", "coopelesca", "jasec"], category: "pagos" },
];

export function guessCategory(merchantRaw, userRules) {
  const text = (merchantRaw || "").toLowerCase();
  if (!text) return null;

  // Primero las reglas propias del usuario (aprendidas), tienen prioridad.
  if (userRules) {
    for (const rule of userRules) {
      if (text.includes(rule.merchant_key.toLowerCase())) {
        return rule.category;
      }
    }
  }

  for (const rule of DEFAULT_MERCHANT_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}

// Genera una "clave" corta y estable a partir del nombre crudo del comercio,
// para guardar en el diccionario del usuario (ej. "AUTOMERCADO SABANA CR" -> "automercado")
export function normalizeMerchantKey(merchantRaw) {
  return (merchantRaw || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
}