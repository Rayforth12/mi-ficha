"use client";

import { catInfo, fmt } from "@/lib/categories";

export default function Ledger({ transactions, onDelete, onEdit, monthLabel, monthBalance }) {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-5 pt-4 pb-2">
        <span className="font-display font-semibold text-lg">Movimientos — {monthLabel}</span>
        <span className="text-xs text-inksoft">
          {sorted.length} registro{sorted.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="px-5">
        {sorted.length === 0 ? (
          <p className="text-inksoft text-sm italic py-3">Nada registrado todavía en este mes.</p>
        ) : (
          sorted.map((t) => {
            const info = catInfo(t.type, t.category);
            const d = new Date(t.date + "T00:00:00");
            const dateLabel = d.toLocaleDateString("es-CR", { day: "2-digit", month: "short" });
            return (
              <div key={t.id} className="flex justify-between items-center gap-3 py-2.5 dashed-divider font-mono text-sm">
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="font-body text-[0.9rem] text-ink truncate">
                    {info.emoji} {t.description || info.label}
                  </span>
                  <span className="font-body text-[0.7rem] text-inksoft">
                    {info.label} · {dateLabel}
                  </span>
                </div>
                <span className={`whitespace-nowrap font-semibold ${t.type === "income" ? "text-green" : "text-red"}`}>
                  {t.type === "income" ? "+" : "-"}
                  {fmt(t.amount)}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onEdit(t)}
                    title="Editar"
                    className="text-inksoft opacity-40 hover:opacity-100 hover:text-gold px-1"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    title="Eliminar"
                    className="text-inksoft opacity-40 hover:opacity-100 hover:text-red px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-between px-5 py-3 border-t-2 border-ink font-mono font-bold mt-2">
        <span>TOTAL DEL MES</span>
        <span className={monthBalance < 0 ? "text-red" : "text-green"}>{fmt(monthBalance)}</span>
      </div>
    </div>
  );
}
