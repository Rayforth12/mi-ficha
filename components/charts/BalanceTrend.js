"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function BalanceTrend({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#B98900" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#B98900" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#C9C0A8" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5B6A61" }} axisLine={{ stroke: "#C9C0A8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#5B6A61" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip formatter={(v) => "₡" + Number(v).toLocaleString("es-CR")} />
        <Area type="monotone" dataKey="Balance" stroke="#B98900" fill="url(#balanceFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
