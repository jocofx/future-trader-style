import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, TrendingDown, Pause, Lock, Activity,
  Plus, Trash2, ChevronRight, Flame, CircleDot,
} from "lucide-react";
import { Modal, Field, inputCls, selectCls, ModalButton } from "@/components/Modal";

export const Route = createFileRoute("/app/riesgo")({
  component: RiesgoPage,
});

type Severity = "ok" | "warn" | "danger";
type Rule = { id: string; label: string; limit: number; current: number; unit: string; severity?: Severity; enabled: boolean };

function RiesgoPage() {
  /* Account snapshot */
  const balance = 48210;
  const dailyPL = -612;
  const weeklyPL = 1840;
  const openRisk = 320;
  const equity = balance + dailyPL;

  const dailyLossLimit = 1500;
  const dailyLossPct = Math.min(100, (Math.abs(Math.min(0, dailyPL)) / dailyLossLimit) * 100);

  /* Rules */
  const [rules, setRules] = useState<Rule[]>([
    { id: "daily-loss",  label: "Pérdida diaria máx.",   limit: 1500, current: 612, unit: "$", enabled: true },
    { id: "max-trades",  label: "Trades por día",        limit: 5,    current: 3,   unit: " trades", enabled: true },
    { id: "max-risk",    label: "Riesgo por trade",      limit: 1.0,  current: 0.7, unit: "%", enabled: true },
    { id: "drawdown",    label: "Drawdown semanal",      limit: 5.0,  current: 1.2, unit: "%", enabled: true },
    { id: "consecutive", label: "Pérdidas consecutivas", limit: 3,    current: 2,   unit: "L",  enabled: true },
    { id: "cooldown",    label: "Cool-down post pérdida",limit: 30,   current: 30,  unit: " min", enabled: true },
  ]);
  const [ruleModal, setRuleModal] = useState(false);

  const addRule = (r: Omit<Rule, "id" | "current">) => {
    setRules((prev) => [...prev, { ...r, id: `rule-${Date.now()}`, current: 0 }]);
    setRuleModal(false);
  };
  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));

  const computed = rules.map((r) => {
    const ratio = r.current / r.limit;
    const sev: Severity = ratio >= 1 ? "danger" : ratio >= 0.7 ? "warn" : "ok";
    return { ...r, ratio: Math.min(1, ratio), severity: sev };
  });

  const danger = computed.filter((r) => r.severity === "danger" && r.enabled);
  const warn = computed.filter((r) => r.severity === "warn" && r.enabled);
  const isLocked = danger.length > 0;

  /* Risk score 0-100 */
  const riskScore = Math.max(0, Math.min(100, Math.round(
    100 - (computed.filter((r) => r.enabled).reduce((a, r) => a + r.ratio, 0) / computed.filter((r) => r.enabled).length) * 70 - danger.length * 15
  )));
  const scoreTone: Severity = riskScore >= 70 ? "ok" : riskScore >= 40 ? "warn" : "danger";

  /* Open positions */
  const positions = [
    { sym: "EURUSD", side: "LONG", size: 1.5, risk: 120, sl: "1.0810", tp: "1.0890", rr: 1.8 },
    { sym: "NAS100", side: "SHORT", size: 0.5, risk: 200, sl: "18,470", tp: "18,320", rr: 2.4 },
  ];

  /* Recent breaches */
  const breaches = [
    { date: "27 Abr", rule: "Cool-down post pérdida", desc: "Reentraste en 8 min tras −1.8R en EURUSD", impact: "−$140" },
    { date: "25 Abr", rule: "Trades por día", desc: "Abriste 7 ops, límite era 5", impact: "−$320" },
    { date: "22 Abr", rule: "Riesgo por trade", desc: "BTCUSD con 1.8% de riesgo (límite 1.0%)", impact: "−$210" },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-mesh opacity-50" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk management</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Control de Riesgo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reglas en tiempo real para proteger tu capital y disciplina.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md border ${
              isLocked
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : warn.length
                ? "bg-warning/10 text-warning border-warning/30"
                : "bg-success/10 text-success border-success/30"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isLocked ? "bg-destructive animate-pulse" : warn.length ? "bg-warning" : "bg-success animate-pulse"}`} />
              {isLocked ? "BLOQUEADO" : warn.length ? "ALERTA" : "EN REGLA"}
            </span>
          </div>
        </div>

        {/* Big alert when locked */}
        {isLocked && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 flex items-start gap-4 shadow-elegant">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-destructive/20 text-destructive border border-destructive/30 anim-pulse-glow">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-destructive">Trading pausado por regla de riesgo</div>
              <div className="text-sm text-foreground/80 mt-1">
                Has roto {danger.length} regla{danger.length > 1 ? "s" : ""} crítica{danger.length > 1 ? "s" : ""}: <span className="font-semibold">{danger.map((d) => d.label).join(", ")}</span>. Tradync no abrirá nuevas operaciones hasta el reinicio diario.
              </div>
            </div>
            <button className="text-xs px-3 py-2 rounded-lg glass hover:border-destructive/40 transition shrink-0">Override (no recomendado)</button>
          </div>
        )}

        {/* Top row: risk score + daily loss + capital */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk score donut */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Risk score</div>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={scoreTone === "ok" ? "oklch(0.78 0.18 158)" : scoreTone === "warn" ? "oklch(0.80 0.16 75)" : "oklch(0.68 0.22 18)"}
                    strokeWidth="3"
                    strokeDasharray={`${(riskScore / 100) * 97.4} 97.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="font-mono text-3xl font-bold tabular leading-none">{riskScore}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">/ 100</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${scoreTone === "ok" ? "text-success" : scoreTone === "warn" ? "text-warning" : "text-destructive"}`}>
                  {scoreTone === "ok" ? "Riesgo bajo" : scoreTone === "warn" ? "Vigilando" : "Crítico"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {scoreTone === "ok"
                    ? "Estás operando dentro de tus reglas. Mantén la disciplina."
                    : scoreTone === "warn"
                    ? "Cerca de uno o más límites. Reduce tamaño y revisa setups."
                    : "Has roto reglas críticas. Detén la sesión y revisa el journal."}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Pill icon={CircleDot} label={`${danger.length} críticas`} tone={danger.length ? "destructive" : "muted"} />
                  <Pill icon={CircleDot} label={`${warn.length} alertas`} tone={warn.length ? "warning" : "muted"} />
                </div>
              </div>
            </div>
          </div>

          {/* Daily loss gauge */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Pérdida diaria</div>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`font-mono text-3xl font-bold tabular ${dailyPL < 0 ? "text-destructive" : "text-success"}`}>
                {dailyPL < 0 ? "−" : "+"}${Math.abs(dailyPL)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">/ ${dailyLossLimit} límite</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-surface/60 overflow-hidden relative">
              <div
                className="h-full transition-all"
                style={{
                  width: `${dailyLossPct}%`,
                  background: dailyLossPct >= 80
                    ? "linear-gradient(90deg, oklch(0.80 0.16 75), oklch(0.68 0.22 18))"
                    : "linear-gradient(90deg, oklch(0.78 0.18 158), oklch(0.80 0.16 75))",
                }}
              />
              <div className="absolute top-0 bottom-0 border-l border-warning/60" style={{ left: "70%" }} />
              <div className="absolute top-0 bottom-0 border-l border-destructive/60" style={{ left: "100%" }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>0%</span><span className="text-warning">70%</span><span className="text-destructive">100%</span>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Quedan <span className="font-mono text-foreground">${dailyLossLimit - Math.abs(dailyPL)}</span> antes del bloqueo automático.
            </div>
          </div>

          {/* Capital */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Capital protegido</div>
            <div className="mt-3 font-mono text-3xl font-bold tabular">${equity.toLocaleString()}</div>
            <div className="mt-1 text-xs text-success font-mono">+${weeklyPL} esta semana</div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Mini label="Balance" value={`$${balance.toLocaleString()}`} />
              <Mini label="Riesgo abierto" value={`$${openRisk}`} tone="warning" />
              <Mini label="Free margin" value={`$${(equity - openRisk).toLocaleString()}`} tone="success" />
            </div>
          </div>
        </div>

        {/* Rules list */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold">Reglas activas</div>
              <div className="text-xs text-muted-foreground">Se evalúan en tiempo real ante cada operación</div>
            </div>
            <button
              onClick={() => setRuleModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Nueva regla
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {computed.map((r) => (
              <RuleRow
                key={r.id}
                rule={r}
                onToggle={() => setRules(rules.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                onRemove={() => removeRule(r.id)}
              />
            ))}
          </div>
        </div>

        {/* Open positions + recent breaches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Posiciones abiertas</div>
                <div className="text-xs text-muted-foreground">{positions.length} activa{positions.length !== 1 ? "s" : ""} · riesgo total ${openRisk}</div>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-2.5">
              {positions.map((p) => (
                <div key={p.sym} className="rounded-xl border border-border bg-surface/40 p-3.5 hover:border-primary/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-lg grid place-items-center text-[10px] font-mono font-bold border ${p.side === "LONG" ? "bg-success/10 text-success border-success/30" : "bg-info/10 text-info border-info/30"}`}>
                        {p.side[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{p.sym}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.size} lots · R:R {p.rr}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-destructive">−${p.risk}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">en riesgo</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-1.5 flex items-center justify-between">
                      <span className="text-destructive">SL</span><span>{p.sl}</span>
                    </div>
                    <div className="rounded-md bg-success/10 border border-success/20 px-2 py-1.5 flex items-center justify-between">
                      <span className="text-success">TP</span><span>{p.tp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Reglas rotas (últimos 7 días)</div>
                <div className="text-xs text-muted-foreground">Patrones que te están costando dinero</div>
              </div>
              <Flame className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-4 space-y-2.5">
              {breaches.map((b, i) => (
                <div key={i} className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 flex items-start gap-3">
                  <div className="h-8 w-8 grid place-items-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{b.rule}</div>
                      <div className="text-[10px] font-mono text-muted-foreground shrink-0">{b.date}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{b.desc}</div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-destructive shrink-0">{b.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <NewRuleModal open={ruleModal} onClose={() => setRuleModal(false)} onCreate={addRule} />
    </div>
  );
}

function NewRuleModal({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (r: Omit<Rule, "id" | "current">) => void;
}) {
  const [label, setLabel] = useState("");
  const [limit, setLimit] = useState("");
  const [unit, setUnit] = useState("$");
  const [enabled, setEnabled] = useState(true);

  const reset = () => { setLabel(""); setLimit(""); setUnit("$"); setEnabled(true); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ label: label.trim(), limit: parseFloat(limit) || 0, unit, enabled });
    reset();
  };

  const presets = [
    { label: "Pérdida diaria máx.", unit: "$", limit: "1000" },
    { label: "Trades por día", unit: " trades", limit: "5" },
    { label: "Riesgo por trade", unit: "%", limit: "1" },
    { label: "Drawdown semanal", unit: "%", limit: "5" },
  ];

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title="Nueva regla de riesgo"
      subtitle="Define un límite que se evaluará en tiempo real"
      size="md"
      footer={
        <>
          <ModalButton type="button" onClick={() => { onClose(); reset(); }}>Cancelar</ModalButton>
          <ModalButton type="submit" form="new-rule-form" variant="primary" disabled={!label || !limit}>
            <Plus className="h-3.5 w-3.5 inline mr-1" /> Crear regla
          </ModalButton>
        </>
      }
    >
      <form id="new-rule-form" onSubmit={submit} className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2 font-medium">Plantillas</div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => { setLabel(p.label); setUnit(p.unit); setLimit(p.limit); }}
                className="text-left p-2.5 rounded-lg border border-border bg-surface-2/40 hover:border-primary/40 hover:bg-primary/5 transition text-xs"
              >
                <div className="font-semibold truncate">{p.label}</div>
                <div className="text-muted-foreground font-mono text-[10px] mt-0.5">≤ {p.limit}{p.unit}</div>
              </button>
            ))}
          </div>
        </div>

        <Field label="Nombre de la regla">
          <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Pérdida diaria máx." required maxLength={50} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Límite" className="col-span-2">
            <input className={inputCls} type="number" min="0" step="0.1" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="1000" required />
          </Field>
          <Field label="Unidad">
            <select className={selectCls} value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="$">$</option>
              <option value="%">%</option>
              <option value=" trades">trades</option>
              <option value=" min">minutos</option>
              <option value="L">pérdidas</option>
            </select>
          </Field>
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2/40 cursor-pointer">
          <div>
            <div className="text-sm font-medium">Activar al crear</div>
            <div className="text-[11px] text-muted-foreground">La regla bloqueará operaciones si se rompe</div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative h-5 w-9 rounded-full transition shrink-0 ${enabled ? "bg-primary" : "bg-surface-3"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${enabled ? "translate-x-4" : ""}`} />
          </button>
        </label>
      </form>
    </Modal>
  );
}

function RuleRow({ rule, onToggle, onRemove }: { rule: Rule & { ratio: number; severity: Severity }; onToggle: () => void; onRemove: () => void }) {
  const sevColor = rule.severity === "danger" ? "var(--destructive)" : rule.severity === "warn" ? "var(--warning)" : "var(--primary)";
  const sevText = rule.severity === "danger" ? "text-destructive" : rule.severity === "warn" ? "text-warning" : "text-success";
  const sevBorder = rule.severity === "danger" ? "border-destructive/30" : rule.severity === "warn" ? "border-warning/30" : "border-border";

  return (
    <div className={`rounded-xl border ${sevBorder} bg-surface/40 p-4 transition ${!rule.enabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggle}
            role="switch"
            aria-checked={rule.enabled}
            className={`relative h-5 w-9 rounded-full transition shrink-0 ${rule.enabled ? "bg-primary" : "bg-surface-3"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${rule.enabled ? "translate-x-4" : ""}`} />
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{rule.label}</div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {rule.current}{rule.unit} <span className="text-muted-foreground/60">/</span> {rule.limit}{rule.unit}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${sevText}`}>
            {rule.severity === "danger" ? "Roto" : rule.severity === "warn" ? "Cerca" : "OK"}
          </span>
          <button onClick={onRemove} className="h-7 w-7 grid place-items-center rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-surface/60 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${rule.ratio * 100}%`,
            background: `color-mix(in oklab, ${sevColor} 80%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

function Pill({ icon: Icon, label, tone }: { icon: any; label: string; tone: "destructive" | "warning" | "muted" }) {
  const cls = tone === "destructive"
    ? "bg-destructive/10 text-destructive border-destructive/25"
    : tone === "warning"
    ? "bg-warning/10 text-warning border-warning/25"
    : "bg-surface/60 text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${cls}`}>
      <Icon className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg bg-surface/50 border border-border px-2 py-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono text-xs font-semibold tabular ${cls}`}>{value}</div>
    </div>
  );
}
