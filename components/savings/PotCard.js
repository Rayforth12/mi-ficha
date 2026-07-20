"use client";

import { useState } from "react";
import { fmt } from "@/lib/categories";
import ProgressBar from "./ProgressBar";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function PotCard({ pot, contributions, onAddContribution, onDeleteContribution, onDeletePot }) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const total = contributions.reduce((s, c) => s + Number(c.amount), 0);
  const hasGoal = pot.target_amount !== null && pot.target_amount !== undefined;
  const pct = hasGoal && pot.target_amount > 0 ? (total / pot.target_amount) * 100 : 0;
  const remaining = hasGoal ? Math.max(0, pot.target_amount - total) : 0;
  const reached = hasGoal && total >= pot.target_amount;

  async function handleSubmit(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    await onAddContribution(pot.id, { amount: value, note: note.trim(), date });
    setSaving(false);
    setAmount("");
    setNote("");
    setShowForm(false);
  }

  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <h3 className="font-display font-semibold text-lg">
            {hasGoal ? "🎯" : "🐷"} {pot.name}
          </h3>
          {reached && <span className="text-xs text-green font-semibold">¡Meta cumplida! 🎉</span>}
        </div>
        <button onClick={() => onDeletePot(pot.id)} title="Borrar ahorro" className="text-inksoft opacity-40 hover:opacity-100 hover:text-red text-sm px-1">
          ✕
        </button>
      </div>

      <div className="font-mono font-semibold text-2xl text-green mb-1">{fmt(total)}</div>

      {hasGoal ? (
        <>
          <ProgressBar pct={pct} />
          <div className="flex justify-between text-xs text-inksoft mt-1">
            <span>{Math.min(100, Math.round(pct))}% de {fmt(pot.target_amount)}</span>
            <span>{reached ? "Meta cumplida" : `Faltan ${fmt(remaining)}`}</span>
          </div>
        </>
      ) : (
        <div className="text-xs text-inksoft">Ahorro libre, sin meta fija.</div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex-1 py-2 rounded-lg border border-green text-green text-sm font-semibold bg-greensoft"
        >
          + Agregar aporte
        </button>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="px-3 py-2 rounded-lg border border-line text-inksoft text-sm"
        >
          {showHistory ? "Ocultar" : "Historial"} ({contributions.length})
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <input
            type="number"
            min="0"
            step="1"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto del aporte (₡)"
            className="w-full px-3 py-2 rounded-lg border border-line bg-white font-mono focus:outline-gold text-sm"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold text-sm"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="py-2 rounded-lg font-semibold text-white bg-green text-sm disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar aporte"}
          </button>
        </form>
      )}

      {showHistory && (
        <div className="mt-3 border-t border-line pt-2">
          {contributions.length === 0 ? (
            <p className="text-xs text-inksoft italic">Todavía no hay aportes.</p>
          ) : (
            [...contributions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((c) => (
                <div key={c.id} className="flex justify-between items-center py-1.5 dashed-divider text-sm font-mono">
                  <span className="font-body text-inksoft text-xs">
                    {new Date(c.date + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}
                    {c.note ? " · " + c.note : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-green font-semibold">+{fmt(c.amount)}</span>
                    <button
                      onClick={() => onDeleteContribution(c.id, pot.id)}
                      className="text-inksoft opacity-40 hover:opacity-100 hover:text-red px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
