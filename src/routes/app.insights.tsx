import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles, TrendingUp, TrendingDown, Brain, Target, AlertTriangle,
  Clock, Award, Activity, Zap, ChevronRight, Lightbulb, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "Insights · Tradync" },
      { name: "description", content: "Tu perfil de trader: fortalezas, sesgos y áreas de mejora detectadas por IA." },
    ],
  }),
  component: InsightsPage,
});

/* ───────────────────────── Helpers ───────────────────────── */

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtUSD = (n: number) =>
  `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/* ───────────────────────── Data (sintética, determinista) ───────────────────────── */

type TraderProfile = {
  archetype: string;
  tagline: string;
  score: number; // 0–100
  level: number;
  xp: number;
  xpNext: number;
  traits: { label: string; value: number }[]; // 0–100
};

const PROFILE: TraderProfile = {
  archetype: "Scalper Disciplinado",
  tagline: "Operas mejor en sesión de NY, con paciencia y sin venganza.",
  score: 74,
  level: 12,
  xp: 2840,
  xpNext: 3500,
  traits: [
    { label: "Disciplina", value: 82 },
    { label: "Paciencia", value: 68 },
    { label: "Gestión Riesgo", value: 88 },
    { label: "Consistencia", value: 71 },
    { label: "Control Emocional", value: 64 },
    { label: "Adaptabilidad", value: 59 },
  ],
};

const STRENGTHS = [
  { icon: ShieldCheck, label: "Stop loss respetado", detail: "94% de tus operaciones cierran al SL definido", value: "94%" },
  { icon: Target,      label: "R:R medio elevado",    detail: "Promedio de 1:2.3 en setups validados",         value: "1:2.3" },
  { icon: Clock,       label: "Mejor en NY Open",     detail: "Win rate 71% entre 09:30 y 11:30 EST",           value: "71%" },
  { icon: Award,       label: "Racha de constancia",  detail: "21 días seguidos cumpliendo plan diario",        value: "21 días" },
];

const WEAKNESSES = [
  { icon: AlertTriangle, label: "Revenge trading viernes", detail: "Tras pérdidas, abres 2.4× más trades de media", severity: "high" as const },
  { icon: Activity,      label: "Sobreoperación en Asia",  detail: "Resultado neto -3.2R en últimos 30 días",       severity: "high" as const },
  { icon: Brain,         label: "Cierres prematuros",      detail: "Cierras winners a 0.6R cuando target es 1.5R",  severity: "med"  as const },
  { icon: TrendingDown,  label: "Drawdown emocional",      detail: "Reduces tamaño un 40% tras 2 pérdidas",         severity: "med"  as const },
];

const BIASES = [
  { name: "FOMO",                value: 64, trend: -8,  desc: "Entras tarde a movimientos ya extendidos." },
  { name: "Confirmación",        value: 42, trend: -12, desc: "Buscas señales que validen tu sesgo previo." },
  { name: "Aversión a pérdida",  value: 71, trend: 4,   desc: "Mantienes losers esperando que vuelvan." },
  { name: "Anclaje",             value: 38, trend: -5,  desc: "Te aferras al primer precio observado." },
  { name: "Exceso de confianza", value: 58, trend: 11,  desc: "Sobre-apalancas tras winning streaks." },
];

const RECOMMENDATIONS = [
  {
    priority: "Alta",
    title: "Bloquea operativa los viernes tras 2 pérdidas",
    impact: "+$1,240 estimados/mes",
    action: "Activar regla de cool-down automática",
  },
  {
    priority: "Alta",
    title: "Define TP fijo en setups A+",
    impact: "+0.4R por trade promedio",
    action: "Editar plantilla de plan diario",
  },
  {
    priority: "Media",
    title: "Evita sesión asiática salvo gaps confirmados",
    impact: "Reduce ruido y -3.2R recientes",
    action: "Configurar filtro horario",
  },
  {
    priority: "Media",
    title: "Journal post-trade obligatorio",
    impact: "+12% adherencia al plan en 14 días",
    action: "Activar checklist de cierre",
  },
];

const MILESTONES = [
  { date: "Hace 2 días", event: "Subiste a nivel 12", icon: Award },
  { date: "Hace 5 días", event: "Mejor semana del año (+5.4%)", icon: TrendingUp },
  { date: "Hace 9 días", event: "Detectado patrón ganador: NY Open + EUR/USD", icon: Sparkles },
  { date: "Hace 14 días", event: "Reduciste drawdown emocional un 22%", icon: Brain },
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

function SectionTitle({ icon: Icon, children, hint }: { icon: any; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
      </div>
      {hint && <span className="text-[11px] text-muted-foreground font-mono">{hint}</span>}
    </div>
  );
}

/* ───────────────────────── Charts ───────────────────────── */

function RadarChart({ traits }: { traits: { label: string; value: number }[] }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 92;
  const N = traits.length;

  const point = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const polyPoints = traits
    .map((t, i) => point(i, (t.value / 100) * radius))
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[280px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <polygon
          key={i}
          points={traits
            .map((_, j) => point(j, radius * scale))
            .map(([x, y]) => `${x},${y}`)
            .join(" ")}
          fill="none"
          stroke="color-mix(in oklab, var(--foreground) 8%, transparent)"
          strokeWidth="1"
        />
      ))}
      {traits.map((_, i) => {
        const [x, y] = point(i, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="color-mix(in oklab, var(--foreground) 6%, transparent)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polyPoints}
        fill="color-mix(in oklab, var(--primary) 22%, transparent)"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {traits.map((t, i) => {
        const [x, y] = point(i, (t.value / 100) * radius);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--primary)" />;
      })}
      {traits.map((t, i) => {
        const [lx, ly] = point(i, radius + 18);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreDonut({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-[120px] w-[120px] mx-auto">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="color-mix(in oklab, var(--foreground) 8%, transparent)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-bold font-mono">{score}</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Score</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

function InsightsPage() {
  const [tab, setTab] = useState<"overview" | "biases" | "recos">("overview");

  const xpPct = useMemo(() => Math.round((PROFILE.xp / PROFILE.xpNext) * 100), []);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Insights IA
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tu perfil de trader</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis basado en <span className="font-mono text-foreground">418 operaciones</span> de los últimos 90 días.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1">
          {([
            ["overview", "Overview"],
            ["biases", "Sesgos"],
            ["recos", "Recomendaciones"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                tab === k
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <>
          {/* Hero profile */}
          <Card className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(600px 200px at 10% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
              }}
            />
            <div className="relative grid lg:grid-cols-[1fr_auto_1.4fr] gap-6 items-center">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
                  <Award className="h-3.5 w-3.5" />
                  Arquetipo
                </div>
                <div className="text-3xl font-bold tracking-tight">{PROFILE.archetype}</div>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">{PROFILE.tagline}</p>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Nivel {PROFILE.level} · {PROFILE.xp.toLocaleString()} XP</span>
                    <span className="font-mono text-foreground/80">{PROFILE.xpNext.toLocaleString()} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                      style={{
                        width: `${xpPct}%`,
                        boxShadow: "0 0 12px color-mix(in oklab, var(--primary) 60%, transparent)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-px h-32 bg-border" />

              <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
                <ScoreDonut score={PROFILE.score} />
                <RadarChart traits={PROFILE.traits} />
              </div>
            </div>
          </Card>

          {/* Strengths + Weaknesses */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <SectionTitle icon={ShieldCheck} hint={`${STRENGTHS.length} detectadas`}>
                Fortalezas
              </SectionTitle>
              <ul className="space-y-2.5">
                {STRENGTHS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/40 transition"
                    >
                      <div className="h-9 w-9 grid place-items-center rounded-lg bg-success/10 text-success border border-success/20 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{s.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{s.detail}</div>
                      </div>
                      <div className="font-mono text-sm font-bold text-success shrink-0">{s.value}</div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card>
              <SectionTitle icon={AlertTriangle} hint={`${WEAKNESSES.length} a corregir`}>
                Áreas de mejora
              </SectionTitle>
              <ul className="space-y-2.5">
                {WEAKNESSES.map((w) => {
                  const Icon = w.icon;
                  const tone =
                    w.severity === "high"
                      ? "bg-destructive/10 text-destructive border-destructive/25"
                      : "bg-warning/10 text-warning border-warning/25";
                  return (
                    <li
                      key={w.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3 hover:border-warning/40 transition"
                    >
                      <div className={`h-9 w-9 grid place-items-center rounded-lg border shrink-0 ${tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{w.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{w.detail}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tone}`}
                      >
                        {w.severity === "high" ? "Alta" : "Media"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Milestones timeline */}
          <Card>
            <SectionTitle icon={Zap}>Hitos recientes</SectionTitle>
            <ol className="relative border-l border-border ml-2 space-y-4 pt-1">
              {MILESTONES.map((m, i) => {
                const Icon = m.icon;
                return (
                  <li key={i} className="ml-6">
                    <span className="absolute -left-[11px] h-5 w-5 grid place-items-center rounded-full bg-surface border border-primary/40 text-primary">
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{m.date}</div>
                    <div className="text-sm font-medium">{m.event}</div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </>
      )}

      {/* Biases */}
      {tab === "biases" && (
        <Card>
          <SectionTitle icon={Brain} hint="Detectados por análisis de patrones">
            Sesgos cognitivos
          </SectionTitle>
          <div className="space-y-4">
            {BIASES.map((b) => {
              const trendDown = b.trend < 0;
              return (
                <div key={b.name} className="rounded-xl border border-border bg-surface-2/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground">{b.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold">{b.value}</div>
                      <div
                        className={`text-[10px] font-mono flex items-center gap-1 justify-end ${
                          trendDown ? "text-success" : "text-destructive"
                        }`}
                      >
                        {trendDown ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {trendDown ? "" : "+"}
                        {b.trend} pts vs mes anterior
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${b.value}%`,
                        background: `linear-gradient(90deg, var(--primary), color-mix(in oklab, var(--warning) 70%, var(--primary)))`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {tab === "recos" && (
        <Card>
          <SectionTitle icon={Lightbulb} hint="Acciones priorizadas por impacto">
            Recomendaciones del coach IA
          </SectionTitle>
          <ul className="space-y-3">
            {RECOMMENDATIONS.map((r, i) => (
              <li
                key={i}
                className="group flex items-center gap-4 rounded-xl border border-border bg-surface-2/60 p-4 hover:border-primary/40 hover:bg-surface-2 transition cursor-pointer"
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 ${
                    r.priority === "Alta"
                      ? "bg-destructive/10 text-destructive border-destructive/25"
                      : "bg-warning/10 text-warning border-warning/25"
                  }`}
                >
                  {r.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Impacto: <span className="text-success font-mono">{r.impact}</span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition">
                  {r.action}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
