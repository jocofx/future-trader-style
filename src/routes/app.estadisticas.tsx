import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  TrendingUp, Target, Activity, Award, Percent, Clock, BarChart3,
  ArrowUpRight, ArrowDownRight, Sigma,
} from "lucide-react";

export const Route = createFileRoute("/app/estadisticas")({
  component: EstadisticasPage,
});

type Range = "7D" | "30D" | "90D" | "YTD" | "ALL";

/* ────── Synthetic but deterministic dataset ────── */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

type Trade = {
  id: number; sym: string; side: "LONG" | "SHORT"; pl: number; r: number;
  hour: number; dow: number; setup: string; session: string;
};

const SYMBOLS = ["EURUSD","NAS100","BTCUSD","GOLD","SPX500","USDJPY","ETHUSD","XAUUSD"];
const SETUPS = ["Breakout","Pullback","FVG","OrderBlock","Range","News","Trend"];
const SESSIONS = ["Asia","Londres","NY"];
const DOWS = ["Lun","Mar","Mié","Jue","Vie"];

function buildTrades(n: number): Trade[] {
  const r = rng(42);
  const out: Trade[] = [];
  for (let i = 0; i < n; i++) {
    const win = r() > 0.36;
    const mag = Math.floor(r() * 700) + 40;
    const rr = Number(((win ? 1 : -1) * (0.3 + r() * 2.8)).toFixed(2));
    out.push({
      id: i,
      sym: SYMBOLS[Math.floor(r() * SYMBOLS.length)],
      side: r() > 0.5 ? "LONG" : "SHORT",
      pl: win ? mag : -Math.floor(mag * 0.7),
      r: rr,
      hour: 7 + Math.floor(r() * 12),
      dow: Math.floor(r() * 5),
      setup: SETUPS[Math.floor(r() * SETUPS.length)],
      session: SESSIONS[Math.floor(r() * SESSIONS.length)],
    });
  }
  return out;
}

const ALL_TRADES = buildTrades(247);
const RANGE_SIZE: Record<Range, number> = { "7D": 18, "30D": 70, "90D": 160, "YTD": 220, "ALL": ALL_TRADES.length };

