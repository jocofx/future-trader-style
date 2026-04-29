import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine,
  Target, Calendar, Wallet, Percent, Sparkles, Plus,
} from "lucide-react";

export const Route = createFileRoute("/app/capital")({
  head: () => ({
    meta: [
      { title: "Capital Tracker · Tradync" },
      { name: "description", content: "Trackea growth de cuenta, retiros, depósitos y compounding." },
    ],
  }),
  component: CapitalPage,
});

/* ───────────────────────── Helpers ───────────────────────── */

const fmtUSD = (n: number, sign = false) => {
  const s = n < 0 ? "-" : sign ? "+" : "";
  return `${s}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

/* PRNG determinista */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────────── Data ───────────────────────── */

type Range = "30D" | "90D" | "YTD" | "1Y" | "ALL";

type Point = { day: number; equity: number; date: string };
type Movement = {
  id: string;
  type: "deposit" | "withdrawal" | "fee" | "profit";
  amount: number;
  date: string;
  note: string;
};

function buildEquity(range: Range): Point[] {
  const days = range === "30D" ? 30 : range === "90D" ? 90 : range === "YTD" ? 180 : range === "1Y" ? 365 : 540;
  const rnd = mulberry32(424242);
  const points: Point[] = [];
  let equity = 10000;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const drift = 0.0018; // upward bias (compounding)
    const vol = 0.014;
    const shock = (rnd() - 0.45) * vol;
    equity = equity * (1 + drift + shock);
    if (i === Math.floor(days * 0.4)) equity += 5000; // deposit
    if (i === Math.floor(days * 0.7)) equity -= 2500; // withdrawal
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    points.push({ day: i, equity, date: d.toISOString().slice(0, 10) });
  }
  return points;
}

const MOVEMENTS: Movement[] = [
  { id: "m1", type: "deposit",    amount: 5000, date: "2026-04-12", note: "Reinversión Q2" },
  { id: "m2", type: "withdrawal", amount: 2500, date: "2026-03-28", note: "Retiro mensual" },
  { id: "m3", type: "profit",     amount: 1840, date: "2026-03-21", note: "Cierre semana ganadora" },
  { id: "m4", type: "deposit",    amount: 3000, date: "2026-02-14", note: "Aporte inicial Q1" },
  { id: "m5", type: "fee",        amount: 120,  date: "2026-02-08", note: "Comisiones broker" },
  { id: "m6", type: "withdrawal", amount: 1500, date: "2026-01-30", note: "Pago de impuestos" },
];

const GOALS = [
  { label: "Meta cuenta $25k", current: 18420, target: 25000, color: "primary" },
  { label: "Retiros anuales $20k", current: 8500, target: 20000, color: "info" },
  { label: "Drawdown < 8%", current: 5.2, target: 8, color: "warning", inverse: true, unit: "%" },
];

/* ───────────────────────── Atoms ───────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 shadow-[0_1px_0_0_color-mix(in_oklab,var(--foreground)_5%,transparent)_inset] ${className}`}
    >
      {children}
    </div>
  );
}

function Kpi({
  label, value, sub, icon: Icon, tone = "default",
}: {
  label: string; value: string; sub?: string; icon: any;
  tone?: "default" | "success" | "destructive" | "info";
}) {
  const toneCls =
    tone === "success" ? "text-success" :
    tone === "destructive" ? "text-destructive" :
    tone === "info" ? "text-info" : "text-foreground";
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${toneCls}`}>{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
        <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────── Equity Chart ───────────────────────── */

function EquityChart({ data }: { data: Point[] }) {
  const W = 1000;
  const H = 280;
  const PAD_L = 50;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 26;

  const min = Math.min(...data.map((d) => d.equity));
  const max = Math.max(...data.map((d) => d.equity));
  const range = max - min || 1;

  const x = (i: number) => PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_T + (1 - (v - min) / range) * (H - PAD_T - PAD_B);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(d.equity).toFixed(2)}`).join(" ");
  const area = `${path} L ${x(data.length - 1).toFixed(2)} ${H - PAD_B} L ${x(0).toFixed(2)} ${H - PAD_B} Z`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + (range * i) / ticks);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(v)}
              y2={y(v)}
              stroke="color-mix(in oklab, var(--foreground) 6%, transparent)"
              strokeDasharray="3 4"
            />
            <text
              x={PAD_L - 8}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
            >
              ${(v / 1000).toFixed(1)}k
            </text>
          </g>
        ))}

        <path d={area} fill="url(#capGrad)" />
        <path
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 40%, transparent))" }}
        />

        <circle
          cx={x(data.length - 1)}
          cy={y(data[data.length - 1].equity)}
          r="4.5"
          fill="var(--primary)"
          style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
        />
      </svg>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

