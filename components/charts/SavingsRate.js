"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

export default function SavingsRate({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C9C0A8" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5B6A61" }} axisLine={{ stroke: "#C9C0A8" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#5B6A61" }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v) => v + "%"}
        />
        <Tooltip formatter={(v) => v + "%"} />
        <ReferenceLine y={0} stroke="#C9C0A8" />
        <Line type="monotone" dataKey="Tasa de ahorro" stroke="#146C43" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
