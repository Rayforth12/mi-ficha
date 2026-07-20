"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { CATS_EXPENSE, CAT_COLORS, MESES, fmt, catInfo } from "@/lib/categories";
import TransactionForm from "@/components/TransactionForm";
import Ledger from "@/components/Ledger";
import IncomeExpenseBar from "@/components/charts/IncomeExpenseBar";
import CategoryDonut from "@/components/charts/CategoryDonut";
import BalanceTrend from "@/components/charts/BalanceTrend";
import CategoryTrend from "@/components/charts/CategoryTrend";
import DailySpend from "@/components/charts/DailySpend";
import SavingsRate from "@/components/charts/SavingsRate";
import SavingsSection from "@/components/savings/SavingsSection";

function monthKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export default function DashboardClient({ userEmail }) {
  const supabase = createClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("movimientos"); // 'movimientos' | 'ahorros'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTx, setEditingTx] = useState(null);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    if (!error) setTransactions(data || []);
    setLoading(false);
  }

  async function handleAdd({ type, category, amount, description, date }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("transactions")
      .insert({ user_id: user.id, type, category, amount, description, date })
      .select()
      .single();
    if (!error && data) setTransactions((prev) => [data, ...prev]);
  }

  async function handleUpdate({ id, type, category, amount, description, date }) {
    const { data, error } = await supabase
      .from("transactions")
      .update({ type, category, amount, description, date })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
      setEditingTx(null);
    }
  }

  async function handleDelete(id) {
    if (editingTx?.id === id) setEditingTx(null);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.slice(0, 7) === monthKey(viewDate)),
    [transactions, viewDate]
  );
  const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const monthBalance = totalIncome - totalExpense;
  const allBalance = transactions.reduce(
    (s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  );
  const monthLabel = MESES[viewDate.getMonth()] + " " + viewDate.getFullYear();

  // ---- Chart data ----

  const last6 = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(viewDate.getFullYear(), viewDate.getMonth() - i, 1);
      months.push(d);
    }
    return months;
  }, [viewDate]);

  const incomeExpenseData = last6.map((d) => {
    const key = monthKey(d);
    const tx = transactions.filter((t) => t.date.slice(0, 7) === key);
    return {
      label: MESES[d.getMonth()].slice(0, 3),
      Ingresos: tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
      Gastos: tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const categoryDonutData = useMemo(() => {
    const byCat = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        name: catInfo("expense", cat).label,
        amount,
        color: CAT_COLORS[cat] || "#6B6355",
      }));
  }, [monthTx]);

  const balanceTrendData = useMemo(() => {
    const sortedAll = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const byMonthCum = {};
    sortedAll.forEach((t) => {
      running += t.type === "income" ? Number(t.amount) : -Number(t.amount);
      byMonthCum[t.date.slice(0, 7)] = running;
    });
    let lastKnown = 0;
    return last6.map((d) => {
      const key = monthKey(d);
      if (byMonthCum[key] !== undefined) lastKnown = byMonthCum[key];
      return { label: MESES[d.getMonth()].slice(0, 3), Balance: lastKnown };
    });
  }, [transactions, last6]);

  const categoryTrendData = last6.map((d) => {
    const key = monthKey(d);
    const tx = transactions.filter((t) => t.date.slice(0, 7) === key && t.type === "expense");
    const row = { label: MESES[d.getMonth()].slice(0, 3) };
    CATS_EXPENSE.forEach((c) => {
      row[c.label] = tx.filter((t) => t.category === c.id).reduce((s, t) => s + Number(t.amount), 0);
    });
    return row;
  });

  const dailySpendData = useMemo(() => {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, Gastos: 0 }));
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const day = Number(t.date.slice(8, 10));
        if (days[day - 1]) days[day - 1].Gastos += Number(t.amount);
      });
    return days;
  }, [monthTx, viewDate]);

  const savingsRateData = last6.map((d) => {
    const key = monthKey(d);
    const tx = transactions.filter((t) => t.date.slice(0, 7) === key);
    const inc = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const exp = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
    return { label: MESES[d.getMonth()].slice(0, 3), "Tasa de ahorro": rate };
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-inksoft">Abriendo tu libro de cuentas…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <header className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-4xl">Mi Ficha</h1>
          <p className="text-inksoft text-sm mt-1">
            {userEmail} ·{" "}
            <button onClick={handleLogout} className="underline hover:text-red">
              Cerrar sesión
            </button>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-inksoft">Balance total</div>
          <div className={`font-mono font-semibold text-3xl ${allBalance < 0 ? "text-red" : "text-green"}`}>
            {fmt(allBalance)}
          </div>
        </div>
      </header>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("movimientos")}
          className={`py-2 px-5 rounded-lg border font-semibold text-sm ${
            activeTab === "movimientos" ? "bg-ink text-white border-ink" : "border-line text-inksoft bg-card"
          }`}
        >
          Movimientos
        </button>
        <button
          onClick={() => setActiveTab("ahorros")}
          className={`py-2 px-5 rounded-lg border font-semibold text-sm ${
            activeTab === "ahorros" ? "bg-ink text-white border-ink" : "border-line text-inksoft bg-card"
          }`}
        >
          Ahorros
        </button>
      </div>

      {activeTab === "ahorros" ? (
        <SavingsSection />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-card border border-line rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-inksoft mb-1">Ingresos del mes</div>
              <div className="font-mono font-semibold text-2xl text-green">{fmt(totalIncome)}</div>
            </div>
            <div className="bg-card border border-line rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-inksoft mb-1">Gastos del mes</div>
              <div className="font-mono font-semibold text-2xl text-red">{fmt(totalExpense)}</div>
            </div>
            <div className="bg-card border border-line rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-inksoft mb-1">Balance del mes</div>
              <div className={`font-mono font-semibold text-2xl ${monthBalance < 0 ? "text-red" : "text-green"}`}>
                {fmt(monthBalance)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="w-9 h-9 rounded-lg border border-line bg-card hover:bg-greensoft"
            >
              ‹
            </button>
            <div className="font-display font-semibold text-lg min-w-[170px] text-center capitalize">{monthLabel}</div>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="w-9 h-9 rounded-lg border border-line bg-card hover:bg-greensoft"
            >
              ›
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <TransactionForm
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              editingTx={editingTx}
              onCancelEdit={() => setEditingTx(null)}
            />
            <Ledger
              transactions={monthTx}
              onDelete={handleDelete}
              onEdit={setEditingTx}
              monthLabel={monthLabel}
              monthBalance={monthBalance}
            />
          </div>

          <h2 className="font-display font-semibold text-2xl mb-4">Gráficas</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">Ingresos vs. gastos (últimos 6 meses)</h3>
              <IncomeExpenseBar data={incomeExpenseData} />
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">Gastos por categoría — {monthLabel}</h3>
              <CategoryDonut data={categoryDonutData} />
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">Balance acumulado</h3>
              <BalanceTrend data={balanceTrendData} />
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">Categorías a través del tiempo</h3>
              <CategoryTrend data={categoryTrendData} />
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">Gastos por día — {monthLabel}</h3>
              <DailySpend data={dailySpendData} />
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">Tasa de ahorro mensual</h3>
              <SavingsRate data={savingsRateData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
