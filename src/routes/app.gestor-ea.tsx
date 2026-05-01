import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useEffect, useMemo, useState } from "react";
import {
  Bot, Play, Pause, Square, AlertTriangle, CheckCircle2, Cpu, Activity,
  Plus, Settings, Trash2, Zap, TrendingUp, TrendingDown, Clock, Terminal,
  RefreshCw, Power, FileCode2, GitBranch, BarChart3, Download } from "lucide-react";
import { Modal, Field, inputCls, selectCls, ModalButton } from "@/components/Modal";

export const Route = createFileRoute("/app/gestor-ea")({
    component: GestorEAPage,
});

type EAStatus = "running" | "paused" | "stopped" | "error";

type EA = {
  id: string;
  name: string;
  symbol: string;
  broker: string;
  version: string;
  status: EAStatus;
  pnl: number;
  pnlPct: number;
  trades: number;
  winRate: number;
  maxDD: number;
  cpu: number;
  memory: number;
  uptime: string;
  lastSignal: string;
  strategy: "Scalping" | "Trend" | "Grid" | "Arbitrage" | "ML";
};

type LogEntry = {
  id: string;
  ts: string;
  level: "info" | "warn" | "error" | "success";
  ea: string;
  msg: string;
};

const INITIAL_EAS: EA[] = [
  { id: "ea1", name: "Quantum Scalper Pro",  symbol: "EURUSD", broker: "FTMO",       version: "v3.2.1", status: "running", pnl: 1248.50, pnlPct: 4.8,  trades: 142, winRate: 68, maxDD: 3.2, cpu: 12, memory: 84,  uptime: "14d 3h", lastSignal: "hace 12s", strategy: "Scalping" },
  { id: "ea2", name: "Trend Hunter X",       symbol: "XAUUSD", broker: "IC Markets", version: "v2.0.4", status: "running", pnl: 3420.10, pnlPct: 8.2,  trades: 38,  winRate: 74, maxDD: 5.1, cpu: 6,  memory: 62,  uptime: "8d 11h", lastSignal: "hace 4 min", strategy: "Trend" },
  { id: "ea3", name: "Grid Master Neo",      symbol: "GBPJPY", broker: "FTMO",       version: "v1.8.0", status: "paused",  pnl: -184.20, pnlPct: -0.9, trades: 87,  winRate: 52, maxDD: 8.4, cpu: 0,  memory: 48,  uptime: "—",      lastSignal: "hace 2 h",  strategy: "Grid" },
  { id: "ea4", name: "ML Predictor Alpha",   symbol: "BTCUSD", broker: "Binance",    version: "v0.9.2", status: "error",   pnl: 240.00,  pnlPct: 1.2,  trades: 14,  winRate: 64, maxDD: 2.1, cpu: 0,  memory: 0,   uptime: "—",      lastSignal: "Error de conexión", strategy: "ML" },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: "l1", ts: "14:32:18", level: "success", ea: "Quantum Scalper Pro", msg: "BUY EURUSD @ 1.08234 · TP +12 pips · SL -8 pips" },
  { id: "l2", ts: "14:31:02", level: "info",    ea: "Trend Hunter X",      msg: "Análisis H4 completado · señal neutra" },
  { id: "l3", ts: "14:28:45", level: "warn",    ea: "Grid Master Neo",     msg: "Pausa automática: drawdown >8%" },
  { id: "l4", ts: "14:25:11", level: "error",   ea: "ML Predictor Alpha",  msg: "Conexión perdida con broker · reintentando…" },
  { id: "l5", ts: "14:22:08", level: "success", ea: "Quantum Scalper Pro", msg: "CLOSE EURUSD +$48.20 (+0.18%)" },
  { id: "l6", ts: "14:18:33", level: "info",    ea: "Trend Hunter X",      msg: "Vela H1 cerrada · evaluando entrada" },
];

const STATUS_META: Record<EAStatus, { label: string; cls: string; dot: string }> = {
  running: { label: "Activo",    cls: "text-success bg-success/10 border-success/25",                 dot: "bg-success animate-pulse" },
  paused:  { label: "Pausado",   cls: "text-warning bg-warning/10 border-warning/25",                 dot: "bg-warning" },
  stopped: { label: "Detenido",  cls: "text-muted-foreground bg-surface-3 border-border",             dot: "bg-muted-foreground" },
  error:   { label: "Error",     cls: "text-destructive bg-destructive/10 border-destructive/25",     dot: "bg-destructive animate-pulse" },
};

const STRATEGY_COLOR: Record<EA["strategy"], string> = {
  Scalping:  "oklch(0.78 0.18 158)",
  Trend:     "oklch(0.70 0.16 250)",
  Grid:      "oklch(0.80 0.16 75)",
  Arbitrage: "oklch(0.74 0.18 305)",
  ML:        "oklch(0.72 0.18 35)",
};

