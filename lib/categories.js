export const CATS_EXPENSE = [
  { id: "comida", label: "Comida", emoji: "🍔" },
  { id: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "personal", label: "Cuidado personal", emoji: "💇" },
  { id: "antojos", label: "Antojos", emoji: "🥤" },
  { id: "pagos", label: "Pagos fijos", emoji: "📱" },
  { id: "familia", label: "Familia", emoji: "👪" },
  { id: "ahorro", label: "Ahorro/Inversión", emoji: "💰" },
  { id: "otros", label: "Otros", emoji: "📦" },
];

export const CATS_INCOME = [
  { id: "salario", label: "Salario quincenal", emoji: "💼" },
  { id: "extra", label: "Ingreso extra", emoji: "✨" },
  { id: "otro", label: "Otro ingreso", emoji: "➕" },
];

export function catInfo(type, id) {
  const list = type === "income" ? CATS_INCOME : CATS_EXPENSE;
  return list.find((c) => c.id === id) || { label: id, emoji: "•" };
}

export const CAT_COLORS = {
  comida: "#146C43",
  transporte: "#2E6F8B",
  personal: "#8B5EA6",
  antojos: "#B98900",
  pagos: "#A63A2E",
  familia: "#C2578A",
  ahorro: "#3E8E5A",
  otros: "#6B6355",
};

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function fmt(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "₡" + Math.abs(Math.round(n)).toLocaleString("es-CR");
}
