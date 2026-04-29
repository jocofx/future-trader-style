import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Brain, Heart, Zap, Smile, Meh, Frown, AlertTriangle, Sparkles,
  TrendingDown, TrendingUp, Wind, Activity, Shield, Coffee,
} from "lucide-react";

export const Route = createFileRoute("/app/psicologia")({
  head: () => ({
    meta: [
      { title: "Psicología · Tradync" },
      { name: "description", content: "Estado emocional, control de tilt y bienestar mental del trader." },
    ],
  }),
  component: PsicologiaPage,
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 ${className}`}>{children}</div>;
}

type Mood = "great" | "good" | "neutral" | "bad" | "tilt";
const MOODS: { k: Mood; label: string; Icon: any; cls: string }[] = [
  { k: "great",   label: "Enfocado",   Icon: Sparkles, cls: "text-primary bg-primary/15 border-primary/40" },
  { k: "good",    label: "Tranquilo",  Icon: Smile,    cls: "text-success bg-success/15 border-success/40" },
  { k: "neutral", label: "Neutral",    Icon: Meh,      cls: "text-muted-foreground bg-surface-3 border-border" },
  { k: "bad",     label: "Cansado",    Icon: Frown,    cls: "text-warning bg-warning/15 border-warning/40" },
  { k: "tilt",    label: "Tilt",       Icon: AlertTriangle, cls: "text-destructive bg-destructive/15 border-destructive/40" },
];

const MOOD_HISTORY = [
  { day: "Lun", mood: 75 }, { day: "Mar", mood: 82 }, { day: "Mié", mood: 60 },
  { day: "Jue", mood: 45 }, { day: "Vie", mood: 70 }, { day: "Sáb", mood: 88 }, { day: "Dom", mood: 84 },
];

const EMOTIONS = [
  { name: "Confianza",   value: 78, color: "var(--primary)" },
  { name: "Paciencia",   value: 65, color: "var(--success)" },
  { name: "Foco",        value: 82, color: "var(--info)" },
  { name: "Estrés",      value: 38, color: "var(--warning)", inverse: true },
  { name: "Frustración", value: 24, color: "var(--destructive)", inverse: true },
];

const TILT_TRIGGERS = [
  { trigger: "Tras 2 pérdidas seguidas",    impact: "Alto",  count: 12, Icon: TrendingDown },
  { trigger: "Viernes después de las 16h",  impact: "Alto",  count: 8,  Icon: AlertTriangle },
  { trigger: "Días con noticias macro",     impact: "Medio", count: 14, Icon: Activity },
  { trigger: "Tras gap nocturno inesperado", impact: "Bajo",  count: 6,  Icon: Wind },
];

const BREATH_EXERCISES = [
  { name: "Box Breathing", desc: "4-4-4-4", duration: "4 min", Icon: Wind, tone: "text-info" },
  { name: "Coherencia cardíaca", desc: "5-5", duration: "5 min", Icon: Heart, tone: "text-destructive" },
  { name: "Wim Hof",  desc: "30 ciclos", duration: "11 min", Icon: Zap, tone: "text-warning" },
];

function PsicologiaPage() {
  const [mood, setMood] = useState<Mood>("good");
  const [energy, setEnergy] = useState(75);
  const [stress, setStress] = useState(35);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wellnessScore = useMemo(() => {
    const moodScore = mood === "great" ? 95 : mood === "good" ? 80 : mood === "neutral" ? 60 : mood === "bad" ? 35 : 15;
    return Math.round((moodScore * 0.5 + energy * 0.3 + (100 - stress) * 0.2));
  }, [mood, energy, stress]);

  const wellnessLabel =
    wellnessScore >= 80 ? "Óptimo para operar" :
    wellnessScore >= 60 ? "Listo con precaución" :
    wellnessScore >= 40 ? "Operar con cautela" : "Mejor no operar hoy";

  const wellnessTone =
    wellnessScore >= 80 ? "text-success" :
    wellnessScore >= 60 ? "text-primary" :
    wellnessScore >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
          <Brain className="h-3.5 w-3.5 text-primary" />
          Psicología
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tu estado mental hoy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          La psicología es el 80% del trading. Cuídala como cuidas tu capital.
        </p>
      </div>

      {/* Wellness Score Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ background: "radial-gradient(600px 200px at 10% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)" }} />
        <div className="relative grid lg:grid-cols-[auto_1fr] gap-6 items-center">
          {/* Donut */}
          <div className="relative h-[180px] w-[180px] mx-auto">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="color-mix(in oklab, var(--foreground) 8%, transparent)" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 - (wellnessScore / 100) * 2 * Math.PI * 42}
                style={{ filter: "drop-shadow(0 0 12px color-mix(in oklab, var(--primary) 60%, transparent))", transition: "stroke-dashoffset 400ms ease" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Wellness</div>
                <div className="text-4xl font-bold font-mono">{mounted ? wellnessScore : "—"}</div>
                <div className={`text-[11px] font-semibold mt-0.5 ${wellnessTone}`}>{wellnessLabel}</div>
              </div>
            </div>
          </div>

          {/* Mood + sliders */}
          <div className="space-y-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2">¿Cómo te sientes hoy?</div>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMood(m.k)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                      mood === m.k ? m.cls : "bg-surface-2/60 text-muted-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    <m.Icon className="h-3.5 w-3.5" /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5"><Zap className="h-3 w-3" /> Energía</span>
                  <span className="font-mono font-bold">{energy}%</span>
                </div>
                <input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(+e.target.value)}
                  className="w-full accent-[oklch(0.78_0.18_158)]" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> Estrés</span>
                  <span className="font-mono font-bold">{stress}%</span>
                </div>
                <input type="range" min="0" max="100" value={stress} onChange={(e) => setStress(+e.target.value)}
                  className="w-full accent-[oklch(0.65_0.21_25)]" />
              </div>
            </div>

            {wellnessScore < 50 && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive p-3 text-xs">
                <AlertTriangle className="h-4 w-4" />
                Tu estado actual no es óptimo. Considera reducir tamaño o no operar hoy.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
        {/* Mood history */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Estado emocional · Última semana</h2>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">Promedio 72</div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {MOOD_HISTORY.map((d) => {
              const tone = d.mood >= 75 ? "var(--success)" : d.mood >= 55 ? "var(--primary)" : d.mood >= 40 ? "var(--warning)" : "var(--destructive)";
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${d.mood}%`,
                        background: `linear-gradient(180deg, ${tone}, color-mix(in oklab, ${tone} 30%, transparent))`,
                        boxShadow: `0 0 12px color-mix(in oklab, ${tone} 40%, transparent)`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{d.day}</div>
                  <div className="text-[10px] font-mono text-foreground/70">{d.mood}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Emotions breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Perfil emocional</h2>
          </div>
          <div className="space-y-3">
            {EMOTIONS.map((e) => (
              <div key={e.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono text-muted-foreground">{e.value}/100</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${e.value}%`,
                      background: e.color,
                      boxShadow: `0 0 8px color-mix(in oklab, ${e.color} 50%, transparent)`,
                    }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        {/* Tilt triggers */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold tracking-tight">Disparadores de tilt</h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Últimos 90 días</span>
          </div>
          <ul className="space-y-2">
            {TILT_TRIGGERS.map((t) => {
              const cls =
                t.impact === "Alto" ? "text-destructive bg-destructive/10 border-destructive/25" :
                t.impact === "Medio" ? "text-warning bg-warning/10 border-warning/25" :
                                       "text-info bg-info/10 border-info/25";
              return (
                <li key={t.trigger} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3">
                  <div className={`h-9 w-9 grid place-items-center rounded-lg border shrink-0 ${cls}`}>
                    <t.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{t.trigger}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">Detectado {t.count} veces</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${cls} shrink-0`}>
                    Impacto {t.impact}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Breath exercises */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Wind className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Reset mental rápido</h2>
          </div>
          <ul className="space-y-2">
            {BREATH_EXERCISES.map((b) => (
              <li key={b.name}>
                <button className="w-full group flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/40 transition text-left">
                  <div className={`h-10 w-10 grid place-items-center rounded-xl bg-surface border border-border ${b.tone}`}>
                    <b.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{b.desc} · {b.duration}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary transition">Iniciar →</div>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <Coffee className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Si tu wellness está por debajo de 50, da un paso atrás. Sal a caminar, hidrátate y vuelve mañana. El mercado seguirá ahí.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
