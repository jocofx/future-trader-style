import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Flame, Plus, Trophy, TrendingUp, Brain, Dumbbell,
  BookOpen, Moon, Coffee, Target, Sparkles, Calendar as CalIcon,
} from "lucide-react";

export const Route = createFileRoute("/app/habitos")({
  head: () => ({
    meta: [
      { title: "Hábitos · Tradync" },
      { name: "description", content: "Construye disciplina: hábitos diarios, rachas y consistencia del trader." },
    ],
  }),
  component: HabitosPage,
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 ${className}`}>{children}</div>;
}

type Habit = {
  id: string;
  name: string;
  icon: any;
  category: "Mental" | "Físico" | "Trading" | "Bienestar";
  streak: number;
  best: number;
  /** últimos 21 días, 1 = hecho, 0 = no */
  history: number[];
};

function gen(seed: number, density: number): number[] {
  let s = seed;
  return Array.from({ length: 21 }, () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280 < density ? 1 : 0;
  });
}

const INITIAL: Habit[] = [
  { id: "h1", name: "Meditar 10 min",        icon: Brain,    category: "Mental",    streak: 12, best: 28, history: gen(11, 0.85) },
  { id: "h2", name: "Journal post-sesión",   icon: BookOpen, category: "Trading",   streak: 6,  best: 18, history: gen(22, 0.78) },
  { id: "h3", name: "Ejercicio 30 min",      icon: Dumbbell, category: "Físico",    streak: 4,  best: 21, history: gen(33, 0.66) },
  { id: "h4", name: "Dormir 7h+",            icon: Moon,     category: "Bienestar", streak: 9,  best: 15, history: gen(44, 0.80) },
  { id: "h5", name: "Sin café tras 14h",     icon: Coffee,   category: "Bienestar", streak: 3,  best: 11, history: gen(55, 0.60) },
  { id: "h6", name: "Revisar plan semanal",  icon: Target,   category: "Trading",   streak: 2,  best: 7,  history: gen(66, 0.55) },
];

const CAT_COLORS: Record<Habit["category"], string> = {
  Mental:    "text-info bg-info/10 border-info/25",
  Trading:   "text-primary bg-primary/10 border-primary/25",
  Físico:    "text-warning bg-warning/10 border-warning/25",
  Bienestar: "text-success bg-success/10 border-success/25",
};

function HabitosPage() {
  const [habits, setHabits] = useState(INITIAL);
  const [todayDone, setTodayDone] = useState<Record<string, boolean>>({
    h1: true, h2: false, h4: true, h6: false,
  });

  const toggle = (id: string) => setTodayDone((m) => ({ ...m, [id]: !m[id] }));

  const totalDoneToday = Object.values(todayDone).filter(Boolean).length;
  const totalHabits = habits.length;
  const pctToday = Math.round((totalDoneToday / totalHabits) * 100);
  const longestStreak = Math.max(...habits.map((h) => h.streak));
  const totalChecks = habits.reduce((s, h) => s + h.history.reduce((a, b) => a + b, 0), 0);
  const consistency = Math.round((totalChecks / (habits.length * 21)) * 100);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Hábitos
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Disciplina diaria del trader</h1>
          <p className="text-sm text-muted-foreground mt-1">
            La consistencia es el verdadero edge. Construye hábitos que te hagan rentable a largo plazo.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
          <Plus className="h-3.5 w-3.5" /> Nuevo hábito
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Hoy", value: `${totalDoneToday}/${totalHabits}`, sub: `${pctToday}% completado`, Icon: CheckCircle2, tone: "text-primary" },
          { label: "Mejor racha", value: `${longestStreak} días`, sub: "Activa ahora", Icon: Flame, tone: "text-warning" },
          { label: "Consistencia 21d", value: `${consistency}%`, sub: `${totalChecks} checks`, Icon: TrendingUp, tone: "text-success" },
          { label: "XP semanal", value: "+340", sub: "Nivel 12 → 13", Icon: Trophy, tone: "text-info" },
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

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Habits list with 21-day grid */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Tus hábitos</h2>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">Últimos 21 días</div>
          </div>

          <ul className="space-y-2.5">
            {habits.map((h) => {
              const Icon = h.icon;
              const isDone = !!todayDone[h.id];
              return (
                <li key={h.id} className="rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/30 transition">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggle(h.id)}
                      className={`h-10 w-10 grid place-items-center rounded-xl border transition shrink-0 ${
                        isDone
                          ? "bg-primary/15 text-primary border-primary/40 shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                          : "bg-surface text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
                      }`}
                      aria-label={`Marcar ${h.name}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold truncate">{h.name}</div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${CAT_COLORS[h.category]}`}>
                          {h.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono mt-0.5">
                        <span className="flex items-center gap-1 text-warning">
                          <Flame className="h-3 w-3" /> {h.streak}d
                        </span>
                        <span>Mejor: {h.best}d</span>
                      </div>
                    </div>

                    {/* 21-day grid */}
                    <div className="hidden sm:flex gap-[3px] shrink-0">
                      {h.history.map((v, i) => (
                        <div
                          key={i}
                          className="h-5 w-2.5 rounded-[3px]"
                          style={{
                            background: v
                              ? "color-mix(in oklab, var(--primary) 75%, transparent)"
                              : "color-mix(in oklab, var(--foreground) 7%, transparent)",
                            boxShadow: v ? "0 0 4px color-mix(in oklab, var(--primary) 40%, transparent)" : undefined,
                          }}
                          title={`Día -${20 - i}`}
                        />
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* Today summary */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Resumen de hoy</h2>
            </div>
            <div className="relative h-[140px] grid place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 mx-auto w-[140px] h-[140px]">
                <circle cx="50" cy="50" r="42" fill="none" stroke="color-mix(in oklab, var(--foreground) 8%, transparent)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 - (pctToday / 100) * 2 * Math.PI * 42}
                  style={{ filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 60%, transparent))" }}
                />
              </svg>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono">{pctToday}%</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Completado</div>
              </div>
            </div>
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {pctToday === 100 ? "🔥 Día perfecto. Sigue así." :
               pctToday >= 70 ? "Vas muy bien, cierra el día fuerte." :
               pctToday >= 40 ? "Aún hay tiempo. No rompas la racha." :
               "Empieza con uno pequeño. La consistencia gana."}
            </div>
          </Card>

          {/* Achievements */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Logros recientes</h2>
            </div>
            <ul className="space-y-2">
              {[
                { name: "Racha de 30 días", desc: "Meditación diaria", Icon: Flame, tone: "text-warning bg-warning/10 border-warning/25" },
                { name: "Disciplina total",  desc: "7 días al 100%",   Icon: Trophy, tone: "text-primary bg-primary/10 border-primary/25" },
                { name: "Mind & Body",       desc: "Mental + Físico ON", Icon: Brain, tone: "text-info bg-info/10 border-info/25" },
              ].map((a) => (
                <li key={a.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-2.5">
                  <div className={`h-9 w-9 grid place-items-center rounded-lg border shrink-0 ${a.tone}`}>
                    <a.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Tip */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-60 pointer-events-none"
              style={{ background: "radial-gradient(400px 140px at 0% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)" }} />
            <div className="relative flex items-start gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary border border-primary/30 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Tip del coach</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Encadenar hábitos pequeños es más efectivo que uno grande. Empieza con 2 minutos de journal después de cada sesión.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
