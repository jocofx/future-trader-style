import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useEffect, useState, useMemo } from "react";
import {
  Bot, Play, Pause, Square, AlertTriangle, CheckCircle2, Activity,
  Plus, Trash2, Zap, TrendingUp, TrendingDown, Clock, Terminal,
  RefreshCw, Power, Download, FolderOpen, PlayCircle, Wifi,
  ChevronDown, HelpCircle, Monitor, Pencil, Check, X, Settings,
  Shield, BarChart3, ChevronRight,
} from "lucide-react";
import { useGestorEA } from "@/hooks/useGestorEA";
import type { EAInstance } from "@/hooks/useGestorEA";

export const Route = createFileRoute("/app/gestor-ea")({ component: GestorEAPage });

const STATUS_META = {
  active:       { label: "Activo",        cls: "text-success bg-success/10 border-success/25",           dot: "bg-success animate-pulse" },
  paused:       { label: "Pausado",        cls: "text-warning bg-warning/10 border-warning/25",           dot: "bg-warning" },
  disconnected: { label: "Desconectado",  cls: "text-muted-foreground bg-surface-3 border-border",       dot: "bg-muted-foreground" },
  error:        { label: "Error",          cls: "text-destructive bg-destructive/10 border-destructive/25", dot: "bg-destructive animate-pulse" },
};

const PROFILE_COLOR: Record<string, string> = {
  "Disciplinado":        "text-success",
  "Levemente impulsivo": "text-warning",
  "Indisciplinado":      "text-orange-400",
  "Alto riesgo":         "text-destructive",
  "Trading compulsivo":  "text-destructive",
};

function timeAgo(ts: string | null): string {
  if (!ts) return "nunca";
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (sec < 10)  return "ahora mismo";
  if (sec < 60)  return `hace ${sec}s`;
  if (sec < 3600) return `hace ${Math.floor(sec/60)}min`;
  if (sec < 86400) return `hace ${Math.floor(sec/3600)}h`;
  return `hace ${Math.floor(sec/86400)}d`;
}

