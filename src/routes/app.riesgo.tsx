import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldCheck, Save, Check, AlertTriangle, Users, User } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/riesgo")({ component: RiesgoPage });

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Mode = "total" | "per_account";

// Toggle component for Total / Por cuenta
function ModeToggle({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-surface/60 border border-border rounded-lg p-0.5">
      <button
        onClick={() => onChange("total")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
          value === "total" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
        }`}>
        <Users className="h-3 w-3" /> Total
      </button>
      <button
        onClick={() => onChange("per_account")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
          value === "per_account" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
        }`}>
        <User className="h-3 w-3" /> Por cuenta
      </button>
    </div>
  );
}

function RiesgoPage() {
  const { trades: { trades }, accounts: { accounts }, riskSettings, setRiskSettings } = useApp();
  const [form, setForm]   = useState({ ...riskSettings });
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const todayTrades = useMemo(() =>
    trades.filter(t => (t.fecha ?? "").slice(0, 10) === today && t.resultado != null),
    [trades, today]
  );

  // Per account stats for today
  const accountStats = useMemo(() => {
    return accounts.map(a => {
      const num = a.numero_cuenta?.trim().toLowerCase();
      const ac  = a.nombre.trim().toLowerCase();
      const t   = todayTrades.filter(tr => {
        const tc = (tr.cuenta ?? "").trim().toLowerCase();
        return tc === ac || (num ? tc === num : false) || ac.includes(tc);
      });
      const pnl  = t.reduce((s, tr) => s + (tr.resultado ?? 0), 0);
      const loss = Math.abs(Math.min(0, pnl));
      return { nombre: a.nombre, ops: t.length, pnl, loss };
    });
  }, [accounts, todayTrades, today]);

  // Total stats
  const todayPnl  = useMemo(() => todayTrades.reduce((s, t) => s + (t.resultado ?? 0), 0), [todayTrades]);
  const todayOps  = todayTrades.length;
  const lossUsed  = Math.abs(Math.min(0, todayPnl));

  // Per-account worst case
  const worstAccountLoss = useMemo(() => Math.max(...accountStats.map(a => a.loss), 0), [accountStats]);
  const worstAccountOps  = useMemo(() => Math.max(...accountStats.map(a => a.ops), 0), [accountStats]);
  const bestAccountGain  = useMemo(() => Math.max(...accountStats.map(a => a.pnl), 0), [accountStats]);

  // Effective values based on mode
  const effectiveLoss    = form.maxLossMode  === "total" ? lossUsed          : worstAccountLoss;
  const effectiveOps     = form.maxOpsMode   === "total" ? todayOps           : worstAccountOps;
  const effectiveGain    = form.objetivoMode === "total" ? Math.max(0, todayPnl) : bestAccountGain;

  const lossUsedPct = form.maxLoss  > 0 ? (effectiveLoss / form.maxLoss) * 100 : 0;
  const opsUsedPct  = form.maxOps   > 0 ? (effectiveOps  / form.maxOps)  * 100 : 0;
  const objPct      = form.objetivo > 0 ? Math.min(100, (effectiveGain / form.objetivo) * 100) : 0;

  const maxLossHit  = effectiveLoss >= form.maxLoss  && form.maxLoss  > 0;
  const maxOpsHit   = effectiveOps  >= form.maxOps   && form.maxOps   > 0;
  const objReached  = effectiveGain >= form.objetivo && form.objetivo  > 0;

  const handleSave = () => {
    setRiskSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const barColor = (pct: number, inverse = false) => {
    if (inverse) return pct >= 100 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-success";
    return pct >= 100 ? "bg-success" : pct >= 50 ? "bg-info" : "bg-primary";
  };

  const modeLabel = (mode: Mode) => mode === "total" ? "todas las cuentas" : "la peor cuenta";

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Riesgo</h1>
          <p className="text-sm text-muted-foreground">Límites diarios y monitorización en tiempo real</p>
        </div>
      </div>

      {/* Alerts */}
      {(maxLossHit || maxOpsHit) && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${maxLossHit ? "border-destructive/30 bg-destructive/8 text-destructive" : "border-warning/30 bg-warning/8 text-warning"}`}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">
              {maxLossHit ? "🚨 Límite de pérdida alcanzado — Para de operar" : "⚠️ Límite de operaciones alcanzado"}
            </div>
            <div className="text-xs mt-0.5 opacity-80">
              {maxLossHit
                ? `${form.maxLossMode === "per_account" ? "Una cuenta ha alcanzado" : "Has perdido"} ${fmt(effectiveLoss)}, tu límite de ${fmt(form.maxLoss)}.`
                : `${form.maxOpsMode === "per_account" ? "Una cuenta tiene" : "Has realizado"} ${effectiveOps} operaciones, tu límite diario.`}
            </div>
          </div>
        </div>
      )}
      {objReached && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-success/30 bg-success/8 text-success">
          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">🎯 Objetivo diario alcanzado</div>
            <div className="text-xs mt-0.5 opacity-80">
              {form.objetivoMode === "per_account" ? "Una cuenta ha alcanzado" : "Has ganado"} {fmt(effectiveGain)}. Considera cerrar la sesión.
            </div>
          </div>
        </div>
      )}

      {/* Status cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Max Loss */}
        <div className={`rounded-2xl border backdrop-blur p-5 ${maxLossHit ? "border-destructive/30 bg-destructive/5" : "border-border bg-card/60"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pérdida máxima</div>
            <span className={`text-xs font-mono ${maxLossHit ? "text-destructive font-bold" : "text-muted-foreground"}`}>{lossUsedPct.toFixed(0)}%</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${maxLossHit ? "text-destructive" : "text-foreground"}`}>{fmt(effectiveLoss)}</div>
          <div className="text-xs text-muted-foreground mb-3">
            de {fmt(form.maxLoss)} · {form.maxLossMode === "total" ? <span className="text-info">todas las cuentas</span> : <span className="text-warning">por cuenta</span>}
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(lossUsedPct, true)}`} style={{ width: `${Math.min(100, lossUsedPct)}%` }} />
          </div>
          {form.maxLossMode === "per_account" && accountStats.some(a => a.loss > 0) && (
            <div className="mt-3 space-y-1">
              {accountStats.filter(a => a.loss > 0).map(a => (
                <div key={a.nombre} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground truncate">{a.nombre}</span>
                  <span className={`font-mono font-bold ${a.loss >= form.maxLoss ? "text-destructive" : "text-foreground"}`}>{fmt(a.loss)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Max Ops */}
        <div className={`rounded-2xl border backdrop-blur p-5 ${maxOpsHit ? "border-warning/30 bg-warning/5" : "border-border bg-card/60"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Operaciones</div>
            <span className={`text-xs font-mono ${maxOpsHit ? "text-warning font-bold" : "text-muted-foreground"}`}>{opsUsedPct.toFixed(0)}%</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${maxOpsHit ? "text-warning" : "text-foreground"}`}>{effectiveOps}</div>
          <div className="text-xs text-muted-foreground mb-3">
            de {form.maxOps} ops · {form.maxOpsMode === "total" ? <span className="text-info">todas las cuentas</span> : <span className="text-warning">por cuenta</span>}
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(opsUsedPct, true)}`} style={{ width: `${Math.min(100, opsUsedPct)}%` }} />
          </div>
          {form.maxOpsMode === "per_account" && accountStats.some(a => a.ops > 0) && (
            <div className="mt-3 space-y-1">
              {accountStats.filter(a => a.ops > 0).map(a => (
                <div key={a.nombre} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground truncate">{a.nombre}</span>
                  <span className={`font-mono font-bold ${a.ops >= form.maxOps ? "text-warning" : "text-foreground"}`}>{a.ops} ops</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Objective */}
        <div className={`rounded-2xl border backdrop-blur p-5 ${objReached ? "border-success/30 bg-success/5" : "border-border bg-card/60"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Objetivo diario</div>
            <span className={`text-xs font-mono ${objReached ? "text-success font-bold" : "text-muted-foreground"}`}>{objPct.toFixed(0)}%</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${todayPnl >= 0 ? "text-success" : "text-destructive"}`}>
            {(todayPnl >= 0 ? "+" : "-") + fmt(Math.abs(todayPnl))}
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            objetivo: {fmt(form.objetivo)} · {form.objetivoMode === "total" ? <span className="text-info">todas las cuentas</span> : <span className="text-warning">por cuenta</span>}
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(objPct)}`} style={{ width: `${Math.min(100, objPct)}%` }} />
          </div>
          {form.objetivoMode === "per_account" && accountStats.some(a => a.pnl > 0) && (
            <div className="mt-3 space-y-1">
              {accountStats.filter(a => a.pnl > 0).map(a => (
                <div key={a.nombre} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground truncate">{a.nombre}</span>
                  <span className={`font-mono font-bold ${a.pnl >= form.objetivo ? "text-success" : "text-foreground"}`}>+{fmt(a.pnl)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm font-semibold">Configuración de límites</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-info">Total</span> = suma de todas las cuentas ·
              <span className="font-semibold text-warning ml-1">Por cuenta</span> = se activa cuando cualquier cuenta individual supera el límite
            </p>
          </div>
          <button onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition">
            {saved ? <><Check className="h-4 w-4" />Guardado</> : <><Save className="h-4 w-4" />Guardar</>}
          </button>
        </div>

        <div className="space-y-5">
          {/* Pérdida máxima */}
          <div className="rounded-xl border border-border bg-surface/30 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pérdida máxima diaria ($)</label>
                <div className="text-xs text-muted-foreground mt-0.5">Detente cuando la pérdida alcance este importe</div>
              </div>
              <ModeToggle value={form.maxLossMode ?? "total"} onChange={v => setForm(f => ({ ...f, maxLossMode: v }))} />
            </div>
            <input type="number" value={form.maxLoss || ""} step="1"
              onChange={e => setForm(f => ({ ...f, maxLoss: Number(e.target.value) }))}
              placeholder="100"
              className="w-full bg-surface/80 border border-border rounded-xl px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="text-xs text-muted-foreground mt-2">
              {form.maxLossMode === "total"
                ? `⚠️ Alerta cuando la pérdida total de todas las cuentas supere ${fmt(form.maxLoss)}`
                : `⚠️ Alerta cuando CUALQUIER cuenta individual pierda más de ${fmt(form.maxLoss)}`}
            </div>
          </div>

          {/* Máximo operaciones */}
          <div className="rounded-xl border border-border bg-surface/30 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Máximo de operaciones/día</label>
                <div className="text-xs text-muted-foreground mt-0.5">Número máximo de trades permitidos al día</div>
              </div>
              <ModeToggle value={form.maxOpsMode ?? "total"} onChange={v => setForm(f => ({ ...f, maxOpsMode: v }))} />
            </div>
            <input type="number" value={form.maxOps || ""} step="1"
              onChange={e => setForm(f => ({ ...f, maxOps: Number(e.target.value) }))}
              placeholder="5"
              className="w-full bg-surface/80 border border-border rounded-xl px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="text-xs text-muted-foreground mt-2">
              {form.maxOpsMode === "total"
                ? `⚠️ Alerta cuando el total de operaciones de todas las cuentas supere ${form.maxOps}`
                : `⚠️ Alerta cuando CUALQUIER cuenta individual supere ${form.maxOps} operaciones`}
            </div>
          </div>

          {/* Objetivo */}
          <div className="rounded-xl border border-border bg-surface/30 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Objetivo de ganancia diaria ($)</label>
                <div className="text-xs text-muted-foreground mt-0.5">Objetivo de P&L para dar el día por bueno</div>
              </div>
              <ModeToggle value={form.objetivoMode ?? "total"} onChange={v => setForm(f => ({ ...f, objetivoMode: v }))} />
            </div>
            <input type="number" value={form.objetivo || ""} step="1"
              onChange={e => setForm(f => ({ ...f, objetivo: Number(e.target.value) }))}
              placeholder="200"
              className="w-full bg-surface/80 border border-border rounded-xl px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="text-xs text-muted-foreground mt-2">
              {form.objetivoMode === "total"
                ? `🎯 Objetivo alcanzado cuando la ganancia total de todas las cuentas supere ${fmt(form.objetivo)}`
                : `🎯 Objetivo alcanzado cuando CUALQUIER cuenta individual gane más de ${fmt(form.objetivo)}`}
            </div>
          </div>

          {/* Riesgo por operación */}
          <div className="rounded-xl border border-border bg-surface/30 p-4">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Riesgo por operación (%)</label>
            <div className="text-xs text-muted-foreground mt-0.5 mb-3">Porcentaje del balance arriesgado por trade</div>
            <input type="number" value={form.riskPct || ""} step="0.1"
              onChange={e => setForm(f => ({ ...f, riskPct: Number(e.target.value) }))}
              placeholder="1"
              className="w-full bg-surface/80 border border-border rounded-xl px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="text-xs text-muted-foreground mt-2">
              Este límite aplica siempre a nivel individual por operación
            </div>
          </div>
        </div>
      </div>

      {/* Today's trades */}
      {todayTrades.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Operaciones de hoy</span>
            <span className="text-xs text-muted-foreground">{todayTrades.length} ops · P&L {(todayPnl >= 0 ? "+" : "") + fmt(todayPnl)}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                {["Símbolo", "Cuenta", "Lado", "P&L"].map(h => (
                  <th key={h} className="text-left font-medium py-2 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayTrades.map(t => (
                <tr key={t.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                  <td className="py-2.5 px-4 font-semibold">{t.instrumento}</td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">{t.cuenta ?? "—"}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.tipo === "BUY" ? "text-success border-success/30 bg-success/10" : "text-info border-info/30 bg-info/10"}`}>
                      {t.tipo ?? "—"}
                    </span>
                  </td>
                  <td className={`py-2.5 px-4 font-mono font-bold ${(t.resultado ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                    {(t.resultado ?? 0) >= 0 ? "+" : "-"}${Math.abs(t.resultado ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