function CapitalPage() {
  const [range, setRange] = useState<Range>("90D");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => buildEquity(range), [range]);
  const initial = data[0].equity;
  const current = data[data.length - 1].equity;
  const totalReturn = ((current - initial) / initial) * 100;
  const peak = Math.max(...data.map((d) => d.equity));
  const trough = Math.min(...data.map((d) => d.equity));
  const maxDD = ((trough - peak) / peak) * 100;

  const totalDeposits = MOVEMENTS.filter((m) => m.type === "deposit").reduce((a, b) => a + b.amount, 0);
  const totalWithdrawals = MOVEMENTS.filter((m) => m.type === "withdrawal").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <LineChart className="h-3.5 w-3.5 text-primary" />
            Capital Tracker
            <span className="ml-1 rounded-md bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 tracking-wider">NEW</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Evolución de tu capital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Growth, depósitos, retiros y compounding en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1">
            {(["30D", "90D", "YTD", "1Y", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  range === r
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="hidden sm:flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
            <Plus className="h-3.5 w-3.5" />
            Movimiento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Capital actual"
          value={mounted ? fmtUSD(current) : "$—"}
          sub={`Inicial ${fmtUSD(initial)}`}
          icon={Wallet}
        />
        <Kpi
          label="Retorno total"
          value={fmtPct(totalReturn)}
          sub={`Periodo ${range}`}
          icon={TrendingUp}
          tone={totalReturn >= 0 ? "success" : "destructive"}
        />
        <Kpi
          label="Drawdown máx."
          value={fmtPct(maxDD)}
          sub={`Pico ${fmtUSD(peak)}`}
          icon={TrendingDown}
          tone="destructive"
        />
        <Kpi
          label="Compounding mensual"
          value={fmtPct(totalReturn / Math.max(1, data.length / 30))}
          sub="Promedio mes a mes"
          icon={Percent}
          tone="info"
        />
      </div>

      {/* Chart */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Curva de equity</h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
              Equity
            </span>
            <span>{data.length} días</span>
          </div>
        </div>
        <EquityChart data={data} />
      </Card>

      {/* Bottom row: Goals + Movements */}
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
        {/* Goals */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Metas de capital</h2>
          </div>
          <div className="space-y-4">
            {GOALS.map((g) => {
              const pct = Math.min(100, (g.current / g.target) * 100);
              const ok = g.inverse ? g.current <= g.target : g.current >= g.target;
              return (
                <div key={g.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-sm font-medium">{g.label}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {g.unit === "%" ? `${g.current}%` : fmtUSD(g.current)} /{" "}
                      <span className="text-foreground">{g.unit === "%" ? `${g.target}%` : fmtUSD(g.target)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: ok
                          ? "linear-gradient(90deg, var(--primary), var(--primary-glow))"
                          : g.color === "warning"
                          ? "linear-gradient(90deg, var(--warning), color-mix(in oklab, var(--warning) 60%, var(--primary)))"
                          : "linear-gradient(90deg, var(--info), var(--primary))",
                        boxShadow: "0 0 10px color-mix(in oklab, var(--primary) 35%, transparent)",
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">{pct.toFixed(0)}% completado</div>
                </div>
              );
            })}
          </div>

          {/* Compounding projection */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Proyección compounding</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[6, 12, 24].map((months) => {
                const monthlyRate = totalReturn / Math.max(1, data.length / 30) / 100;
                const projected = current * Math.pow(1 + monthlyRate, months);
                return (
                  <div key={months} className="rounded-xl border border-border bg-surface-2/60 p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{months}m</div>
                    <div className="text-sm font-mono font-bold text-primary mt-1">
                      {mounted ? fmtUSD(projected) : "$—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Movements */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Movimientos recientes</h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-success flex items-center gap-1">
                <ArrowDownToLine className="h-3 w-3" />
                {fmtUSD(totalDeposits)}
              </span>
              <span className="text-destructive flex items-center gap-1">
                <ArrowUpFromLine className="h-3 w-3" />
                {fmtUSD(totalWithdrawals)}
              </span>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {MOVEMENTS.map((m) => {
              const meta =
                m.type === "deposit"
                  ? { Icon: ArrowDownToLine, label: "Depósito", tone: "text-success bg-success/10 border-success/20", sign: "+" }
                  : m.type === "withdrawal"
                  ? { Icon: ArrowUpFromLine, label: "Retiro", tone: "text-destructive bg-destructive/10 border-destructive/20", sign: "-" }
                  : m.type === "profit"
                  ? { Icon: TrendingUp, label: "Beneficio", tone: "text-primary bg-primary/10 border-primary/20", sign: "+" }
                  : { Icon: Percent, label: "Comisión", tone: "text-warning bg-warning/10 border-warning/20", sign: "-" };
              const { Icon } = meta;
              return (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`h-9 w-9 grid place-items-center rounded-lg border shrink-0 ${meta.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{meta.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{m.note}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-mono text-sm font-bold ${meta.sign === "+" ? "text-success" : "text-destructive"}`}>
                      {meta.sign}
                      {fmtUSD(m.amount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{m.date}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
