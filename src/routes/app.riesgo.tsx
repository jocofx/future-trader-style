import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ShieldCheck, Save, Check, AlertTriangle, ChevronDown, ChevronUp,
  Globe, User, ToggleLeft, ToggleRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { AccountRiskConfig } from "@/lib/types";

export const Route = createFileRoute("/app/riesgo")({ component: RiesgoPage });

const EMPTY_CONFIG: AccountRiskConfig = { maxLoss: 0, maxOps: 0, objetivo: 0, riskPct: 1, enabled: true };

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function NumInput({ label, desc, value, onChange, step = "1", placeholder }: {
  label: string; desc?: string; value: number; onChange: (v: number) => void;
  step?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
      {desc && <div className="text-[10px] text-muted-foreground mt-0.5 mb-1.5">{desc}</div>}
      <input type="number" value={value || ""} step={step} placeholder={placeholder ?? "0 = sin límite"}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-surface/80 border border-border rounded-xl px-3 py-2.5 text-base font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

// ── Account Risk Card ───────────────────────────────────────────────
function AccountRiskCard({ nombre, numeroCuenta, config, todayTrades, onChange }: {
  nombre: string;
  numeroCuenta?: string | null;
  config: AccountRiskConfig;
  todayTrades: any[];
  onChange: (c: AccountRiskConfig) => void;
}) {
  const [open, setOpen] = useState(false);

  const num    = numeroCuenta?.trim().toLowerCase();
  const ac     = nombre.trim().toLowerCase();
  const myTrades = todayTrades.filter(t => {
    const tc = (t.cuenta ?? "").trim().toLowerCase();
    return tc === ac || (num ? tc === num : false) || ac.includes(tc);
  });

  const todayPnl  = myTrades.reduce((s: number, t: any) => s + (t.resultado ?? 0), 0);
  const todayOps  = myTrades.length;
  const lossUsed  = Math.abs(Math.min(0, todayPnl));

  const lossAlert = config.maxLoss  > 0 && lossUsed  >= config.maxLoss;
  const opsAlert  = config.maxOps   > 0 && todayOps  >= config.maxOps;
  const objOk     = config.objetivo > 0 && todayPnl  >= config.objetivo;

  const hasAlert = lossAlert || opsAlert;

  return (
    <div className={`rounded-2xl border backdrop-blur overflow-hidden transition ${
      hasAlert ? "border-destructive/40 bg-destructive/5" :
      objOk    ? "border-success/30 bg-success/5" :
      "border-border bg-card/60"
    }`}>
      {/* Header */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/30 transition">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            hasAlert ? "bg-destructive animate-pulse" : objOk ? "bg-success" : "bg-primary/50"
          }`} />
          <div className="text-left min-w-0">
            <div className="font-semibold text-sm truncate">{nombre}</div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-mono">
                Hoy: {todayOps} ops · {todayPnl >= 0 ? "+" : ""}{fmt(Math.abs(todayPnl))}
              </span>
              {!config.enabled && <span className="text-[10px] text-muted-foreground italic">Sin límites</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Quick status pills */}
          <div className="hidden sm:flex items-center gap-2">
            {config.maxLoss > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                lossAlert ? "bg-destructive/15 border-destructive/30 text-destructive" : "bg-surface border-border text-muted-foreground"
              }`}>
                -{fmt(config.maxLoss)}
              </span>
            )}
            {config.maxOps > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                opsAlert ? "bg-warning/15 border-warning/30 text-warning" : "bg-surface border-border text-muted-foreground"
              }`}>
                {todayOps}/{config.maxOps} ops
              </span>
            )}
            {config.objetivo > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                objOk ? "bg-success/15 border-success/30 text-success" : "bg-surface border-border text-muted-foreground"
              }`}>
                +{fmt(config.objetivo)}
              </span>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded config */}
      {open && (
        <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Límites activos para esta cuenta</div>
              <div className="text-xs text-muted-foreground">Si está desactivado, no se aplican límites individuales</div>
            </div>
            <button onClick={() => onChange({ ...config, enabled: !config.enabled })}
              className="text-muted-foreground hover:text-primary transition">
              {config.enabled
                ? <ToggleRight className="h-7 w-7 text-primary" />
                : <ToggleLeft className="h-7 w-7" />}
            </button>
          </div>

          {config.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label="Pérdida máxima ($)"
                desc="Alerta cuando esta cuenta pierda este importe hoy"
                value={config.maxLoss}
                onChange={v => onChange({ ...config, maxLoss: v })}
              />
              <NumInput
                label="Máx. operaciones/día"
                desc="Alerta cuando esta cuenta supere este número de ops"
                value={config.maxOps}
                onChange={v => onChange({ ...config, maxOps: v })}
              />
              <NumInput
                label="Objetivo de ganancia ($)"
                desc="Notificación cuando esta cuenta alcance esta ganancia"
                value={config.objetivo}
                onChange={v => onChange({ ...config, objetivo: v })}
              />
              <NumInput
                label="Riesgo por op (%)"
                desc="% del balance arriesgado por operación en esta cuenta"
                value={config.riskPct}
                onChange={v => onChange({ ...config, riskPct: v })}
                step="0.1"
                placeholder="1"
              />
            </div>
          )}

          {/* Today progress bars if limits set */}
          {config.enabled && (config.maxLoss > 0 || config.maxOps > 0 || config.objetivo > 0) && (
            <div className="space-y-2 pt-2 border-t border-border">
              {config.maxLoss > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Pérdida hoy</span>
                    <span className={`font-mono font-bold ${lossAlert ? "text-destructive" : "text-foreground"}`}>
                      {fmt(lossUsed)} / {fmt(config.maxLoss)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${lossAlert ? "bg-destructive" : lossUsed / config.maxLoss > 0.7 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${Math.min(100, config.maxLoss > 0 ? (lossUsed / config.maxLoss) * 100 : 0)}%` }} />
                  </div>
                </div>
              )}
              {config.maxOps > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Operaciones hoy</span>
                    <span className={`font-mono font-bold ${opsAlert ? "text-warning" : "text-foreground"}`}>
                      {todayOps} / {config.maxOps}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${opsAlert ? "bg-warning" : todayOps / config.maxOps > 0.7 ? "bg-warning/60" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, config.maxOps > 0 ? (todayOps / config.maxOps) * 100 : 0)}%` }} />
                  </div>
                </div>
              )}
              {config.objetivo > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Ganancia hoy</span>
                    <span className={`font-mono font-bold ${objOk ? "text-success" : "text-foreground"}`}>
                      {fmt(Math.max(0, todayPnl))} / {fmt(config.objetivo)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${objOk ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, config.objetivo > 0 ? (Math.max(0, todayPnl) / config.objetivo) * 100 : 0)}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
function RiesgoPage() {
  const { trades: { trades }, accounts: { accounts }, riskSettings, setRiskSettings } = useApp();
  const [form, setForm]     = useState({ ...riskSettings, accounts: { ...(riskSettings.accounts ?? {}) } });
  const [saved, setSaved]   = useState(false);
  const [section, setSection] = useState<"global" | "accounts">("global");

  const today       = new Date().toISOString().slice(0, 10);
  const todayTrades = useMemo(() => trades.filter(t => (t.fecha ?? "").slice(0, 10) === today && t.resultado != null), [trades, today]);
  const todayPnl    = useMemo(() => todayTrades.reduce((s, t) => s + (t.resultado ?? 0), 0), [todayTrades]);
  const todayOps    = todayTrades.length;
  const lossUsed    = Math.abs(Math.min(0, todayPnl));

  const lossUsedPct = form.maxLoss  > 0 ? (lossUsed  / form.maxLoss)  * 100 : 0;
  const opsUsedPct  = form.maxOps   > 0 ? (todayOps  / form.maxOps)   * 100 : 0;
  const objPct      = form.objetivo > 0 ? Math.min(100, (Math.max(0, todayPnl) / form.objetivo) * 100) : 0;

  const maxLossHit = lossUsed >= form.maxLoss && form.maxLoss > 0;
  const maxOpsHit  = todayOps >= form.maxOps  && form.maxOps  > 0;
  const objReached = todayPnl >= form.objetivo && form.objetivo > 0;

  // Check per-account alerts
  const accountAlerts = useMemo(() => {
    return accounts.filter(a => {
      const cfg = form.accounts?.[a.id];
      if (!cfg?.enabled) return false;
      const num = a.numero_cuenta?.trim().toLowerCase();
      const ac  = a.nombre.trim().toLowerCase();
      const t   = todayTrades.filter(tr => {
        const tc = (tr.cuenta ?? "").trim().toLowerCase();
        return tc === ac || (num ? tc === num : false) || ac.includes(tc);
      });
      const pnl  = t.reduce((s, tr) => s + (tr.resultado ?? 0), 0);
      const loss = Math.abs(Math.min(0, pnl));
      return (cfg.maxLoss > 0 && loss >= cfg.maxLoss) || (cfg.maxOps > 0 && t.length >= cfg.maxOps);
    });
  }, [accounts, form.accounts, todayTrades]);

  const handleSave = () => {
    setRiskSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateAccountConfig = (id: string, cfg: AccountRiskConfig) => {
    setForm(f => ({ ...f, accounts: { ...f.accounts, [id]: cfg } }));
  };

  const barStyle = (pct: number, inverse = false) => {
    if (inverse) return pct >= 100 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-success";
    return pct >= 100 ? "bg-success" : pct >= 50 ? "bg-info" : "bg-primary";
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Control de Riesgo</h1>
            <p className="text-sm text-muted-foreground">Límites globales y por cuenta</p>
          </div>
        </div>
        <button onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          {saved ? <><Check className="h-4 w-4" />Guardado</> : <><Save className="h-4 w-4" />Guardar cambios</>}
        </button>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="rounded-2xl border border-info/20 bg-info/5 p-5">
        <div className="flex gap-4">
          <div className="text-2xl shrink-0 mt-0.5">💡</div>
          <div className="space-y-2">
            <div className="font-semibold text-sm text-foreground">
              ¿Para qué sirve este apartado?
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aquí defines tus <span className="text-foreground font-semibold">reglas personales de trading</span> —
              los límites que tú mismo te pones para mantener la disciplina.
              Esta información la usan <span className="text-foreground font-semibold">Insights</span> y el módulo de
              <span className="text-foreground font-semibold"> Psicología</span> para analizar si estás respetando tus
              propias normas, detectar sobreoperación, revenge trading y otros patrones de conducta.
            </p>
            <div className="flex items-start gap-2 pt-1 p-3 rounded-xl bg-warning/8 border border-warning/20">
              <span className="text-base shrink-0">⚠️</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Este apartado no bloquea operaciones en tu terminal.</span>{" "}
                Si quieres que los límites se apliquen de forma automática y en tiempo real
                — cerrando posiciones, bloqueando nuevas entradas y aplicando el gestor de riesgo —
                configúralos en el{" "}
                <span className="font-semibold text-foreground">Gestor EA → Configurar → Gestor de Riesgo</span>.
                El EA es quien ejecuta los límites directamente en MetaTrader.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(maxLossHit || maxOpsHit || accountAlerts.length > 0) && (
        <div className="space-y-2">
          {maxLossHit && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/8 text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">🚨 Límite global de pérdida alcanzado — {fmt(lossUsed)} de {fmt(form.maxLoss)}</span>
            </div>
          )}
          {maxOpsHit && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-warning/30 bg-warning/8 text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">⚠️ Límite global de operaciones alcanzado — {todayOps} de {form.maxOps}</span>
            </div>
          )}
          {accountAlerts.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/8 text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">🚨 Límite alcanzado en <span className="underline">{a.nombre}</span></span>
            </div>
          ))}
          {objReached && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-success/30 bg-success/8 text-success">
              <Check className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">🎯 Objetivo global alcanzado — +{fmt(todayPnl)}</span>
            </div>
          )}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex bg-surface/60 border border-border rounded-xl p-1 gap-1">
        <button onClick={() => setSection("global")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${section === "global" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <Globe className="h-4 w-4" /> Límites globales
        </button>
        <button onClick={() => setSection("accounts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${section === "accounts" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <User className="h-4 w-4" /> Por cuenta {accounts.length > 0 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{accounts.length}</span>}
        </button>
      </div>

      {/* ── GLOBAL LIMITS ── */}
      {section === "global" && (
        <>
          {/* Status cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Pérdida total hoy", val: fmt(lossUsed),    pct: lossUsedPct, limit: fmt(form.maxLoss),  hit: maxLossHit, inverse: true,  color: maxLossHit ? "text-destructive" : "text-foreground" },
              { label: "Operaciones hoy",   val: String(todayOps), pct: opsUsedPct,  limit: `${form.maxOps} ops`, hit: maxOpsHit, inverse: true, color: maxOpsHit ? "text-warning" : "text-foreground" },
              { label: "P&L hoy",           val: (todayPnl >= 0 ? "+" : "") + fmt(Math.abs(todayPnl)), pct: objPct, limit: `obj. ${fmt(form.objetivo)}`, hit: objReached, inverse: false, color: todayPnl >= 0 ? "text-success" : "text-destructive" },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border backdrop-blur p-5 ${s.hit ? "border-destructive/30 bg-destructive/5" : "border-border bg-card/60"}`}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{s.label}</div>
                <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-xs text-muted-foreground mb-3">{s.limit}</div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barStyle(s.pct, s.inverse)}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Global config */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-sm font-semibold mb-1">Límites globales — todas las cuentas combinadas</div>
            <p className="text-xs text-muted-foreground mb-5">Se activan cuando la suma de TODAS tus cuentas supera el límite</p>
            <div className="grid md:grid-cols-2 gap-5">
              <NumInput label="Pérdida máxima diaria ($)" desc="Suma de pérdidas de todas las cuentas"
                value={form.maxLoss} onChange={v => setForm(f => ({ ...f, maxLoss: v }))} />
              <NumInput label="Máx. operaciones/día" desc="Total de ops entre todas las cuentas"
                value={form.maxOps} onChange={v => setForm(f => ({ ...f, maxOps: v }))} />
              <NumInput label="Objetivo de ganancia ($)" desc="P&L total de todas las cuentas"
                value={form.objetivo} onChange={v => setForm(f => ({ ...f, objetivo: v }))} />
              <NumInput label="Riesgo por operación (%)" desc="Referencia general de riesgo" step="0.1" placeholder="1"
                value={form.riskPct} onChange={v => setForm(f => ({ ...f, riskPct: v }))} />
            </div>
          </div>

          {/* Today's trades */}
          {todayTrades.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold">Operaciones de hoy</span>
                <span className="text-xs text-muted-foreground">{todayTrades.length} ops · {todayPnl >= 0 ? "+" : ""}{fmt(Math.abs(todayPnl))}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                    {["Símbolo", "Cuenta", "Lado", "P&L"].map(h => <th key={h} className="text-left font-medium py-2 px-4">{h}</th>)}
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
        </>
      )}

      {/* ── PER ACCOUNT ── */}
      {section === "accounts" && (
        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="text-3xl mb-3">🏦</div>
              No tienes cuentas registradas. Añade cuentas en el menú <span className="font-semibold text-foreground">Cuentas</span> para configurar límites individuales.
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Haz click en cada cuenta para configurar sus límites individuales. Los límites por cuenta son independientes de los globales — ambos pueden estar activos al mismo tiempo.
              </p>
              {accounts.map(a => (
                <AccountRiskCard
                  key={a.id}
                  nombre={a.nombre}
                  numeroCuenta={a.numero_cuenta}
                  config={form.accounts?.[a.id] ?? { ...EMPTY_CONFIG }}
                  todayTrades={todayTrades}
                  onChange={cfg => updateAccountConfig(a.id, cfg)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
