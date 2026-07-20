"use client";

import { useState } from "react";

export default function NewPotForm({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [hasGoal, setHasGoal] = useState(true);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const targetValue = hasGoal ? parseFloat(target) : null;
    if (hasGoal && (!targetValue || targetValue <= 0)) return;
    setSaving(true);
    await onCreate({ name: name.trim(), target_amount: targetValue });
    setSaving(false);
    setName("");
    setTarget("");
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
      <h3 className="font-display font-semibold text-lg">Nuevo ahorro</h3>

      <div>
        <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Nombre</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej. Viaje a Panamá, Fondo de emergencia, Ahorro libre"
          className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setHasGoal(true)}
          className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
            hasGoal ? "bg-goldsoft border-gold text-gold" : "border-line text-inksoft"
          }`}
        >
          Con meta
        </button>
        <button
          type="button"
          onClick={() => setHasGoal(false)}
          className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
            !hasGoal ? "bg-goldsoft border-gold text-gold" : "border-line text-inksoft"
          }`}
        >
          Sin meta
        </button>
      </div>

      {hasGoal && (
        <div>
          <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">Monto meta (₡)</label>
          <input
            type="number"
            min="0"
            step="1"
            required={hasGoal}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-line bg-white font-mono focus:outline-gold"
          />
        </div>
      )}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg font-semibold border border-line text-inksoft"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-lg font-semibold text-white bg-green disabled:opacity-50"
        >
          {saving ? "Creando…" : "Crear ahorro"}
        </button>
      </div>
    </form>
  );
}
