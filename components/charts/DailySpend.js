"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DailySpend({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C9C0A8" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#5B6A61" }} axisLine={{ stroke: "#C9C0A8" }} interval={2} />
        <YAxis tick={{ fontSize: 11, fill: "#5B6A61" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip formatter={(v) => "₡" + Number(v).toLocaleString("es-CR")} labelFormatter={(l) => "Día " + l} />
        <Bar dataKey="Gastos" fill="#A63A2E" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
