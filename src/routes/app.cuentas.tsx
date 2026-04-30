import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet, Plus, MoreVertical, TrendingUp, TrendingDown, Search,
  CheckCircle2, AlertTriangle, CircleSlash, Building2, Layers, DollarSign,
  ArrowUpRight, Star,
} from "lucide-react";
import { Modal, Field, inputCls, selectCls, textareaCls, ModalButton } from "@/components/Modal";

export const Route = createFileRoute("/app/cuentas")({
  head: () => ({
    meta: [
      { title: "Cuentas · Tradync" },
      { name: "description", content: "Gestiona tus cuentas de trading: brokers, prop firms y demos." },
    ],
  }),
  component: CuentasPage,
});

const fmtUSD = (n: number, sign = false) => {
  const s = n < 0 ? "-" : sign ? "+" : "";
  return `${s}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

type Status = "active" | "challenge" | "paused" | "blown";
type Account = {
  id: string;
  name: string;
  broker: string;
  type: "Live" | "Prop Firm" | "Demo";
  status: Status;
  currency: string;
  balance: number;
  equity: number;
  pnl: number;
  pnlPct: number;
  drawdown: number;
  maxDD: number;
  trades: number;
  winRate: number;
  rule?: string;
  ruleProgress?: number;
  favorite?: boolean;
};

const ACCOUNTS: Account[] = [
  { id: "a1", name: "FTMO 100k Phase 2", broker: "FTMO", type: "Prop Firm", status: "challenge", currency: "USD",
    balance: 104820, equity: 105210, pnl: 5210, pnlPct: 5.21, drawdown: 1.8, maxDD: 10,
    trades: 47, winRate: 63, rule: "Profit target", ruleProgress: 52, favorite: true },
  { id: "a2", name: "IC Markets Real",   broker: "IC Markets", type: "Live", status: "active", currency: "USD",
    balance: 18420, equity: 18540, pnl: 3420, pnlPct: 22.8, drawdown: 0.6, maxDD: 8,
    trades: 184, winRate: 58, favorite: true },
  { id: "a3", name: "MyForexFunds 50k",  broker: "MFF", type: "Prop Firm", status: "active", currency: "USD",
    balance: 53210, equity: 53180, pnl: 3210, pnlPct: 6.42, drawdown: 2.1, maxDD: 5,
    trades: 92, winRate: 61, rule: "Daily loss", ruleProgress: 18 },
  { id: "a4", name: "Demo Strategy Lab", broker: "MetaTrader 5", type: "Demo", status: "paused", currency: "USD",
    balance: 9840, equity: 9840, pnl: -160, pnlPct: -1.6, drawdown: 4.2, maxDD: 15,
    trades: 31, winRate: 42 },
  { id: "a5", name: "FTMO 200k Failed",  broker: "FTMO", type: "Prop Firm", status: "blown", currency: "USD",
    balance: 188400, equity: 188400, pnl: -11600, pnlPct: -5.8, drawdown: 5.8, maxDD: 5,
    trades: 64, winRate: 39 },
];

const STATUS_META: Record<Status, { label: string; cls: string; Icon: any }> = {
  active:    { label: "Activa",      cls: "text-success bg-success/10 border-success/25",          Icon: CheckCircle2 },
  challenge: { label: "Challenge",   cls: "text-info bg-info/10 border-info/25",                   Icon: Layers },
  paused:    { label: "Pausada",     cls: "text-muted-foreground bg-surface-3 border-border",      Icon: CircleSlash },
  blown:     { label: "Liquidada",   cls: "text-destructive bg-destructive/10 border-destructive/25", Icon: AlertTriangle },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function Sparkline({ seed }: { seed: number }) {
  const W = 120, H = 32;
  const points = useMemo(() => {
    const arr: number[] = [];
    let v = 50;
    for (let i = 0; i < 24; i++) {
      v += ((Math.sin(seed * (i + 1)) + Math.cos(seed * 0.7 * i)) * 8);
      arr.push(v);
    }
    const min = Math.min(...arr), max = Math.max(...arr), r = max - min || 1;
    return arr.map((y, i) => [(i / (arr.length - 1)) * W, H - ((y - min) / r) * H * 0.9 - 2] as const);
  }, [seed]);
  const up = points[points.length - 1][1] < points[0][1];
  const color = up ? "var(--success)" : "var(--destructive)";
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8">
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px color-mix(in oklab, ${color} 50%, transparent))` }} />
    </svg>
  );
}

