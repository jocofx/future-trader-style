import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings2, Plus, Play, Pause, MoreVertical, Cpu, TrendingUp, TrendingDown,
  Activity, AlertCircle, CheckCircle2, Zap, Clock, BarChart3, Power, Bot, Search,
} from "lucide-react";

export const Route = createFileRoute("/app/gestor-ea")({
  head: () => ({
    meta: [
      { title: "Gestor EA · Tradync" },
      { name: "description", content: "Gestiona tus Expert Advisors: estado, performance y configuración." },
    ],
  }),
  component: GestorEAPage,
});

const fmtUSD = (n: number, sign = false) => {
  const s = n < 0 ? "-" : sign ? "+" : "";
  return `${s}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

type EAStatus = "running" | "paused" | "error" | "stopped";

type EA = {
  id: string;
  name: string;
  strategy: string;
  account: string;
  symbols: string[];
  status: EAStatus;
  pnl: number;
  pnlPct: number;
  trades: number;
  winRate: number;
  uptime: number; // %
  lastSignal: string;
  riskPerTrade: number; // %
  maxDD: number;
  cpu: number; // %
  version: string;
};

const EAS: EA[] = [
  {
    id: "ea1", name: "Aurora Scalper v3", strategy: "Mean Reversion", account: "FTMO 100k Phase 2",
    symbols: ["EURUSD", "GBPUSD"], status: "running", pnl: 4820, pnlPct: 4.82,
    trades: 142, winRate: 68, uptime: 99.4, lastSignal: "hace 3 min", riskPerTrade: 0.5,
    maxDD: 2.1, cpu: 18, version: "3.2.1",
  },
  {
    id: "ea2", name: "Trend Hunter Pro", strategy: "Breakout", account: "IC Markets Real",
    symbols: ["NAS100", "SPX500"], status: "running", pnl: 2310, pnlPct: 12.5,
    trades: 38, winRate: 55, uptime: 98.1, lastSignal: "hace 12 min", riskPerTrade: 1.0,
    maxDD: 4.8, cpu: 24, version: "2.0.4",
  },
  {
    id: "ea3", name: "Grid Master FX", strategy: "Grid", account: "MyForexFunds 50k",
    symbols: ["XAUUSD"], status: "paused", pnl: 1840, pnlPct: 3.68,
    trades: 89, winRate: 71, uptime: 95.2, lastSignal: "hace 4 h", riskPerTrade: 0.3,
    maxDD: 6.2, cpu: 0, version: "1.8.2",
  },
  {
    id: "ea4", name: "News Reactor", strategy: "Event-driven", account: "Demo Strategy Lab",
    symbols: ["EURUSD", "GBPJPY", "USDJPY"], status: "error", pnl: -340, pnlPct: -3.4,
    trades: 14, winRate: 35, uptime: 84.3, lastSignal: "hace 18 min · ERROR",
    riskPerTrade: 0.8, maxDD: 5.5, cpu: 12, version: "0.9.1-beta",
  },
  {
    id: "ea5", name: "DCA Bitcoin", strategy: "Dollar Cost Avg.", account: "IC Markets Real",
    symbols: ["BTCUSD"], status: "stopped", pnl: 0, pnlPct: 0, trades: 0, winRate: 0,
    uptime: 0, lastSignal: "Nunca", riskPerTrade: 1.0, maxDD: 0, cpu: 0, version: "1.0.0",
  },
];

const STATUS_META: Record<EAStatus, { label: string; cls: string; Icon: any; dot: string }> = {
  running: { label: "Activo",   cls: "text-success bg-success/10 border-success/25",                Icon: CheckCircle2, dot: "bg-success" },
  paused:  { label: "Pausado",  cls: "text-warning bg-warning/10 border-warning/25",                Icon: Pause,        dot: "bg-warning" },
  error:   { label: "Error",    cls: "text-destructive bg-destructive/10 border-destructive/25",    Icon: AlertCircle,  dot: "bg-destructive animate-pulse" },
  stopped: { label: "Detenido", cls: "text-muted-foreground bg-surface-3 border-border",            Icon: Power,        dot: "bg-muted-foreground" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 ${className}`}>{children}</div>;
}