function EstadisticasPage() {
  const [range, setRange] = useState<Range>("30D");

  const trades = useMemo(() => ALL_TRADES.slice(-RANGE_SIZE[range]), [range]);

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.pl > 0);
    const losses = trades.filter((t) => t.pl < 0);
    const grossW = wins.reduce((a, t) => a + t.pl, 0);
    const grossL = Math.abs(losses.reduce((a, t) => a + t.pl, 0));
    const total = grossW - grossL;
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
    const profitFactor = grossL ? grossW / grossL : grossW;
    const avgWin = wins.length ? grossW / wins.length : 0;
    const avgLoss = losses.length ? grossL / losses.length : 0;
    const avgR = trades.length ? trades.reduce((a, t) => a + t.r, 0) / trades.length : 0;
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
    const best = trades.reduce((b, t) => (t.pl > (b?.pl ?? -Infinity) ? t : b), trades[0]);
    const worst = trades.reduce((b, t) => (t.pl < (b?.pl ?? Infinity) ? t : b), trades[0]);
    // streaks
    let curStreak = 0, bestWStreak = 0, worstLStreak = 0, lastSign = 0;
    for (const t of trades) {
      const s = t.pl > 0 ? 1 : -1;
      if (s === lastSign) curStreak++; else curStreak = 1;
      if (s > 0) bestWStreak = Math.max(bestWStreak, curStreak);
      else worstLStreak = Math.max(worstLStreak, curStreak);
      lastSign = s;
    }
    // equity & drawdown
    let eq = 0, peak = 0, dd = 0, maxDD = 0;
    const equity: number[] = [];
    for (const t of trades) {
      eq += t.pl;
      equity.push(eq);
      peak = Math.max(peak, eq);
      dd = peak - eq;
      maxDD = Math.max(maxDD, dd);
    }
    return { total, winRate, profitFactor, avgWin, avgLoss, avgR, expectancy, best, worst, bestWStreak, worstLStreak, equity, maxDD, wins: wins.length, losses: losses.length };
  }, [trades]);

  /* Aggregations */
  const bySymbol = useMemo(() => agg(trades, (t) => t.sym).sort((a, b) => b.pl - a.pl), [trades]);
  const bySetup = useMemo(() => agg(trades, (t) => t.setup).sort((a, b) => b.pl - a.pl), [trades]);
  const byHour = useMemo(() => {
    const map = new Map<number, { trades: number; pl: number; wins: number }>();
    for (let h = 7; h < 19; h++) map.set(h, { trades: 0, pl: 0, wins: 0 });
    for (const t of trades) {
      const e = map.get(t.hour);
      if (!e) continue;
      e.trades++; e.pl += t.pl; if (t.pl > 0) e.wins++;
    }
    return Array.from(map, ([h, v]) => ({ hour: h, ...v, winRate: v.trades ? (v.wins / v.trades) * 100 : 0 }));
  }, [trades]);
  const byDow = useMemo(() => {
    const map = new Map<number, { trades: number; pl: number; wins: number }>();
    for (let d = 0; d < 5; d++) map.set(d, { trades: 0, pl: 0, wins: 0 });
    for (const t of trades) {
      const e = map.get(t.dow);
      if (!e) continue;
      e.trades++; e.pl += t.pl; if (t.pl > 0) e.wins++;
    }
    return Array.from(map, ([d, v]) => ({ dow: d, ...v, winRate: v.trades ? (v.wins / v.trades) * 100 : 0 }));
  }, [trades]);

  // R distribution buckets
  const rBuckets = useMemo(() => {
    const buckets = [-3, -2, -1, 0, 1, 2, 3, 4];
    const counts = new Array(buckets.length).fill(0);
    for (const t of trades) {
      let idx = buckets.findIndex((b, i) => t.r < (buckets[i + 1] ?? Infinity));
      if (idx < 0) idx = buckets.length - 1;
      counts[idx]++;
    }
    return buckets.map((b, i) => ({ label: `${b >= 0 ? "+" : ""}${b}R`, value: counts[i], positive: b >= 0 }));
  }, [trades]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-mesh opacity-50" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Performance analytics</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Estadísticas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {trades.length} operaciones · {stats.wins}W · {stats.losses}L · datos en tiempo real
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl glass">
            {(["7D","30D","90D","YTD","ALL"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                  range === r ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KPI label="P&L Neto" value={fmtMoney(stats.total)} delta={`${trades.length} trades`} icon={Sigma} tone={stats.total >= 0 ? "success" : "destructive"} />
          <KPI label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} delta={`${stats.wins} de ${trades.length}`} icon={Target} tone="primary" />
          <KPI label="Profit Factor" value={stats.profitFactor.toFixed(2)} delta={stats.profitFactor >= 1.5 ? "Robusto" : "Mejorable"} icon={TrendingUp} tone={stats.profitFactor >= 1.5 ? "success" : "warning"} />
          <KPI label="Expectancy" value={fmtMoney(stats.expectancy)} delta="Por trade" icon={Activity} tone={stats.expectancy >= 0 ? "success" : "destructive"} />
        </div>

        {/* Equity curve + drawdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Curva de equity</div>
                <div className="mt-1 font-mono text-2xl font-semibold tabular">{fmtMoney(stats.total)}</div>
                <div className="text-[11px] text-muted-foreground">Max drawdown <span className="text-destructive font-mono">−${stats.maxDD.toLocaleString()}</span></div>
              </div>
            </div>
            <EquityChart data={stats.equity} />
          </div>

          {/* R distribution */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Distribución de R</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular">{stats.avgR > 0 ? "+" : ""}{stats.avgR.toFixed(2)}R</div>
            <div className="text-[11px] text-muted-foreground">R-multiple promedio</div>
            <div className="mt-5 space-y-2">
              {rBuckets.map((b) => {
                const max = Math.max(...rBuckets.map((x) => x.value)) || 1;
                return (
                  <div key={b.label} className="flex items-center gap-2 text-xs">
                    <div className="w-10 font-mono text-muted-foreground text-right">{b.label}</div>
                    <div className="flex-1 h-5 rounded-md bg-surface/50 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${(b.value / max) * 100}%`,
                          background: b.positive ? "color-mix(in oklab, var(--primary) 70%, transparent)" : "color-mix(in oklab, var(--destructive) 70%, transparent)",
                        }}
                      />
                    </div>
                    <div className="w-7 text-right font-mono text-foreground/80">{b.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Avg win/loss + streaks + best/worst */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg Win / Loss</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground flex justify-between"><span>Ganancia</span><span className="font-mono text-success">{fmtMoney(stats.avgWin)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-surface/60 overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${pctBar(stats.avgWin, stats.avgLoss)}%` }} />
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground flex justify-between"><span>Pérdida</span><span className="font-mono text-destructive">{fmtMoney(-stats.avgLoss)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-surface/60 overflow-hidden">
                  <div className="h-full bg-destructive/80" style={{ width: `${pctBar(stats.avgLoss, stats.avgWin)}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground">
              Ratio R:R promedio <span className="font-mono text-foreground">{(stats.avgWin / Math.max(1, stats.avgLoss)).toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Rachas</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-success/25 bg-success/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-success/80">Mejor racha</div>
                <div className="font-mono text-2xl font-semibold text-success mt-1">{stats.bestWStreak}W</div>
              </div>
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-destructive/80">Peor racha</div>
                <div className="font-mono text-2xl font-semibold text-destructive mt-1">{stats.worstLStreak}L</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              Disciplina: <span className="text-foreground font-mono ml-1">9.1/10</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Best & worst trade</div>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-success/10 border border-success/25 p-3">
                <ArrowUpRight className="h-4 w-4 text-success" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{stats.best?.sym} · {stats.best?.setup}</div>
                  <div className="font-mono font-semibold text-success">{fmtMoney(stats.best?.pl ?? 0)}</div>
                </div>
                <div className="font-mono text-sm text-success">{stats.best?.r}R</div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/25 p-3">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{stats.worst?.sym} · {stats.worst?.setup}</div>
                  <div className="font-mono font-semibold text-destructive">{fmtMoney(stats.worst?.pl ?? 0)}</div>
                </div>
                <div className="font-mono text-sm text-destructive">{stats.worst?.r}R</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hour heatmap + DOW + Symbol/Setup tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Performance por hora</div>
                <div className="text-sm text-foreground/80 mt-0.5">Tu mejor ventana de trading</div>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <HourHeatmap data={byHour} />
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Por día de la semana</div>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-2.5">
              {byDow.map((d) => {
                const max = Math.max(...byDow.map((x) => Math.abs(x.pl)), 1);
                const pct = (Math.abs(d.pl) / max) * 100;
                const positive = d.pl >= 0;
                return (
                  <div key={d.dow} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-mono text-muted-foreground">{DOWS[d.dow]}</div>
                    <div className="flex-1 h-7 rounded-lg bg-surface/50 relative overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 left-0 transition-all"
                        style={{
                          width: `${pct}%`,
                          background: positive
                            ? "linear-gradient(90deg, color-mix(in oklab, var(--primary) 25%, transparent), color-mix(in oklab, var(--primary) 70%, transparent))"
                            : "linear-gradient(90deg, color-mix(in oklab, var(--destructive) 25%, transparent), color-mix(in oklab, var(--destructive) 70%, transparent))",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end px-2.5 text-[11px] font-mono">
                        <span className={positive ? "text-success" : "text-destructive"}>{fmtMoney(d.pl)}</span>
                      </div>
                    </div>
                    <div className="w-12 text-right text-[11px] font-mono text-muted-foreground">{d.winRate.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Breakdown title="Por símbolo" rows={bySymbol.slice(0, 6)} />
          <Breakdown title="Por setup" rows={bySetup.slice(0, 6)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function agg(trades: Trade[], key: (t: Trade) => string) {
  const m = new Map<string, { name: string; trades: number; pl: number; wins: number }>();
  for (const t of trades) {
    const k = key(t);
    const e = m.get(k) ?? { name: k, trades: 0, pl: 0, wins: 0 };
    e.trades++; e.pl += t.pl; if (t.pl > 0) e.wins++;
    m.set(k, e);
  }
  return Array.from(m.values()).map((v) => ({ ...v, winRate: (v.wins / v.trades) * 100 }));
}
function fmtMoney(n: number) {
  const s = n < 0 ? "−" : n > 0 ? "+" : "";
  return `${s}$${Math.abs(Math.round(n)).toLocaleString()}`;
}
function pctBar(a: number, b: number) {
  const max = Math.max(a, b, 1);
  return Math.min(100, (a / max) * 100);
}

/* ─── KPI ─── */
function KPI({ label, value, delta, icon: Icon, tone }: { label: string; value: string; delta: string; icon: any; tone: "success" | "destructive" | "primary" | "warning" }) {
  const cls =
    tone === "success" ? "bg-success/10 text-success border-success/25"
    : tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/25"
    : tone === "warning" ? "bg-warning/10 text-warning border-warning/25"
    : "bg-primary/10 text-primary border-primary/25";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/30 transition">
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 grid place-items-center rounded-lg border ${cls}`}><Icon className="h-4 w-4" /></div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${cls}`}>{delta}</span>
      </div>
      <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular tracking-tight">{value}</div>
    </div>
  );
}

/* ─── Equity chart ─── */
function EquityChart({ data }: { data: number[] }) {
  if (!data.length) return <div className="h-56 grid place-items-center text-muted-foreground text-sm">Sin datos</div>;
  const min = Math.min(0, ...data);
  const max = Math.max(0, ...data);
  const range = max - min || 1;
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${path} L100 100 L0 100 Z`;
  // peak-to-trough drawdown shading
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 w-full h-56">
      <defs>
        <linearGradient id="eqGrad2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.18 158)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0.78 0.18 158)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" strokeWidth="0.3" />
      ))}
      <path d={area} fill="url(#eqGrad2)" />
      <path d={path} fill="none" stroke="oklch(0.85 0.20 160)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ─── Hour heatmap ─── */
function HourHeatmap({ data }: { data: { hour: number; trades: number; pl: number; winRate: number }[] }) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.pl)));
  return (
    <div className="mt-4">
      <div className="grid grid-cols-12 gap-1.5">
        {data.map((d) => {
          const intensity = Math.abs(d.pl) / maxAbs;
          const positive = d.pl >= 0;
          const bg = d.trades === 0
            ? "color-mix(in oklab, var(--surface-2) 80%, transparent)"
            : `color-mix(in oklab, ${positive ? "var(--primary)" : "var(--destructive)"} ${Math.max(0.15, intensity) * 90}%, transparent)`;
          return (
            <div
              key={d.hour}
              title={`${d.hour}:00 — ${fmtMoney(d.pl)} · ${d.trades} trades · ${d.winRate.toFixed(0)}% WR`}
              className="aspect-square rounded-lg border border-border/50 p-1.5 flex flex-col justify-between transition hover:scale-110 hover:z-10 hover:shadow-elegant cursor-pointer"
              style={{ background: bg }}
            >
              <div className="text-[10px] font-mono text-foreground/70">{d.hour}h</div>
              <div className={`text-[10px] font-mono font-semibold ${d.trades === 0 ? "text-muted-foreground" : positive ? "text-success" : "text-destructive"}`}>
                {d.trades === 0 ? "—" : `${d.trades}t`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>07:00</span>
        <div className="flex items-center gap-1">
          <Percent className="h-3 w-3" /> Color por P&L · tamaño por trades
        </div>
        <span>18:00</span>
      </div>
    </div>
  );
}

/* ─── Breakdown table ─── */
function Breakdown({ title, rows }: { title: string; rows: { name: string; trades: number; pl: number; winRate: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.pl)));
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const pos = r.pl >= 0;
          const w = (Math.abs(r.pl) / max) * 100;
          return (
            <div key={r.name} className="group rounded-xl border border-border/60 bg-surface/40 p-3 hover:border-primary/30 transition">
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold">{r.name}</div>
                <div className={`font-mono font-semibold ${pos ? "text-success" : "text-destructive"}`}>{fmtMoney(r.pl)}</div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface/60 overflow-hidden">
                <div className="h-full" style={{ width: `${w}%`, background: pos ? "var(--gradient-primary)" : "color-mix(in oklab, var(--destructive) 80%, transparent)" }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>{r.trades} trades</span>
                <span>WR {r.winRate.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