const fmtUSD = (n: number) =>
  `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function GestorEAPage() {
  const [downloading, setDownloading] = useState<"mt5"|"mt4"|null>(null);

  const handleDownload = async (platform: "mt5" | "mt4") => {
    if (!user) return;
    setDownloading(platform);
    try {
      // Get or create API token for user
      const { data: keys } = await supabase
        .from("api_keys")
        .select("token")
        .eq("user_id", user.id)
        .limit(1);

      let token = keys?.[0]?.token;

      if (!token) {
        // Create new token
        token = crypto.randomUUID().replace(/-/g, "");
        await supabase.from("api_keys").insert({
          user_id: user.id,
          token: token,
        });
      }

      // Download EA from Edge Function
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ea?platform=${platform}&token=${token}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `TradyncSync_${platform.toUpperCase()}.${platform === "mt4" ? "mq4" : "mq5"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Error descargando el EA: " + String(e));
    } finally {
      setDownloading(null);
    }
  };

  const { user } = useApp();
  const [confirmEaId, setConfirmEaId] = useState<string | null>(null);
  const [eas, setEas] = useState<EA[]>(INITIAL_EAS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pulso CPU para EAs activos
  useEffect(() => {
    const t = setInterval(() => {
      setEas((prev) =>
        prev.map((e) =>
          e.status === "running"
            ? { ...e, cpu: Math.max(2, Math.min(40, e.cpu + (Math.random() * 6 - 3))) }
            : e
        )
      );
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const running = eas.filter((e) => e.status === "running").length;
    const totalPnl = eas.reduce((s, e) => s + e.pnl, 0);
    const totalTrades = eas.reduce((s, e) => s + e.trades, 0);
    const avgWin = eas.length ? Math.round(eas.reduce((s, e) => s + e.winRate, 0) / eas.length) : 0;
    return { running, totalPnl, totalTrades, avgWin };
  }, [eas]);

  const selected = selectedId ? eas.find((e) => e.id === selectedId) ?? null : eas[0] ?? null;

  const setStatus = (id: string, status: EAStatus) => {
    setEas((prev) => prev.map((e) => (e.id === id ? { ...e, status, cpu: status === "running" ? 8 : 0 } : e)));
    const ea = eas.find((x) => x.id === id);
    if (ea) {
      const map: Record<EAStatus, LogEntry["level"]> = { running: "success", paused: "warn", stopped: "info", error: "error" };
      const labels: Record<EAStatus, string> = { running: "iniciado", paused: "pausado", stopped: "detenido", error: "error" };
      setLogs((prev) => [{
        id: `l${Date.now()}`,
        ts: new Date().toLocaleTimeString("es", { hour12: false }),
        level: map[status],
        ea: ea.name,
        msg: `EA ${labels[status]} manualmente`,
      }, ...prev.slice(0, 49)]);
    }
  };

  const removeEA = (id: string) => {
    setConfirmEaId(id);
  };
  const doRemoveEA = (id: string) => {
    setEas((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAdd = (data: { name: string; symbol: string; broker: string; strategy: EA["strategy"] }) => {
    const newEA: EA = {
      id: `ea${Date.now()}`,
      name: data.name,
      symbol: data.symbol,
      broker: data.broker,
      version: "v1.0.0",
      status: "stopped",
      pnl: 0, pnlPct: 0, trades: 0, winRate: 0, maxDD: 0, cpu: 0, memory: 0,
      uptime: "—", lastSignal: "Nunca",
      strategy: data.strategy,
    };
    setEas((prev) => [newEA, ...prev]);
    setModalOpen(false);
  };

  return (
    <>
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Bot className="h-3.5 w-3.5 text-primary" />
            Algotrading · v2026
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestor de Expert Advisors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoriza tus bots en tiempo real, controla su ejecución y analiza su rendimiento.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => handleDownload("mt5")}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              <Download className="h-4 w-4" />
              {downloading === "mt5" ? "Descargando..." : "Descargar MT5 (.mq5)"}
            </button>
            <button
              onClick={() => handleDownload("mt4")}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 text-foreground px-4 py-2 text-sm font-semibold hover:border-primary/40 transition disabled:opacity-50">
              <Download className="h-4 w-4" />
              {downloading === "mt4" ? "Descargando..." : "Descargar MT4 (.mq4)"}
            </button>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-[0_0_20px_-4px_oklch(var(--primary)/0.4)]"
        >
          <Plus className="h-4 w-4" /> Nuevo EA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "EAs activos",    value: `${stats.running}/${eas.length}`,                              Icon: Zap,        tone: "text-success" },
          { label: "P&L acumulado",  value: fmtUSD(stats.totalPnl),                                        Icon: TrendingUp, tone: stats.totalPnl >= 0 ? "text-success" : "text-destructive" },
          { label: "Trades totales", value: stats.totalTrades.toLocaleString(),                            Icon: Activity,   tone: "text-info" },
          { label: "Winrate medio",  value: `${stats.avgWin}%`,                                            Icon: BarChart3,  tone: "text-primary" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 ${k.tone}`}>
              <k.Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
              <div className={`text-xl font-bold font-mono ${k.tone}`}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de EAs */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" /> Expert Advisors
            </h2>
            <span className="text-[11px] text-muted-foreground">{eas.length} bot{eas.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-2">
            {eas.map((ea) => {
              const meta = STATUS_META[ea.status];
              const isSelected = selected?.id === ea.id;
              return (
                <div
                  key={ea.id}
                  onClick={() => setSelectedId(ea.id)}
                  className={`group rounded-2xl border bg-surface/70 backdrop-blur-xl p-4 cursor-pointer transition ${
                    isSelected ? "border-primary/50 shadow-[0_0_20px_-8px_oklch(var(--primary)/0.5)]" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div
                      className="h-11 w-11 rounded-xl grid place-items-center font-bold text-[10px] shrink-0 border relative"
                      style={{
                        background: `color-mix(in oklab, ${STRATEGY_COLOR[ea.strategy]} 18%, transparent)`,
                        borderColor: `color-mix(in oklab, ${STRATEGY_COLOR[ea.strategy]} 30%, transparent)`,
                        color: STRATEGY_COLOR[ea.strategy],
                      }}
                    >
                      {ea.strategy.slice(0, 3).toUpperCase()}
                      <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-surface ${meta.dot}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-sm truncate">{ea.name}</div>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.cls}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground font-mono">{ea.version}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono flex items-center gap-2 flex-wrap">
                        <span>{ea.symbol}</span>
                        <span className="opacity-50">·</span>
                        <span>{ea.broker}</span>
                        <span className="opacity-50">·</span>
                        <Clock className="h-3 w-3 inline" /> {ea.lastSignal}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-5 text-right">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">P&L</div>
                        <div className={`text-sm font-mono font-semibold ${ea.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {fmtUSD(ea.pnl)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CPU</div>
                        <div className="text-sm font-mono font-semibold flex items-center gap-1">
                          <Cpu className="h-3 w-3 text-muted-foreground" /> {Math.round(ea.cpu)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                      {ea.status === "running" ? (
                        <button onClick={() => setStatus(ea.id, "paused")} title="Pausar"
                          className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-warning/40 hover:text-warning text-muted-foreground transition">
                          <Pause className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => setStatus(ea.id, "running")} title="Iniciar"
                          className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-success/40 hover:text-success text-muted-foreground transition">
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => setStatus(ea.id, "stopped")} title="Detener"
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-primary/40 hover:text-primary text-muted-foreground transition">
                        <Square className="h-3.5 w-3.5" />
                      </button>
                      <button title="Configuración"
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-primary/40 hover:text-primary text-muted-foreground transition">
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeEA(ea.id)} title="Eliminar"
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-destructive/40 hover:text-destructive text-muted-foreground transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mini barra CPU */}
                  {ea.status === "running" && (
                    <div className="mt-3 h-1 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-success transition-all duration-700"
                        style={{ width: `${Math.min(100, ea.cpu * 2.5)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {eas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
                <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <div className="text-sm text-muted-foreground">No tienes Expert Advisors configurados</div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Añadir tu primer EA →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Detalle + Logs */}
        <aside className="space-y-4">
          {selected && (
            <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Detalle</div>
                <div className="font-bold text-base mt-0.5 truncate">{selected.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{selected.symbol} · {selected.strategy}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Metric label="Trades"    value={selected.trades.toString()} />
                <Metric label="Winrate"   value={`${selected.winRate}%`} tone="text-success" />
                <Metric label="Max DD"    value={`${selected.maxDD}%`}   tone="text-warning" />
                <Metric label="Uptime"    value={selected.uptime} />
                <Metric label="Memoria"   value={`${selected.memory} MB`} />
                <Metric label="P&L %"     value={`${selected.pnlPct >= 0 ? "+" : ""}${selected.pnlPct}%`} tone={selected.pnlPct >= 0 ? "text-success" : "text-destructive"} />
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                {selected.status === "running" ? (
                  <button onClick={() => setStatus(selected.id, "paused")}
                    className="flex-1 h-8 rounded-lg border border-warning/30 bg-warning/10 text-warning text-xs font-semibold hover:bg-warning/15 transition flex items-center justify-center gap-1.5">
                    <Pause className="h-3.5 w-3.5" /> Pausar
                  </button>
                ) : (
                  <button onClick={() => setStatus(selected.id, "running")}
                    className="flex-1 h-8 rounded-lg border border-success/30 bg-success/10 text-success text-xs font-semibold hover:bg-success/15 transition flex items-center justify-center gap-1.5">
                    <Play className="h-3.5 w-3.5" /> Iniciar
                  </button>
                )}
                <button onClick={() => setStatus(selected.id, "stopped")}
                  className="h-8 px-3 rounded-lg border border-border bg-surface-2/50 text-xs font-semibold hover:border-primary/40 hover:text-primary text-muted-foreground transition flex items-center gap-1.5">
                  <Power className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" /> Log en vivo
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] text-success font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Info estratégica */}
      <div className="rounded-2xl border border-border bg-surface/40 backdrop-blur p-4 flex items-start gap-3">
        <GitBranch className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Versionado de estrategias.</span> Cada EA mantiene historial de versiones y métricas comparativas. Puedes revertir cambios o ejecutar A/B testing entre versiones desde el panel de configuración.
        </div>
      </div>

      <NewEAModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
    <ConfirmModal open={confirmEaId !== null} title="¿Eliminar EA?" message="Las operaciones históricas se mantendrán. Solo se eliminará el EA." confirmLabel="Sí, eliminar" onConfirm={() => { if (confirmEaId) { doRemoveEA(confirmEaId); } setConfirmEaId(null); }} onCancel={() => setConfirmEaId(null)} />
    </>
  );
}

function Metric({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-surface-2/40 border border-border p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-mono font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const meta = {
    info:    { Icon: Activity,      cls: "text-muted-foreground" },
    success: { Icon: CheckCircle2,  cls: "text-success" },
    warn:    { Icon: AlertTriangle, cls: "text-warning" },
    error:   { Icon: AlertTriangle, cls: "text-destructive" },
  }[log.level];
  const Icon = meta.Icon;
  return (
    <div className="px-4 py-2.5 hover:bg-surface-2/30 transition">
      <div className="flex items-start gap-2">
        <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.cls}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            <span>{log.ts}</span>
            <span className="opacity-50">·</span>
            <span className="truncate">{log.ea}</span>
          </div>
          <div className={`text-xs mt-0.5 font-mono ${meta.cls}`}>{log.msg}</div>
        </div>
      </div>
    </div>
  );
}

function NewEAModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; symbol: string; broker: string; strategy: EA["strategy"] }) => void;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("EURUSD");
  const [broker, setBroker] = useState("FTMO");
  const [strategy, setStrategy] = useState<EA["strategy"]>("Scalping");
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(""); setSymbol("EURUSD"); setBroker("FTMO"); setStrategy("Scalping"); setLoading(false); };
  const close = () => { onClose(); reset(); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onAdd({ name, symbol, broker, strategy }); reset(); }, 500);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nuevo Expert Advisor"
      subtitle="Configura un nuevo bot de algotrading"
      size="md"
      footer={
        <>
          <ModalButton type="button" onClick={close}>Cancelar</ModalButton>
          <ModalButton type="submit" form="ea-form" variant="primary" disabled={!name || loading}>
            {loading ? <><RefreshCw className="h-3.5 w-3.5 inline mr-1 animate-spin" /> Creando…</> : <><Plus className="h-3.5 w-3.5 inline mr-1" /> Crear EA</>}
          </ModalButton>
        </>
      }
    >
      <form id="ea-form" onSubmit={submit} className="space-y-4">
        <Field label="Nombre del EA">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Quantum Scalper Pro" required maxLength={50} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Símbolo">
            <input className={inputCls} value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="EURUSD" required maxLength={10} />
          </Field>
          <Field label="Broker">
            <select className={selectCls} value={broker} onChange={(e) => setBroker(e.target.value)}>
              <option>FTMO</option>
              <option>IC Markets</option>
              <option>Binance</option>
              <option>Bybit</option>
              <option>Interactive Brokers</option>
            </select>
          </Field>
        </div>

        <Field label="Estrategia">
          <div className="grid grid-cols-5 gap-1.5">
            {(["Scalping", "Trend", "Grid", "Arbitrage", "ML"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStrategy(s)}
                className={`h-9 rounded-lg border text-[11px] font-semibold transition ${
                  strategy === s
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-surface-2/40 text-muted-foreground hover:border-primary/30"
                }`}
                style={strategy === s ? { color: STRATEGY_COLOR[s], borderColor: `color-mix(in oklab, ${STRATEGY_COLOR[s]} 40%, transparent)`, background: `color-mix(in oklab, ${STRATEGY_COLOR[s]} 12%, transparent)` } : undefined}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20 text-[11px] text-muted-foreground">
          <TrendingDown className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
          <span>El EA se creará en estado <span className="font-semibold text-foreground">Detenido</span>. Podrás iniciarlo cuando termines la configuración avanzada.</span>
        </div>
      </form>
    </Modal>
  );
}
