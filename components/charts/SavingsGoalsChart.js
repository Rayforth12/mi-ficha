"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function SavingsGoalsChart({ data }) {
  if (!data.length) {
    return (
      <div className="h-[240px] flex items-center justify-center text-inksoft text-sm italic">
        Creá un ahorro con meta para ver esta gráfica.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C9C0A8" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#5B6A61" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#5B6A61" }} width={110} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => "₡" + Number(v).toLocaleString("es-CR")} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Ahorrado" stackId="a" fill="#146C43" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Falta" stackId="a" fill="#EFE9DC" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