function fmtUSD(n: number) {
  return `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Sub-component: EA Card ─────────────────────────────────────────
function EACard({
  ea, onSelect, onCommand, onRename, onDelete,
}: {
  ea: EAInstance;
  onSelect: () => void;
  onCommand: (type: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal]   = useState(ea.name ?? "");
  const meta = STATUS_META[ea.status] ?? STATUS_META.disconnected;

  const limitAlerts = [];
  if (ea.limite_perdida > 0 && ea.pnl_dia <= -ea.limite_perdida)
    limitAlerts.push("Límite de pérdida alcanzado");
  if (ea.limite_ganancia > 0 && ea.pnl_dia >= ea.limite_ganancia)
    limitAlerts.push("Límite de ganancia alcanzado");
  if (ea.max_ops_dia > 0 && ea.trades_hoy >= ea.max_ops_dia)
    limitAlerts.push("Máximo de operaciones alcanzado");

  return (
    <div className={`rounded-2xl border bg-card/70 backdrop-blur overflow-hidden hover:border-primary/20 transition ${limitAlerts.length ? "border-destructive/30" : "border-border"}`}>
      {/* Alert banner */}
      {limitAlerts.length > 0 && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-xs text-destructive font-semibold">{limitAlerts[0]}</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-9 w-9 rounded-xl border grid place-items-center shrink-0 ${ea.status === "active" ? "bg-success/10 border-success/20" : "bg-surface border-border"}`}>
              <Bot className={`h-4.5 w-4.5 ${ea.status === "active" ? "text-success" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              {renaming ? (
                <div className="flex items-center gap-1">
                  <input value={nameVal} onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { onRename(nameVal); setRenaming(false); } if (e.key === "Escape") setRenaming(false); }}
                    className="text-sm font-semibold bg-surface border border-border rounded px-2 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus />
                  <button onClick={() => { onRename(nameVal); setRenaming(false); }} className="text-success hover:brightness-110"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setRenaming(false)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="text-sm font-bold truncate">{ea.name ?? `EA ${ea.platform} #${ea.account_number?.slice(-4) ?? "????"}`}</div>
                  <button onClick={() => { setNameVal(ea.name ?? ""); setRenaming(true); }} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition">
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground font-mono">{ea.platform}</span>
                {ea.broker && <><span className="text-muted-foreground/40">·</span><span className="text-[10px] text-muted-foreground">{ea.broker}</span></>}
                {ea.account_number && <><span className="text-muted-foreground/40">·</span><span className="text-[10px] font-mono text-muted-foreground">#{ea.account_number}</span></>}
              </div>
            </div>
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${meta.cls}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-surface/40 border border-border/60 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">P&L Día</div>
            <div className={`text-sm font-bold font-mono mt-0.5 ${ea.pnl_dia >= 0 ? "text-success" : "text-destructive"}`}>
              {fmtUSD(ea.pnl_dia)}
            </div>
          </div>
          <div className="rounded-xl bg-surface/40 border border-border/60 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Trades hoy</div>
            <div className="text-sm font-bold font-mono mt-0.5">{ea.trades_hoy}</div>
          </div>
          <div className="rounded-xl bg-surface/40 border border-border/60 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Balance</div>
            <div className="text-sm font-bold font-mono mt-0.5">
              {ea.balance != null ? `$${ea.balance.toLocaleString()}` : "—"}
            </div>
          </div>
        </div>

        {/* Behavioral score bar */}
        {ea.score >= 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Disciplina</span>
              <span className={`text-[10px] font-semibold ${PROFILE_COLOR[ea.perfil] ?? "text-muted-foreground"}`}>
                {ea.perfil} · {ea.disciplina}/100
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${ea.disciplina}%`,
                  background: ea.disciplina >= 80 ? "oklch(0.78 0.18 158)" : ea.disciplina >= 50 ? "oklch(0.80 0.16 75)" : "oklch(0.68 0.22 18)"
                }} />
            </div>
          </div>
        )}

        {/* Risk limits visual */}
        {(ea.limite_perdida > 0 || ea.limite_ganancia > 0 || ea.max_ops_dia > 0) && (
          <div className="mb-4 p-2.5 rounded-xl bg-surface/30 border border-border/40 space-y-1.5">
            {ea.limite_perdida > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Límite pérdida</span>
                <span className={`font-mono font-semibold ${ea.pnl_dia <= -ea.limite_perdida ? "text-destructive" : "text-foreground"}`}>
                  {fmtUSD(ea.pnl_dia)} / -${ea.limite_perdida}
                </span>
              </div>
            )}
            {ea.limite_ganancia > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Límite ganancia</span>
                <span className={`font-mono font-semibold ${ea.pnl_dia >= ea.limite_ganancia ? "text-success" : "text-foreground"}`}>
                  {fmtUSD(ea.pnl_dia)} / +${ea.limite_ganancia}
                </span>
              </div>
            )}
            {ea.max_ops_dia > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Operaciones</span>
                <span className={`font-mono font-semibold ${ea.trades_hoy >= ea.max_ops_dia ? "text-warning" : "text-foreground"}`}>
                  {ea.trades_hoy} / {ea.max_ops_dia}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Last ping */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(ea.last_ping)}
          </div>
          {ea.pnl_total !== 0 && (
            <div className={`text-[10px] font-mono font-semibold ${ea.pnl_total >= 0 ? "text-success" : "text-destructive"}`}>
              Total: {fmtUSD(ea.pnl_total)}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {ea.status === "active" ? (
            <button onClick={() => onCommand("pause")}
              className="flex-1 h-8 rounded-lg border border-warning/30 text-warning bg-warning/8 hover:bg-warning/15 transition text-xs font-semibold flex items-center justify-center gap-1.5">
              <Pause className="h-3.5 w-3.5" /> Pausar
            </button>
          ) : (
            <button onClick={() => onCommand("start")}
              className="flex-1 h-8 rounded-lg border border-success/30 text-success bg-success/8 hover:bg-success/15 transition text-xs font-semibold flex items-center justify-center gap-1.5">
              <Play className="h-3.5 w-3.5" /> Activar
            </button>
          )}
          <button onClick={onSelect}
            className="flex-1 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition text-xs font-semibold flex items-center justify-center gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Configurar
          </button>
          <button onClick={onDelete}
            className="h-8 w-8 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition flex items-center justify-center">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: EA Detail Panel ─────────────────────────────────
function EADetailPanel({ ea, onClose, onUpdateRisk, onCommand }: {
  ea: EAInstance;
  onClose: () => void;
  onUpdateRisk: (config: Partial<EAInstance>) => Promise<void>;
  onCommand: (type: string) => void;
}) {
  const [config, setConfig] = useState({
    max_ops_dia:      ea.max_ops_dia,
    limite_perdida:   ea.limite_perdida,
    limite_ganancia:  ea.limite_ganancia,
    hora_inicio:      ea.hora_inicio,
    hora_fin:         ea.hora_fin,
    modo_restrictivo: ea.modo_restrictivo,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateRisk(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const numInput = (label: string, key: keyof typeof config, placeholder = "0 = sin límite") => (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
      <input type="number" min="0" value={config[key] as number}
        onChange={e => setConfig(c => ({ ...c, [key]: Number(e.target.value) }))}
        placeholder={placeholder}
        className="mt-1 w-full bg-surface/80 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div className="font-semibold text-sm">
            {ea.name ?? `EA ${ea.platform}`}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_META[ea.status]?.cls}`}>
            {STATUS_META[ea.status]?.label}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "P&L Total",    value: fmtUSD(ea.pnl_total),  color: ea.pnl_total >= 0 ? "text-success" : "text-destructive" },
            { label: "Trades total", value: String(ea.trades_total), color: "text-foreground" },
            { label: "Win Rate",     value: ea.win_rate != null ? `${ea.win_rate.toFixed(0)}%` : "—", color: "text-primary" },
            { label: "Disciplina",   value: `${ea.disciplina}/100`, color: ea.disciplina >= 80 ? "text-success" : "text-warning" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-surface/40 border border-border/60 p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`text-base font-bold font-mono mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Behavioral */}
        <div className="rounded-xl border border-border bg-surface/30 p-4">
          <div className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Análisis Conductual
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground">Score impulsividad</div>
              <div className="text-lg font-bold font-mono text-primary mt-0.5">{ea.score.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Perfil</div>
              <div className={`text-sm font-semibold mt-0.5 ${PROFILE_COLOR[ea.perfil] ?? "text-foreground"}`}>{ea.perfil}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Violaciones hoy</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${ea.violaciones_hoy > 0 ? "text-warning" : "text-success"}`}>{ea.violaciones_hoy}</div>
            </div>
          </div>
        </div>

        {/* Risk config */}
        <div>
          <div className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Gestor de Riesgo
            <span className="text-[10px] text-muted-foreground font-normal">(se aplica al EA en tiempo real)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {numInput("Máx. operaciones/día", "max_ops_dia")}
            {numInput("Límite pérdida ($)", "limite_perdida")}
            {numInput("Límite ganancia ($)", "limite_ganancia")}
            {numInput("Hora inicio (0-23)", "hora_inicio", "0 = sin límite")}
            {numInput("Hora fin (0-23)", "hora_fin", "0 = sin límite")}
            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => setConfig(c => ({ ...c, modo_restrictivo: !c.modo_restrictivo }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${config.modo_restrictivo ? "bg-destructive" : "bg-surface-3"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.modo_restrictivo ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <div>
                <div className="text-xs font-semibold">Modo restrictivo</div>
                <div className="text-[10px] text-muted-foreground">Bloquea ops cuando score es alto</div>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 w-full h-9 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saved ? <><Check className="h-4 w-4" />Configuración aplicada</> : saving ? "Aplicando…" : <><Zap className="h-4 w-4" />Aplicar cambios al EA</>}
          </button>
        </div>

        {/* Remote commands */}
        <div>
          <div className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" /> Control remoto
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onCommand("start")}
              className="h-9 rounded-xl border border-success/30 text-success bg-success/8 hover:bg-success/15 transition text-xs font-semibold flex items-center justify-center gap-1.5">
              <Play className="h-3.5 w-3.5" /> Activar
            </button>
            <button onClick={() => onCommand("pause")}
              className="h-9 rounded-xl border border-warning/30 text-warning bg-warning/8 hover:bg-warning/15 transition text-xs font-semibold flex items-center justify-center gap-1.5">
              <Pause className="h-3.5 w-3.5" /> Pausar
            </button>
            <button onClick={() => onCommand("reset_limits")}
              className="h-9 rounded-xl border border-info/30 text-info bg-info/8 hover:bg-info/15 transition text-xs font-semibold flex items-center justify-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Reset límites
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
function GestorEAPage() {
  const { user } = useApp();
  const ea = useGestorEA(user?.id ?? null);

  const [selectedEA,       setSelectedEA]       = useState<EAInstance | null>(null);
  const [deleteId,         setDeleteId]          = useState<string | null>(null);
  const [downloading,      setDownloading]       = useState<"mt5"|"mt4"|null>(null);
  const [showInstructions, setShowInstructions]  = useState(false);
  const [instructionTab,   setInstructionTab]    = useState<"mt5"|"mt4">("mt5");

  // Download EA
  const handleDownload = async (platform: "mt5" | "mt4") => {
    if (!user) return;
    setDownloading(platform);
    try {
      const { data: keys } = await supabase
        .from("api_keys").select("token").eq("user_id", user.id).limit(1);
      let token = keys?.[0]?.token;
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "");
        await supabase.from("api_keys").insert({
          user_id: user.id,
          token,
          nombre: "TradyncSync EA",
          activo: true,
        });
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ea?platform=${platform}&token=${token}`,
        { headers: { "Authorization": `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? `Error ${res.status}`);
      const blob = await res.blob();
      const ext = platform === "mt4" ? "mq4" : "mq5";
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl; a.download = `TradyncSync_${platform.toUpperCase()}.${ext}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) { alert("Error descargando el EA: " + String(e)); }
    finally { setDownloading(null); }
  };

  const handleCommand = async (eaId: string, type: string) => {
    try { await ea.sendCommand(eaId, { type: type as any }); }
    catch (e) { console.error("Command error:", e); }
  };

  // Summary stats
  const totalPnL    = ea.instances.reduce((s, e) => s + e.pnl_dia, 0);
  const activeCount = ea.instances.filter(e => e.status === "active").length;
  const alertCount  = ea.instances.filter(e =>
    (e.limite_perdida > 0 && e.pnl_dia <= -e.limite_perdida) ||
    (e.limite_ganancia > 0 && e.pnl_dia >= e.limite_ganancia) ||
    (e.max_ops_dia > 0 && e.trades_hoy >= e.max_ops_dia)
  ).length;

  return (
    <PlanGate feature="gestor_ea" plan="pro">   <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Bot className="h-3.5 w-3.5 text-primary" /> Algotrading
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestor de Expert Advisors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controla tus bots en tiempo real desde TradyncApp.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => ea.load()}
            className="h-9 px-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-surface transition flex items-center gap-1.5 text-sm">
            <RefreshCw className={`h-4 w-4 ${ea.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => handleDownload("mt5")} disabled={downloading !== null}
            className="h-9 px-4 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            {downloading === "mt5" ? "Descargando…" : "Descargar MT5"}
          </button>
          <button onClick={() => handleDownload("mt4")} disabled={downloading !== null}
            className="h-9 px-4 rounded-xl border border-border bg-surface/60 text-sm font-semibold hover:border-primary/40 transition disabled:opacity-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            {downloading === "mt4" ? "Descargando…" : "Descargar MT4"}
          </button>
        </div>
      </div>

      {/* Instructions toggle */}
      <button onClick={() => setShowInstructions(v => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition">
        <HelpCircle className="h-3.5 w-3.5" />
        ¿Cómo instalar el EA?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showInstructions ? "rotate-180" : ""}`} />
      </button>

      {/* Instructions panel */}
      {showInstructions && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur overflow-hidden">
          <div className="flex border-b border-border">
            {(["mt5","mt4"] as const).map(tab => (
              <button key={tab} onClick={() => setInstructionTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition ${instructionTab===tab ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "mt5" ? "MetaTrader 5" : "MetaTrader 4"}
              </button>
            ))}
          </div>
          <div className="p-6 space-y-5">
            {[
              { n:1, icon: <Download className="h-4 w-4 text-primary"/>, title:"Descarga el archivo EA", desc:`Haz click en "Descargar ${instructionTab==="mt5"?"MT5":"MT4"}" arriba. Tu token ya está incluido.` },
              { n:2, icon: <FolderOpen className="h-4 w-4 text-primary"/>, title:`Copia a la carpeta MQL${instructionTab==="mt5"?"5":"4"}/Experts`, desc:`Abre ${instructionTab==="mt5"?"MT5":"MT4"} → Archivo → Abrir carpeta de datos → MQL${instructionTab==="mt5"?"5":"4"} → Experts` },
              { n:3, icon: <Monitor className="h-4 w-4 text-primary"/>, title:"Compila el EA", desc:`Herramientas → Editor MetaQuotes (F4) → busca TradyncSync_${instructionTab==="mt5"?"MT5":"MT4"} → F7` },
              { n:4, icon: <PlayCircle className="h-4 w-4 text-primary"/>, title:"Activa en un gráfico", desc:`Navegador → Expertos → TradyncSync_${instructionTab==="mt5"?"MT5":"MT4"} → arrastra al gráfico → activa "Permitir operaciones en vivo"` },
              { n:5, icon: <Wifi className="h-4 w-4 text-primary"/>, title:"Activa WebRequest", desc:`Herramientas → Opciones → Asesores Expertos → Permitir WebRequest → añade: https://www.tradyncapp.com` },
            ].map(s => (
              <div key={s.n} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold shrink-0">{s.n}</div>
                <div>
                  <div className="font-semibold text-sm mb-1 flex items-center gap-2">{s.icon}{s.title}</div>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3 rounded-xl bg-success/8 border border-success/20 p-4">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-semibold text-sm text-success mb-1">¡Listo! El EA aparecerá aquí automáticamente</div>
                <p className="text-xs text-muted-foreground">Verás una carita 🙂 en la esquina del gráfico. En unos segundos aparecerá en esta página como "Activo".</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {ea.instances.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "EAs activos",   value: `${activeCount}/${ea.instances.length}`, color: "text-success" },
            { label: "P&L total hoy", value: fmtUSD(totalPnL), color: totalPnL >= 0 ? "text-success" : "text-destructive" },
            { label: "Alertas",       value: String(alertCount), color: alertCount > 0 ? "text-destructive" : "text-muted-foreground" },
            { label: "Actualización", value: "Cada 10s", color: "text-info" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* EA Detail panel */}
      {selectedEA && (
        <EADetailPanel
          ea={ea.instances.find(e => e.id === selectedEA.id) ?? selectedEA}
          onClose={() => setSelectedEA(null)}
          onUpdateRisk={async (config) => { await ea.updateRisk(selectedEA.id, config); }}
          onCommand={(type) => handleCommand(selectedEA.id, type)}
        />
      )}

      {/* EA Grid */}
      {ea.loading && ea.instances.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Cargando EAs…</div>
      ) : ea.instances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <div className="text-lg font-semibold mb-2">Sin EAs conectados</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Descarga el EA, instálalo en tu MetaTrader y aparecerá aquí automáticamente cuando se conecte.
          </p>
          <button onClick={() => setShowInstructions(true)}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            Ver instrucciones <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ea.instances.map(instance => (
            <EACard
              key={instance.id}
              ea={instance}
              onSelect={() => setSelectedEA(instance)}
              onCommand={(type) => handleCommand(instance.id, type)}
              onRename={(name) => ea.rename(instance.id, name)}
              onDelete={() => setDeleteId(instance.id)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="¿Eliminar EA?"
        message="Se eliminará el EA de TradyncApp. Las operaciones sincronizadas se mantendrán en tu journal."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => { if (deleteId) await ea.remove(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
    </PlanGate>
  );
}
