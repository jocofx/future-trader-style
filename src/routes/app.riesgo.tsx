import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldCheck, Save, Check, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/riesgo")({
  component: RiesgoPage,
});

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RiesgoPage() {
  const { trades: { trades }, riskSettings, setRiskSettings } = useApp();
  const [form, setForm]   = useState({ ...riskSettings });
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayTrades = useMemo(() => trades.filter(t => t.fecha === today && t.resultado != null), [trades, today]);
  const todayPnl    = useMemo(() => todayTrades.reduce((s,t) => s+(t.resultado??0), 0), [todayTrades]);
  const todayOps    = todayTrades.length;

  const handleSave = () => {
    setRiskSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Risk status
  const lossUsed = Math.abs(Math.min(0, todayPnl));
  const lossUsedPct = form.maxLoss > 0 ? (lossUsed / form.maxLoss) * 100 : 0;
  const opsUsedPct  = form.maxOps  > 0 ? (todayOps  / form.maxOps)  * 100 : 0;
  const objPct      = form.objetivo > 0 ? Math.min(100, (Math.max(0, todayPnl) / form.objetivo) * 100) : 0;

  const maxLossHit  = lossUsed >= form.maxLoss && form.maxLoss > 0;
  const maxOpsHit   = todayOps >= form.maxOps  && form.maxOps  > 0;
  const objReached  = todayPnl >= form.objetivo && form.objetivo > 0;

  const barColor = (pct: number, inverse = false) => {
    if (inverse) return pct >= 100 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-success";
    return pct >= 100 ? "bg-success" : pct >= 50 ? "bg-info" : "bg-primary";
  };

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
              {maxLossHit ? `Has perdido ${fmt(lossUsed)} hoy, alcanzando tu límite de ${fmt(form.maxLoss)}.` : `Has realizado ${todayOps} operaciones, tu límite diario.`}
            </div>
          </div>
        </div>
      )}
      {objReached && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-success/30 bg-success/8 text-success">
          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">🎯 Objetivo diario alcanzado</div>
            <div className="text-xs mt-0.5 opacity-80">Has ganado {fmt(todayPnl)} hoy. Considera cerrar la sesión.</div>
          </div>
        </div>
      )}

      {/* Today status */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Max Loss */}
        <div className={`rounded-2xl border backdrop-blur p-5 ${maxLossHit ? "border-destructive/30 bg-destructive/5" : "border-border bg-card/60"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pérdida máxima</div>
            <span className={`text-xs font-mono ${maxLossHit ? "text-destructive font-bold" : "text-muted-foreground"}`}>{lossUsedPct.toFixed(0)}%</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${maxLossHit ? "text-destructive" : "text-foreground"}`}>{fmt(lossUsed)}</div>
          <div className="text-xs text-muted-foreground mb-3">de {fmt(form.maxLoss)} límite</div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(lossUsedPct, true)}`} style={{ width: `${Math.min(100,lossUsedPct)}%` }} />
          </div>
        </div>

        {/* Max Ops */}
        <div className={`rounded-2xl border backdrop-blur p-5 ${maxOpsHit ? "border-warning/30 bg-warning/5" : "border-border bg-card/60"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Operaciones</div>
            <span className={`text-xs font-mono ${maxOpsHit ? "text-warning font-bold" : "text-muted-foreground"}`}>{opsUsedPct.toFixed(0)}%</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${maxOpsHit ? "text-warning" : "text-foreground"}`}>{todayOps}</div>
          <div className="text-xs text-muted-foreground mb-3">de {form.maxOps} operaciones</div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(opsUsedPct, true)}`} style={{ width: `${Math.min(100,opsUsedPct)}%` }} />
          </div>
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
          <div className="text-xs text-muted-foreground mb-3">objetivo: {fmt(form.objetivo)}</div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(objPct)}`} style={{ width: `${Math.min(100,objPct)}%` }} />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm font-semibold">Configuración de límites</div>
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition">
            {saved ? <><Check className="h-4 w-4"/>Guardado</> : <><Save className="h-4 w-4"/>Guardar</>}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { key:"maxLoss",  label:"Pérdida máxima diaria ($)",  placeholder:"100", desc:"Detente cuando pierdas esta cantidad en el día" },
            { key:"maxOps",   label:"Máximo de operaciones/día",  placeholder:"5",   desc:"Número máximo de trades permitidos al día" },
            { key:"objetivo", label:"Objetivo de ganancia diaria ($)", placeholder:"200", desc:"Objetivo de P&L para dar el día por bueno" },
            { key:"riskPct",  label:"Riesgo por operación (%)",   placeholder:"1",   desc:"Porcentaje del balance arriesgado por trade" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{f.label}</label>
              <input type="number" value={(form as Record<string,number>)[f.key] ?? ""} step={f.key==="riskPct"?"0.1":"1"}
                onChange={e => setForm(prev => ({...prev, [f.key]: Number(e.target.value)}))}
                placeholder={f.placeholder}
                className="mt-1.5 w-full bg-surface/80 border border-border-strong rounded-xl px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent trades today */}
      {todayTrades.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-sm font-semibold">Operaciones de hoy</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                {["Hora","Símbolo","Lado","P&L"].map(h => (
                  <th key={h} className="text-left font-medium py-2 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayTrades.map(t => (
                <tr key={t.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-xs">{t.hora ?? "—"}</td>
                  <td className="py-2.5 px-4 font-semibold">{t.instrumento}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.tipo==="BUY"?"text-success border-success/30 bg-success/10":"text-info border-info/30 bg-info/10"}`}>{t.tipo}</span>
                  </td>
                  <td className={`py-2.5 px-4 font-mono font-bold ${(t.resultado??0)>=0?"text-success":"text-destructive"}`}>
                    {(t.resultado??0)>=0?"+":"-"}${Math.abs(t.resultado??0).toFixed(2)}
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
