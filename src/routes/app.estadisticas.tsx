import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { computeStats } from "@/lib/types";
import type { Trade } from "@/lib/types";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/app/estadisticas")({
  component: EstadisticasPage,
});

type Period = "day" | "week" | "month" | "3month" | "year" | "all";

function fmt(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (sign ? (n >= 0 ? "+" : "-") : (n < 0 ? "-" : "")) + "$" + abs;
}

function filterByPeriod(trades: Trade[], period: Period, account: string): Trade[] {
  const now = new Date();
  return trades.filter(t => {
    if (account && t.cuenta !== account) return false;
    if (period === "all") return true;
    const d = new Date(t.fecha);
    if (period === "day")    return d.toDateString() === now.toDateString();
    if (period === "week")   { const w = new Date(now); w.setDate(now.getDate()-7); return d >= w; }
    if (period === "month")  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "3month") { const m = new Date(now); m.setMonth(now.getMonth()-3); return d >= m; }
    if (period === "year")   return d.getFullYear() === now.getFullYear();
    return true;
  });
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Hoy" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "3month", label: "3M" },
  { key: "year", label: "Año" },
  { key: "all", label: "Todo" },
];

const GREEN = "oklch(0.78 0.18 158)";
const RED   = "oklch(0.68 0.22 18)";
const BLUE  = "oklch(0.74 0.14 240)";

