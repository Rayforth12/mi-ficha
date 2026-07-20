"use client";

import { useEffect, useState } from "react";
import { CATS_EXPENSE, CATS_INCOME } from "@/lib/categories";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm({ onAdd, onUpdate, editingTx, onCancelEdit }) {
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(CATS_EXPENSE[0].id);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingTx;
  const list = type === "income" ? CATS_INCOME : CATS_EXPENSE;

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setCategory(editingTx.category);
      setAmount(String(editingTx.amount));
      setDesc(editingTx.description || "");
      setDate(editingTx.date);
    } else {
      setType("expense");
      setCategory(CATS_EXPENSE[0].id);
      setAmount("");
      setDesc("");
      setDate(todayStr());
    }
  }, [editingTx]);

  function switchType(t) {
    setType(t);
    if (!isEditing) setCategory(t === "income" ? CATS_INCOME[0].id : CATS_EXPENSE[0].id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    if (isEditing) {
      await onUpdate({ id: editingTx.id, type, category, amount: value, description: desc.trim(), date });
    } else {
      await onAdd({ type, category, amount: value, description: desc.trim(), date });
      setAmount("");
      setDesc("");
    }
    setSaving(false);
  }

  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display font-semibold text-lg">
          {isEditing ? "Editar movimiento" : "Agregar movimiento"}
        </h2>
        {isEditing && (
          <button type="button" onClick={onCancelEdit} className="text-xs text-inksoft underline">
            Cancelar
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => switchType("expense")}
          className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
            type === "expense" ? "bg-redsoft border-red text-red" : "border-line text-inksoft"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => switchType("income")}
          className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
            type === "income" ? "bg-greensoft border-green text-green" : "border-line text-inksoft"
          }`}
        >
          Ingreso
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Categoría</label>
          <div className="grid grid-cols-4 gap-1.5">
            {list.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center gap-0.5 text-[11px] py-2 px-1 rounded-lg border ${
                  category === c.id
                    ? type === "income"
                      ? "bg-greensoft border-green text-green"
                      : "bg-redsoft border-red text-red"
                    : "border-line text-inksoft bg-white"
                }`}
              >
                <span className="text-base leading-none">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Monto (₡)</label>
          <input
            type="number"
            min="0"
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-line bg-white font-mono focus:outline-gold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Descripción</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={type === "income" ? "ej. Pago quincenal julio" : "ej. Uber, corte de pelo, refresco"}
            className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`mt-1 py-2.5 rounded-lg font-semibold text-white disabled:opacity-50 ${
            type === "income" ? "bg-green" : "bg-red"
          }`}
        >
          {saving
            ? "Guardando…"
            : isEditing
            ? "Guardar cambios"
            : type === "income"
            ? "Agregar ingreso"
            : "Agregar gasto"}
        </button>
      </form>
    </div>
  );
}
