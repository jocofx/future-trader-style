import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Target, Activity, DollarSign, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const kpis = [
    { label: "Balance total", value: "$48,210", delta: "+12.4%", up: true, icon: DollarSign, sub: "vs mes anterior" },
    { label: "Win Rate", value: "68.4%", delta: "+2.1%", up: true, icon: Target, sub: "Últimas 30 ops" },
    { label: "Profit Factor", value: "2.42", delta: "+0.18", up: true, icon: TrendingUp, sub: "Robusto" },
    { label: "Avg R-Multiple", value: "+1.8R", delta: "−0.2R", up: false, icon: Activity, sub: "Objetivo: 2R" },
  ];

  const recent = [
    { sym: "EURUSD", side: "LONG", r: "+2.3R", pl: "+$420", t: "10:24" },
    { sym: "NAS100", side: "SHORT", r: "+1.5R", pl: "+$280", t: "09:48" },
    { sym: "BTCUSD", side: "LONG", r: "−0.8R", pl: "−$140", t: "08:12" },
    { sym: "GOLD", side: "LONG", r: "+3.1R", pl: "+$610", t: "Ayer" },
    { sym: "SPX500", side: "SHORT", r: "+0.6R", pl: "+$110", t: "Ayer" },
  ];

  const equity = Array.from({ length: 60 }, (_, i) => {
    const base = 30 + i * 0.8;
    const noise = Math.sin(i * 0.7) * 4 + Math.cos(i * 0.3) * 2;
    return Math.max(8, 90 - (base + noise));
  });
  const eqPath = equity.map((y, i) => `${i ? "L" : "M"}${(i / (equity.length - 1)) * 100} ${y}`).join(" ");
  const eqArea = `${eqPath} L100 100 L0 100 Z`;

  return (
    <div className="relative">
      {/* Mesh background accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-mesh opacity-60" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bienvenido de vuelta</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Resumen de tu performance — actualizado hace unos segundos.</p>
          </div>
          <div className="flex gap-2">
            <button className="glass rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition">7D</button>
            <button className="bg-primary/15 text-primary border border-primary/25 rounded-lg px-3 py-2 text-xs font-mono">30D</button>
            <button className="glass rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition">90D</button>
            <button className="glass rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition">YTD</button>
          </div>
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
              <div className="mt-1 font-mono text-2xl font-semibold tabular tracking-tight">{k.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Main row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Equity curve */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Curva de equity</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <div className="font-mono text-2xl font-semibold tabular">$48,210</div>
                  <span className="font-mono text-sm text-success">+$5,310 (+12.4%)</span>
                </div>
              </div>
              <div className="hidden sm:flex gap-1 text-[11px] font-mono">
                {["1D","1W","1M","3M","ALL"].map((t,i) => (
                  <span key={t} className={`px-2 py-1 rounded-md cursor-pointer transition ${i===2 ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t}</span>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 w-full h-56">
              <defs>
                <linearGradient id="eqg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.18 158)" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="oklch(0.78 0.18 158)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20,40,60,80].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" strokeWidth="0.3" />)}
              <path d={eqArea} fill="url(#eqg)" />
              <path d={eqPath} fill="none" stroke="oklch(0.85 0.20 160)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* Coach IA card */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="font-semibold text-sm">Coach IA</div>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">EN VIVO</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                Tu <span className="text-primary font-semibold">win rate en LONG</span> sube al 78% antes de las 11:00 GMT.
                Considera concentrar setups en esa franja y reducir tamaño tras 2 pérdidas seguidas.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="rounded-md bg-surface/60 p-2 border border-border">
                  <div className="text-muted-foreground">Sesgo</div>
                  <div className="text-foreground mt-0.5">FOMO ↓ 30%</div>
                </div>
                <div className="rounded-md bg-surface/60 p-2 border border-border">
                  <div className="text-muted-foreground">Disciplina</div>
                  <div className="text-success mt-0.5">9.1 / 10</div>
                </div>
              </div>
              <button className="mt-4 w-full rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold py-2 shadow-glow hover:brightness-110 transition">
                Hablar con Coach
              </button>
            </div>
          </div>
        </div>

        {/* Recent trades + heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Operaciones recientes</div>
              <button className="text-xs text-primary hover:underline">Ver todas →</button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left font-medium py-2">Símbolo</th>
                    <th className="text-left font-medium py-2">Lado</th>
                    <th className="text-right font-medium py-2">R</th>
                    <th className="text-right font-medium py-2">P&L</th>
                    <th className="text-right font-medium py-2">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => {
                    const positive = r.pl.startsWith("+");
                    return (
                      <tr key={i} className="border-b border-border/60 hover:bg-surface/40 transition">
                        <td className="py-3 font-semibold">{r.sym}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${r.side === "LONG" ? "text-success border-success/30 bg-success/10" : "text-info border-info/30 bg-info/10"}`}>{r.side}</span>
                        </td>
                        <td className={`py-3 text-right font-mono tabular ${positive ? "text-success" : "text-destructive"}`}>{r.r}</td>
                        <td className={`py-3 text-right font-mono tabular font-semibold ${positive ? "text-success" : "text-destructive"}`}>{r.pl}</td>
                        <td className="py-3 text-right font-mono text-muted-foreground text-xs">{r.t}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-sm font-semibold">Calendario P&L</div>
            <div className="text-[11px] text-muted-foreground">Últimos 35 días</div>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => {
                const r = ((i * 9301 + 49297) % 233280) / 233280;
                const intensity = r > 0.7 ? 0.9 : r > 0.5 ? 0.6 : r > 0.3 ? 0.3 : 0.1;
                const loss = i % 9 === 0;
                return (
                  <div key={i} className="aspect-square rounded-md transition hover:scale-110"
                    style={{ background: loss
                      ? `color-mix(in oklab, var(--destructive) ${intensity * 65}%, transparent)`
                      : `color-mix(in oklab, var(--primary) ${intensity * 85}%, transparent)` }} />
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                {[0.15, 0.4, 0.65, 0.9].map((o) => (
                  <span key={o} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--primary) ${o * 100}%, transparent)` }} />
                ))}
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
