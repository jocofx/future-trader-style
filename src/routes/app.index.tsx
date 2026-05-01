import { createFileRoute, useSearch } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Target, Activity, DollarSign, Sparkles, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { computeStats } from "@/lib/types";
import type { Trade } from "@/lib/types";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (sign) return (n >= 0 ? "+" : "-") + "$" + abs;
  return "$" + abs;
}
function fmtPct(n: number) { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%" }

function sessionLabel(t: Trade) {
  if (t.sesion) return t.sesion;
  const h = parseInt((t.hora ?? "00:00").split(":")[0]);
  if (h >= 1  && h < 8)  return "Asia";
  if (h >= 8  && h < 12) return "Londres";
  if (h >= 13 && h < 17) return "Nueva York";
  return "Tarde";
}

// ── Equity curve (SVG inline) ─────────────────────────────────────
function EquityCurve({ trades }: { trades: Trade[] }) {
  const points = useMemo(() => {
    const sorted = [...trades].filter(t => t.resultado != null).sort((a, b) => a.fecha.localeCompare(b.fecha));
    let cum = 0;
    return sorted.map(t => { cum += t.resultado ?? 0; return cum; });
  }, [trades]);

  if (points.length < 2) return (
    <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
      Sin suficientes datos
    </div>
  );

  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const range = max - min || 1;
  const W = 100; const H = 100;
  const pathD = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  const areaD = `${pathD} L${W} ${H} L0 ${H} Z`;
  const positive = (points[points.length - 1] ?? 0) >= 0;
  const color = positive ? "oklch(0.78 0.18 158)" : "oklch(0.68 0.22 18)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-56">
      <defs>
        <linearGradient id="eqg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map(y => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" strokeWidth="0.3" />
      ))}
      <path d={areaD} fill="url(#eqg)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────
function DashboardPage() {
  const { trades: { trades, load, loading }, user } = useApp();

  // Month filter
  const monthTrades = useMemo(() => {
    const now = new Date();
    return trades.filter(t => {
      const d = new Date((t.fecha ?? "").slice(0, 10) + "T12:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [trades]);

  const stats = useMemo(() => computeStats(trades), [trades]);
  const monthStats = useMemo(() => computeStats(monthTrades), [monthTrades]);

  // Sessions
  const sessions = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach(t => {
      const s = sessionLabel(t);
      map[s] = (map[s] ?? 0) + 1;
    });
    return map;
  }, [trades]);

  // Recent trades (last 8)
  const recent = trades.slice(0, 8);

  // Today's ops
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTrades = trades.filter(t => t.fecha === todayStr);

  const kpis = [
    {
      label: "P&L Total",
      value: fmt(stats.pnl, true),
      delta: `${monthStats.total} ops este mes`,
      up: stats.pnl >= 0,
      icon: DollarSign,
      sub: `Win rate: ${(stats.winRate * 100).toFixed(1)}%`,
    },
    {
      label: "Win Rate",
      value: (stats.winRate * 100).toFixed(1) + "%",
      delta: `${stats.wins}W / ${stats.losses}L`,
      up: stats.winRate >= 0.5,
      icon: Target,
      sub: `${stats.total} operaciones`,
    },
    {
      label: "Profit Factor",
      value: stats.profitFactor > 99 ? "∞" : stats.profitFactor.toFixed(2),
      delta: stats.profitFactor >= 1.5 ? "Robusto ✓" : stats.profitFactor >= 1 ? "Aceptable" : "Mejorar",
      up: stats.profitFactor >= 1,
      icon: TrendingUp,
      sub: "Ganancias / Pérdidas",
    },
    {
      label: "Ops hoy",
      value: todayTrades.length.toString(),
      delta: fmt(todayTrades.reduce((s, t) => s + (t.resultado ?? 0), 0), true),
      up: todayTrades.reduce((s, t) => s + (t.resultado ?? 0), 0) >= 0,
      icon: Activity,
      sub: `Expectancy: ${fmt(stats.expectancy, true)}`,
    },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-mesh opacity-60" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {user?.email ?? "Bienvenido"}
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Resumen de tu performance · {trades.length} operaciones en total
            </p>
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="glass rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/30 transition">
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition" />
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <k.icon className="h-4 w-4" />
                </div>
                <span className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md border ${k.up ? "text-success border-success/30 bg-success/10" : "text-destructive border-destructive/30 bg-destructive/10"}`}>
                  {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {k.delta}
                </span>
              </div>
              <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className={`mt-1 font-mono text-2xl font-semibold tabular tracking-tight ${k.up ? "text-success" : "text-destructive"}`}>
                {k.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Main row: Equity + Coach IA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Equity */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Curva de equity</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <div className={`font-mono text-2xl font-semibold tabular ${stats.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {fmt(stats.pnl, true)}
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    {stats.total} ops · WR {fmtPct(stats.winRate * 100)}
                  </span>
                </div>
              </div>
            </div>
            <EquityCurve trades={trades} />
          </div>

          {/* Sessions */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="font-semibold text-sm">Por sesión</div>
            </div>
            <div className="space-y-3">
              {["Asia", "Londres", "Nueva York", "Tarde"].map(s => {
                const cnt = sessions[s] ?? 0;
                const pct = trades.length > 0 ? Math.round((cnt / trades.length) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{s}</span>
                      <span className="font-mono">{pct}% · {cnt} ops</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Month stats */}
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Este mes</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-lg bg-surface/60 p-2.5 border border-border">
                  <div className="text-muted-foreground">Ops</div>
                  <div className="font-bold mt-0.5">{monthStats.total}</div>
                </div>
                <div className="rounded-lg bg-surface/60 p-2.5 border border-border">
                  <div className="text-muted-foreground">P&L</div>
                  <div className={`font-bold mt-0.5 ${monthStats.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {fmt(monthStats.pnl, true)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent trades */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Operaciones recientes</div>
            <span className="text-xs text-muted-foreground font-mono">{trades.length} en total</span>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Sin operaciones registradas todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left font-medium py-2 px-1">Fecha</th>
                    <th className="text-left font-medium py-2 px-1">Símbolo</th>
                    <th className="text-left font-medium py-2 px-1">Lado</th>
                    <th className="text-right font-medium py-2 px-1">R:R</th>
                    <th className="text-right font-medium py-2 px-1">P&L</th>
                    <th className="text-left font-medium py-2 px-1 hidden sm:table-cell">Sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => {
                    const pos = (t.resultado ?? 0) >= 0;
                    return (
                      <tr key={t.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                        <td className="py-2.5 px-1 text-muted-foreground font-mono text-xs">{t.fecha}</td>
                        <td className="py-2.5 px-1 font-semibold">{t.instrumento}</td>
                        <td className="py-2.5 px-1">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.tipo === "BUY" ? "text-success border-success/30 bg-success/10" : "text-info border-info/30 bg-info/10"}`}>
                            {t.tipo}
                          </span>
                        </td>
                        <td className={`py-2.5 px-1 text-right font-mono text-xs ${pos ? "text-success" : "text-destructive"}`}>
                          {t.rr != null ? `${t.rr >= 0 ? "+" : ""}${t.rr.toFixed(1)}R` : "—"}
                        </td>
                        <td className={`py-2.5 px-1 text-right font-mono font-semibold ${pos ? "text-success" : "text-destructive"}`}>
                          {t.resultado != null ? fmt(t.resultado, true) : "—"}
                        </td>
                        <td className="py-2.5 px-1 hidden sm:table-cell">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface/80 border border-border text-muted-foreground">
                            {sessionLabel(t)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
