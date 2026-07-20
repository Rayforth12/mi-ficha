"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { fmt } from "@/lib/categories";
import PotCard from "./PotCard";
import NewPotForm from "./NewPotForm";
import SavingsGoalsChart from "@/components/charts/SavingsGoalsChart";

export default function SavingsSection() {
  const supabase = createClient();
  const [pots, setPots] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    const [potsRes, contribRes] = await Promise.all([
      supabase.from("savings_pots").select("*").order("created_at", { ascending: true }),
      supabase.from("savings_contributions").select("*"),
    ]);
    if (!potsRes.error) setPots(potsRes.data || []);
    if (!contribRes.error) setContributions(contribRes.data || []);
    setLoading(false);
  }

  async function handleCreatePot({ name, target_amount }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("savings_pots")
      .insert({ user_id: user.id, name, target_amount })
      .select()
      .single();
    if (!error && data) {
      setPots((prev) => [...prev, data]);
      setShowNewForm(false);
    }
  }

  async function handleDeletePot(potId) {
    setPots((prev) => prev.filter((p) => p.id !== potId));
    setContributions((prev) => prev.filter((c) => c.pot_id !== potId));
    await supabase.from("savings_pots").delete().eq("id", potId);
  }

  async function handleAddContribution(potId, { amount, note, date }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("savings_contributions")
      .insert({ user_id: user.id, pot_id: potId, amount, note, date })
      .select()
      .single();
    if (!error && data) setContributions((prev) => [...prev, data]);
  }

  async function handleDeleteContribution(contribId) {
    setContributions((prev) => prev.filter((c) => c.id !== contribId));
    await supabase.from("savings_contributions").delete().eq("id", contribId);
  }

  const totalSaved = contributions.reduce((s, c) => s + Number(c.amount), 0);

  const goalsChartData = pots
    .filter((p) => p.target_amount !== null && p.target_amount !== undefined)
    .map((p) => {
      const saved = contributions
        .filter((c) => c.pot_id === p.id)
        .reduce((s, c) => s + Number(c.amount), 0);
      return {
        name: p.name,
        Ahorrado: Math.min(saved, p.target_amount),
        Falta: Math.max(0, p.target_amount - saved),
      };
    });

  if (loading) {
    return <div className="text-inksoft text-sm py-10 text-center">Cargando tus ahorros…</div>;
  }

  return (
    <div>
      <div className="bg-card border border-line rounded-xl p-5 mb-5 flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-inksoft mb-1">Total ahorrado (todos los ahorros)</div>
          <div className="font-mono font-semibold text-3xl text-green">{fmt(totalSaved)}</div>
        </div>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="py-2.5 px-5 rounded-lg font-semibold text-white bg-green"
        >
          {showNewForm ? "Cerrar" : "+ Nuevo ahorro"}
        </button>
      </div>

      {showNewForm && (
        <div className="mb-5">
          <NewPotForm onCreate={handleCreatePot} onClose={() => setShowNewForm(false)} />
        </div>
      )}

      {pots.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-5 mb-5">
          <h3 className="font-display font-semibold mb-2">Progreso hacia tus metas</h3>
          <SavingsGoalsChart data={goalsChartData} />
        </div>
      )}

      {pots.length === 0 ? (
        <p className="text-inksoft text-sm italic text-center py-10">
          Todavía no tenés ningún ahorro creado. Hacé clic en "+ Nuevo ahorro" para empezar — podés ponerle una meta
          (ej. "Viaje a Panamá — ₡500,000") o dejarlo libre, sin meta fija.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {pots.map((p) => (
            <PotCard
              key={p.id}
              pot={p}
              contributions={contributions.filter((c) => c.pot_id === p.id)}
              onAddContribution={handleAddContribution}
              onDeleteContribution={handleDeleteContribution}
              onDeletePot={handleDeletePot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
