"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CATS_EXPENSE, CAT_COLORS } from "@/lib/categories";

export default function CategoryTrend({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C9C0A8" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5B6A61" }} axisLine={{ stroke: "#C9C0A8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#5B6A61" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip formatter={(v) => "₡" + Number(v).toLocaleString("es-CR")} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {CATS_EXPENSE.map((c) => (
          <Bar key={c.id} dataKey={c.label} stackId="a" fill={CAT_COLORS[c.id]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