function GestorEAPage() {
  const [filter, setFilter] = useState<"all" | EAStatus>("all");
  const [query, setQuery] = useState("");

  const filtered = EAS.filter((e) =>
    (filter === "all" || e.status === filter) &&
    (query === "" || e.name.toLowerCase().includes(query.toLowerCase()) || e.strategy.toLowerCase().includes(query.toLowerCase()))
  );

  const totalPnl = EAS.reduce((s, e) => s + e.pnl, 0);
  const running = EAS.filter((e) => e.status === "running").length;
  const errors = EAS.filter((e) => e.status === "error").length;
  const totalTrades = EAS.reduce((s, e) => s + e.trades, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            Gestor EA
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tus Expert Advisors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoriza, ejecuta y ajusta tus algoritmos en tiempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="hidden sm:flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-border bg-surface/70 hover:border-primary/40 text-xs font-semibold transition">
            <Bot className="h-3.5 w-3.5" /> Marketplace
          </button>
          <button className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
            <Plus className="h-3.5 w-3.5" /> Subir EA
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "P&L total EAs", value: fmtUSD(totalPnl, true), sub: `${EAS.length} EAs configurados`, Icon: TrendingUp, tone: totalPnl >= 0 ? "text-success" : "text-destructive" },
          { label: "Activos ahora",  value: `${running}/${EAS.length}`, sub: "Ejecutándose en vivo", Icon: Zap, tone: "text-primary" },
          { label: "Operaciones EAs", value: totalTrades.toLocaleString(), sub: "Ejecutadas total", Icon: BarChart3, tone: "text-foreground" },
          { label: "Errores activos", value: String(errors), sub: errors > 0 ? "Requieren atención" : "Todo en orden", Icon: AlertCircle, tone: errors > 0 ? "text-destructive" : "text-muted-foreground" },
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
            placeholder="Buscar EA o estrategia…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1">
          {([
            ["all", "Todos"], ["running", "Activos"], ["paused", "Pausados"], ["error", "Errores"], ["stopped", "Detenidos"],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === k ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]" : "text-muted-foreground hover:text-foreground"
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* EA list */}
      <div className="space-y-3">
        {filtered.map((ea) => {
          const meta = STATUS_META[ea.status];
          const StatusIcon = meta.Icon;
          const isLive = ea.status === "running";
          return (
            <div
              key={ea.id}
              className="group rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-4 hover:border-primary/40 transition relative overflow-hidden"
            >
              <div className="grid lg:grid-cols-[auto_1fr_auto] gap-4 items-center">
                {/* Icon + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 grid place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary shrink-0">
                    <Cpu className="h-5 w-5" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${meta.dot}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold truncate">{ea.name}</div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground border border-border">v{ea.version}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 flex-wrap">
                      <span>{ea.strategy}</span>·<span className="font-mono">{ea.account}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {ea.symbols.map((s) => (
                        <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">P&L</div>
                    <div className={`text-sm font-mono font-bold ${ea.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {ea.pnl >= 0 ? "+" : ""}{fmtUSD(ea.pnl)}
                    </div>
                    <div className={`text-[10px] font-mono flex items-center gap-0.5 ${ea.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {ea.pnl >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {ea.pnlPct >= 0 ? "+" : ""}{ea.pnlPct.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Trades</div>
                    <div className="text-sm font-mono font-bold">{ea.trades}</div>
                    <div className="text-[10px] font-mono text-primary">WR {ea.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Uptime</div>
                    <div className="text-sm font-mono font-bold">{ea.uptime}%</div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{ea.lastSignal}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">CPU / DD</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden min-w-[40px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${ea.cpu}%`,
                            background: ea.cpu > 70 ? "var(--warning)" : "var(--primary)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{ea.cpu}%</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">DD {ea.maxDD}%</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <span className={`hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${meta.cls}`}>
                    <StatusIcon className="h-3 w-3" /> {meta.label}
                  </span>
                  {isLive ? (
                    <button className="h-8 w-8 grid place-items-center rounded-lg border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 transition" title="Pausar">
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button className="h-8 w-8 grid place-items-center rounded-lg border border-success/30 bg-success/10 text-success hover:bg-success/20 transition" title="Iniciar">
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2 hover:border-primary/30 text-muted-foreground hover:text-foreground transition">
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                  <button className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground transition">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {ea.status === "error" && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Conexión perdida con el broker.</span>
                  <span className="text-destructive/70">Verifica credenciales API y reinicia el EA.</span>
                  <button className="ml-auto text-[11px] font-semibold underline hover:no-underline">Ver logs</button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-3 opacity-40" />
            No hay EAs con esos filtros.
          </div>
        )}
      </div>

      {/* Activity log */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Actividad reciente</h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Últimas 24h</span>
        </div>
        <ul className="space-y-1.5 font-mono text-[11px]">
          {[
            { t: "14:42:18", ea: "Aurora Scalper v3", msg: "BUY EURUSD 0.10 lot @ 1.0842 · SL 1.0820 · TP 1.0880", tone: "text-success" },
            { t: "14:38:02", ea: "Trend Hunter Pro",  msg: "Señal de breakout detectada en NAS100 (no ejecutada: filtro horario)", tone: "text-info" },
            { t: "14:31:55", ea: "Aurora Scalper v3", msg: "CLOSE GBPUSD +0.62R · +$84.20", tone: "text-success" },
            { t: "14:18:09", ea: "News Reactor",      msg: "ERROR: API timeout. Reintentando en 30s…", tone: "text-destructive" },
            { t: "14:02:44", ea: "Grid Master FX",    msg: "EA pausado manualmente por el usuario", tone: "text-warning" },
            { t: "13:55:21", ea: "Aurora Scalper v3", msg: "SELL EURUSD 0.10 lot @ 1.0851 · SL 1.0875 · TP 1.0810", tone: "text-destructive" },
          ].map((l, i) => (
            <li key={i} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground shrink-0">{l.t}</span>
              <span className="text-primary shrink-0 min-w-[140px] truncate">[{l.ea}]</span>
              <span className={`${l.tone} truncate flex-1`}>{l.msg}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
