import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Trophy, Star, Lock, Flame, Target, Zap, Crown, Medal, Sparkles,
  TrendingUp, Award, Brain, Calendar, ShieldCheck, BookOpen, Bot,
} from "lucide-react";

export const Route = createFileRoute("/app/logros")({
  head: () => ({
    meta: [
      { title: "Logros · Tradync" },
      { name: "description", content: "Desbloquea logros, sube de nivel y compite por mantener disciplina." },
    ],
  }),
  component: LogrosPage,
});

type Tier = "bronze" | "silver" | "gold" | "platinum" | "legendary";
type Category = "discipline" | "performance" | "consistency" | "learning" | "social";

type Achievement = {
  id: string;
  title: string;
  desc: string;
  category: Category;
  tier: Tier;
  xp: number;
  unlocked: boolean;
  date?: string;
  progress?: number; // 0-100 for in-progress
  Icon: any;
};

const TIER_META: Record<Tier, { label: string; color: string; glow: string }> = {
  bronze:    { label: "Bronce",    color: "oklch(0.65 0.14 50)",  glow: "color-mix(in oklab, oklch(0.65 0.14 50) 35%, transparent)" },
  silver:    { label: "Plata",     color: "oklch(0.78 0.02 250)", glow: "color-mix(in oklab, oklch(0.78 0.02 250) 35%, transparent)" },
  gold:      { label: "Oro",       color: "oklch(0.82 0.16 80)",  glow: "color-mix(in oklab, oklch(0.82 0.16 80) 40%, transparent)" },
  platinum:  { label: "Platino",   color: "oklch(0.78 0.10 200)", glow: "color-mix(in oklab, oklch(0.78 0.10 200) 40%, transparent)" },
  legendary: { label: "Legendario",color: "oklch(0.74 0.22 305)", glow: "color-mix(in oklab, oklch(0.74 0.22 305) 50%, transparent)" },
};

const CATEGORY_META: Record<Category, { label: string; Icon: any }> = {
  discipline:  { label: "Disciplina",   Icon: ShieldCheck },
  performance: { label: "Rendimiento",  Icon: TrendingUp },
  consistency: { label: "Consistencia", Icon: Calendar },
  learning:    { label: "Aprendizaje",  Icon: BookOpen },
  social:      { label: "Social",       Icon: Bot },
};

const ACHIEVEMENTS: Achievement[] = [
  { id: "1",  title: "Primera operación",        desc: "Registra tu primer trade en el journal",                category: "learning",    tier: "bronze",   xp: 50,   unlocked: true,  date: "12 Mar", Icon: Sparkles },
  { id: "2",  title: "Disciplinado",             desc: "Cumple tus reglas 7 días seguidos",                     category: "discipline",  tier: "silver",   xp: 150,  unlocked: true,  date: "20 Mar", Icon: ShieldCheck },
  { id: "3",  title: "Racha verde",              desc: "5 días consecutivos en positivo",                       category: "performance", tier: "silver",   xp: 200,  unlocked: true,  date: "28 Mar", Icon: Flame },
  { id: "4",  title: "Sniper",                   desc: "Win rate ≥ 70% en 20 trades",                           category: "performance", tier: "gold",     xp: 400,  unlocked: true,  date: "15 Abr", Icon: Target },
  { id: "5",  title: "Sin tilt",                 desc: "0 operaciones revenge en un mes",                       category: "discipline",  tier: "gold",     xp: 350,  unlocked: false, progress: 78,   Icon: Brain },
  { id: "6",  title: "Diario completo",          desc: "Registra 30 entradas de journal",                       category: "learning",    tier: "silver",   xp: 200,  unlocked: false, progress: 60,   Icon: BookOpen },
  { id: "7",  title: "Mes perfecto",             desc: "100% de hábitos completados durante 30 días",           category: "consistency", tier: "platinum", xp: 800,  unlocked: false, progress: 42,   Icon: Calendar },
  { id: "8",  title: "Profit Factor 3.0",        desc: "Mantén PF ≥ 3.0 durante 50 trades",                     category: "performance", tier: "platinum", xp: 1000, unlocked: false, progress: 28,   Icon: TrendingUp },
  { id: "9",  title: "Maestro Zen",              desc: "Wellness score ≥ 80 durante 60 días",                   category: "discipline",  tier: "legendary",xp: 2500, unlocked: false, progress: 12,   Icon: Crown },
  { id: "10", title: "Coach IA",                 desc: "Completa 10 sesiones con el Coach IA",                  category: "learning",    tier: "bronze",   xp: 100,  unlocked: false, progress: 30,   Icon: Bot },
  { id: "11", title: "Embajador",                desc: "Refiere 3 traders activos",                             category: "social",      tier: "gold",     xp: 500,  unlocked: false, progress: 0,    Icon: Star },
  { id: "12", title: "Iron Hand",                desc: "0 reglas rotas en 90 días",                             category: "discipline",  tier: "legendary",xp: 3000, unlocked: false, progress: 8,    Icon: Award },
];