function StatCard({ label, value, sub, color = "text-foreground" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-bold font-mono tabular ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function EstadisticasPage() {
  const { trades: { trades }, accounts: { accounts } } = useApp();
  const [period, setPeriod]   = useState<Period>("month");
  const [account, setAccount] = useState("");

  const filtered = useMemo(() => filterByPeriod(trades, period, account), [trades, period, account]);
  const stats     = useMemo(() => computeStats(filtered), [filtered]);

  // Equity curve data
  const equityData = useMemo(() => {
    const sorted = [...filtered].filter(t => t.resultado != null).sort((a, b) => a.fecha.localeCompare(b.fecha));
    let cum = 0;
    return sorted.map(t => ({ fecha: t.fecha.slice(5), value: parseFloat((cum += t.resultado ?? 0).toFixed(2)) }));
  }, [filtered]);

  // Drawdown
  const ddData = useMemo(() => {
    let peak = 0;
    return equityData.map(p => {
      peak = Math.max(peak, p.value);
      const dd = peak > 0 ? parseFloat(((p.value - peak) / peak * 100).toFixed(2)) : 0;
      return { fecha: p.fecha, value: dd };
    });
  }, [equityData]);

  // By weekday
  const weekdayData = useMemo(() => {
    const days = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
    const map: Record<number, number> = {};
    filtered.forEach(t => {
      const d = new Date(t.fecha).getDay();
      const idx = d === 0 ? 6 : d - 1;
      map[idx] = (map[idx] ?? 0) + (t.resultado ?? 0);
    });
    return days.map((name, i) => ({ name, value: parseFloat((map[i] ?? 0).toFixed(2)) }));
  }, [filtered]);

  // By instrument
  const instrData = useMemo(() => {
    const map: Record<string, { pnl: number; total: number; wins: number }> = {};
    filtered.forEach(t => {
      const s = t.instrumento || "—";
      if (!map[s]) map[s] = { pnl: 0, total: 0, wins: 0 };
      map[s].pnl += t.resultado ?? 0;
      map[s].total++;
      if ((t.resultado ?? 0) > 0) map[s].wins++;
    });
    return Object.entries(map).sort((a, b) => Math.abs(b[1].pnl) - Math.abs(a[1].pnl)).slice(0, 8);
  }, [filtered]);

  // Win/Loss donut
  const donutData = [
    { name: "Wins",   value: stats.wins   || 0 },
    { name: "Losses", value: stats.losses || 0 },
  ];

  const maxAbsInstr = Math.max(...instrData.map(([, d]) => Math.abs(d.pnl)), 1);

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5 text-primary" /> Análisis
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} operaciones analizadas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Account filter */}
          <select value={account} onChange={e => setAccount(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface/70 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
            <option value="">Todas las cuentas</option>
            {accounts.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
          </select>
          {/* Period pills */}
          <div className="flex bg-surface/60 border border-border rounded-xl p-1 gap-0.5">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${period === p.key ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
            ● ANÁLISIS COMPLETO
          </span>
        </div>
      </div>

      {/* Row 1 — 4 main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="P&L Neto"      value={fmt(stats.pnl, true)}                         sub={`${stats.total} operaciones`}    color={stats.pnl >= 0 ? "text-success" : "text-destructive"} />
        <StatCard label="Win Rate"       value={(stats.winRate*100).toFixed(1)+"%"}             sub={`${stats.wins}W / ${stats.losses}L`} color="text-info" />
        <StatCard label="Profit Factor"  value={stats.profitFactor > 99 ? "∞" : stats.profitFactor.toFixed(2)} sub="Ganancias / Pérdidas" color={stats.profitFactor >= 1.5 ? "text-success" : stats.profitFactor >= 1 ? "text-warning" : "text-destructive"} />
        <StatCard label="Mejor Trade"    value={fmt(stats.bestTrade, true)}                    sub="máximo ganado"                   color="text-success" />
      </div>

      {/* Row 2 — 4 secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Peor Trade"     value={fmt(stats.worstTrade)}                         sub="máxima pérdida"                  color="text-destructive" />
        <StatCard label="Promedio Win"   value={fmt(stats.avgWin, true)}                       sub="por op ganada"                   color="text-success" />
        <StatCard label="Promedio Loss"  value={fmt(stats.avgLoss)}                            sub="por op perdida"                  color="text-destructive" />
        <StatCard label="Expectancy"     value={fmt(stats.expectancy, true)}                   sub="ganancia media esperada"         color={stats.expectancy >= 0 ? "text-info" : "text-destructive"} />
      </div>

      {/* Row 3 — Equity + Drawdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-1">Curva de Equity</div>
          <div className="text-xs text-muted-foreground mb-4">P&L acumulado en el tiempo</div>
          {equityData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos suficientes</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [fmt(v, true), "P&L"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area dataKey="value" stroke={GREEN} fill="url(#eq)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-1">Drawdown</div>
          <div className="text-xs text-muted-foreground mb-4">% de caída desde máximo</div>
          {ddData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={ddData}>
                <defs>
                  <linearGradient id="dd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Drawdown"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area dataKey="value" stroke={RED} fill="url(#dd)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 4 — By instrument + By session + Win/Loss donut */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-sm font-semibold">Por instrumento</div>
          <div className="p-4 space-y-3">
            {instrData.length === 0 ? <div className="text-muted-foreground text-sm text-center py-4">Sin datos</div> :
              instrData.map(([sym, d]) => {
                const pct = Math.round(Math.abs(d.pnl) / maxAbsInstr * 100);
                const pos = d.pnl >= 0;
                return (
                  <div key={sym}>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="font-semibold">{sym}</span>
                      <div className="flex gap-2 text-muted-foreground">
                        <span>{Math.round(d.wins/d.total*100)}% WR</span>
                        <span className={pos ? "text-success font-bold" : "text-destructive font-bold"}>{fmt(d.pnl, true)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pos ? GREEN : RED }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-sm font-semibold">P&L por día de semana</div>
          <div className="p-4">
            {weekdayData.every(d => d.value === 0) ? <div className="text-muted-foreground text-sm text-center py-4">Sin datos</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekdayData} barSize={20}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => [fmt(v, true), "P&L"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {weekdayData.map((d, i) => <Cell key={i} fill={d.value >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex flex-col items-center justify-center gap-4">
          <div className="text-sm font-semibold">Wins / Losses</div>
          {stats.total === 0 ? <div className="text-muted-foreground text-sm">Sin datos</div> : (
            <>
              <div className="relative">
                <PieChart width={120} height={120}>
                  <Pie data={donutData} cx={55} cy={55} innerRadius={38} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill={GREEN} />
                    <Cell fill={RED} />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold font-mono">{(stats.winRate*100).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground">WR</div>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{background:GREEN}} /><span className="text-muted-foreground">{stats.wins}W</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{background:RED}} /><span className="text-muted-foreground">{stats.losses}L</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 5 — Extra stats */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <div className="text-sm font-semibold mb-4">Estadísticas adicionales</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["RR Promedio",       stats.avgRR > 0 ? stats.avgRR.toFixed(2)+":1" : "—",   BLUE],
            ["Máx. Drawdown",     ddData.length ? fmt(Math.min(...ddData.map(d=>d.value))) : "—", RED],
            ["Ops por día",       filtered.length > 0 ? (filtered.length / Math.max(1, equityData.length)).toFixed(1) : "—", ""],
            ["Racha ganadora",    (()=>{ let b=0,c=0; [...filtered].sort((a,b2)=>a.fecha.localeCompare(b2.fecha)).forEach(t=>{ c=(t.resultado??0)>0?c+1:0; b=Math.max(b,c); }); return b+" ops"; })(), GREEN],
            ["Racha perdedora",   (()=>{ let b=0,c=0; [...filtered].sort((a,b2)=>a.fecha.localeCompare(b2.fecha)).forEach(t=>{ c=(t.resultado??0)<0?c+1:0; b=Math.max(b,c); }); return b+" ops"; })(), RED],
          ].map(([label, value, color]) => (
            <div key={label as string} className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
              <div className="text-xl font-bold font-mono" style={{ color: (color as string) || "var(--foreground)" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