function CuentasPage() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = accounts.filter((a) =>
    (filter === "all" || a.status === filter) &&
    (query === "" || a.name.toLowerCase().includes(query.toLowerCase()) || a.broker.toLowerCase().includes(query.toLowerCase()))
  );

  const totalBalance = accounts.filter((a) => a.status !== "blown").reduce((s, a) => s + a.balance, 0);
  const totalPnl = accounts.reduce((s, a) => s + a.pnl, 0);
  const activeCount = accounts.filter((a) => a.status === "active" || a.status === "challenge").length;
  const totalTrades = accounts.reduce((s, a) => s + a.trades, 0);

  const handleCreate = (a: Account) => {
    setAccounts((prev) => [a, ...prev]);
    setModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            Cuentas
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tus cuentas de trading</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Brokers, prop firms y demos centralizadas en un solo dashboard.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
          <Plus className="h-3.5 w-3.5" /> Añadir cuenta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Capital total", value: fmtUSD(totalBalance), sub: `${ACCOUNTS.length} cuentas`, Icon: DollarSign, tone: "text-foreground" },
          { label: "P&L acumulado", value: fmtUSD(totalPnl, true), sub: "Todas las cuentas", Icon: TrendingUp, tone: totalPnl >= 0 ? "text-success" : "text-destructive" },
          { label: "Activas", value: String(activeCount), sub: `${ACCOUNTS.length - activeCount} inactivas`, Icon: CheckCircle2, tone: "text-info" },
          { label: "Operaciones", value: totalTrades.toLocaleString(), sub: "Histórico total", Icon: Layers, tone: "text-foreground" },
        ].map((k) => (
          <Card key={k.label}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${k.tone}`}>{k.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
              </div>
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <k.Icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o broker…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1">
          {([
            ["all", "Todas"], ["active", "Activas"], ["challenge", "Challenge"],
            ["paused", "Pausadas"], ["blown", "Liquidadas"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === k
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Account cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((a, idx) => {
          const meta = STATUS_META[a.status];
          const StatusIcon = meta.Icon;
          const ddPct = (a.drawdown / a.maxDD) * 100;
          return (
            <div
              key={a.id}
              className="group relative rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5 hover:border-primary/40 transition overflow-hidden"
            >
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)" }}
              />
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary shrink-0">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-semibold truncate">{a.name}</div>
                        {a.favorite && <Star className="h-3 w-3 fill-warning text-warning shrink-0" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{a.broker} · {a.type}</div>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground p-1 -m-1">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${meta.cls}`}>
                  <StatusIcon className="h-3 w-3" /> {meta.label}
                </span>

                {/* Balance */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Balance</div>
                    <div className="text-2xl font-bold font-mono">{fmtUSD(a.balance)}</div>
                  </div>
                  <div className={`text-right ${a.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    <div className="flex items-center gap-1 justify-end text-xs font-mono font-semibold">
                      {a.pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {fmtPct(a.pnlPct)}
                    </div>
                    <div className="text-[11px] font-mono opacity-80">{fmtUSD(a.pnl, true)}</div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="mt-2"><Sparkline seed={idx + 1} /></div>

                {/* Drawdown bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <span>Drawdown</span>
                    <span className="font-mono">{a.drawdown.toFixed(1)}% / {a.maxDD}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ddPct)}%`,
                        background: ddPct > 80 ? "var(--destructive)" : ddPct > 50 ? "var(--warning)" : "var(--success)",
                      }}
                    />
                  </div>
                </div>

                {/* Rule progress */}
                {a.rule && a.ruleProgress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      <span>{a.rule}</span>
                      <span className="font-mono">{a.ruleProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                        style={{ width: `${a.ruleProgress}%`, boxShadow: "0 0 8px color-mix(in oklab, var(--primary) 50%, transparent)" }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats footer */}
                <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Trades</div>
                    <div className="text-sm font-mono font-semibold">{a.trades}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Win rate</div>
                    <div className="text-sm font-mono font-semibold text-primary">{a.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Equity</div>
                    <div className="text-sm font-mono font-semibold">{fmtUSD(a.equity)}</div>
                  </div>
                </div>

                <button className="mt-4 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium">
                  Ver detalle <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