function LogrosPage() {
  const [filter, setFilter] = useState<"all" | "unlocked" | "in-progress" | Category>("all");

  const filtered = ACHIEVEMENTS.filter((a) => {
    if (filter === "all") return true;
    if (filter === "unlocked") return a.unlocked;
    if (filter === "in-progress") return !a.unlocked && (a.progress ?? 0) > 0;
    return a.category === filter;
  });

  const stats = useMemo(() => {
    const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
    const xp = unlocked.reduce((s, a) => s + a.xp, 0);
    const level = Math.floor(xp / 500) + 1;
    const xpInLevel = xp % 500;
    const nextLevelAt = 500;
    return {
      total: ACHIEVEMENTS.length,
      unlocked: unlocked.length,
      xp,
      level,
      xpInLevel,
      nextLevelAt,
      pct: (unlocked.length / ACHIEVEMENTS.length) * 100,
    };
  }, []);

  const recentUnlock = ACHIEVEMENTS.filter((a) => a.unlocked).slice(-1)[0];
  const closeToUnlock = ACHIEVEMENTS.filter((a) => !a.unlocked && (a.progress ?? 0) >= 50).sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            Sistema de Logros
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tus medallas y XP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada hábito sano y cada regla cumplida te acerca a la siguiente medalla.
          </p>
        </div>
      </div>

      {/* Hero — Level + XP */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface/60 to-surface/40 backdrop-blur-xl p-6 relative overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)" }}
        />
        <div className="relative grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
          {/* Level badge */}
          <div className="relative h-32 w-32 mx-auto lg:mx-0">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="2" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeDasharray={`${(stats.xpInLevel / stats.nextLevelAt) * 97.4} 97.4`}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 50%, transparent))" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Nivel</div>
                <div className="text-4xl font-bold font-mono leading-none mt-0.5">{stats.level}</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <Crown className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold uppercase tracking-wider text-warning">Trader Disciplinado</span>
            </div>
            <h2 className="text-2xl font-bold mt-1">{stats.xp.toLocaleString()} XP</h2>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono text-foreground">{stats.nextLevelAt - stats.xpInLevel} XP</span> para el siguiente nivel
            </p>
            <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden max-w-md mx-auto lg:mx-0">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-glow"
                style={{ width: `${(stats.xpInLevel / stats.nextLevelAt) * 100}%`, boxShadow: "0 0 10px color-mix(in oklab, var(--primary) 60%, transparent)" }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-xl bg-surface/60 border border-border min-w-[100px]">
              <div className="text-2xl font-bold font-mono">{stats.unlocked}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Desbloqueados</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-surface/60 border border-border min-w-[100px]">
              <div className="text-2xl font-bold font-mono text-primary">{Math.round(stats.pct)}%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Spotlights */}
      {(recentUnlock || closeToUnlock) && (
        <div className="grid md:grid-cols-2 gap-4">
          {recentUnlock && <SpotlightCard achievement={recentUnlock} variant="recent" />}
          {closeToUnlock && <SpotlightCard achievement={closeToUnlock} variant="next" />}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1 w-fit">
        {([
          ["all", "Todos"],
          ["unlocked", "Desbloqueados"],
          ["in-progress", "En progreso"],
          ["discipline", "Disciplina"],
          ["performance", "Rendimiento"],
          ["consistency", "Consistencia"],
          ["learning", "Aprendizaje"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === k
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const tier = TIER_META[a.tier];
  const cat = CATEGORY_META[a.category];
  const CatIcon = cat.Icon;
  const Icon = a.Icon;

  return (
    <div
      className={`group relative rounded-2xl border p-5 backdrop-blur-xl transition overflow-hidden ${
        a.unlocked
          ? "border-border bg-surface/70 hover:border-primary/40"
          : "border-border bg-surface/30 hover:border-border"
      }`}
    >
      {a.unlocked && (
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-60 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tier.glow}, transparent 70%)` }}
        />
      )}
      <div className="relative">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="h-12 w-12 grid place-items-center rounded-xl border-2 shrink-0 relative"
            style={
              a.unlocked
                ? {
                    background: `color-mix(in oklab, ${tier.color} 18%, transparent)`,
                    borderColor: tier.color,
                    color: tier.color,
                    boxShadow: `0 0 16px ${tier.glow}`,
                  }
                : { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {a.unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className={`text-sm font-semibold truncate ${!a.unlocked && "text-muted-foreground"}`}>{a.title}</div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                style={{
                  color: a.unlocked ? tier.color : "var(--muted-foreground)",
                  borderColor: a.unlocked ? `color-mix(in oklab, ${tier.color} 40%, transparent)` : "var(--border)",
                  background: a.unlocked ? `color-mix(in oklab, ${tier.color} 10%, transparent)` : "transparent",
                }}
              >
                {tier.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <CatIcon className="h-3 w-3" /> {cat.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{a.desc}</p>

        {!a.unlocked && a.progress !== undefined && a.progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              <span>Progreso</span>
              <span className="font-mono">{a.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                style={{ width: `${a.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-primary">
            <Zap className="h-3 w-3" /> +{a.xp} XP
          </div>
          {a.unlocked ? (
            <div className="text-[10px] text-success font-mono flex items-center gap-1">
              <Medal className="h-3 w-3" /> {a.date}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground font-mono">Bloqueado</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpotlightCard({ achievement: a, variant }: { achievement: Achievement; variant: "recent" | "next" }) {
  const tier = TIER_META[a.tier];
  const Icon = a.Icon;
  const isRecent = variant === "recent";
  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-xl relative overflow-hidden"
      style={{
        borderColor: isRecent ? `color-mix(in oklab, ${tier.color} 40%, transparent)` : "var(--border)",
        background: "color-mix(in oklab, var(--surface) 60%, transparent)",
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-50 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${tier.glow}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="h-16 w-16 grid place-items-center rounded-2xl border-2 shrink-0"
          style={{
            background: `color-mix(in oklab, ${tier.color} 18%, transparent)`,
            borderColor: tier.color,
            color: tier.color,
            boxShadow: `0 0 24px ${tier.glow}`,
          }}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1 flex items-center gap-1.5">
            {isRecent ? <><Sparkles className="h-3 w-3 text-warning" /> Último desbloqueado</> : <><Flame className="h-3 w-3 text-info" /> Casi lo tienes</>}
          </div>
          <div className="text-base font-bold truncate">{a.title}</div>
          <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
          {!isRecent && a.progress !== undefined && (
            <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${a.progress}%` }} />
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</div>
          <div className="text-xl font-bold font-mono text-primary">+{a.xp}</div>
        </div>
      </div>
    </div>
  );
}
