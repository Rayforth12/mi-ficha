"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function IncomeExpenseBar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C9C0A8" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5B6A61" }} axisLine={{ stroke: "#C9C0A8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#5B6A61" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip formatter={(v) => "₡" + Number(v).toLocaleString("es-CR")} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Ingresos" fill="#146C43" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gastos" fill="#A63A2E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
