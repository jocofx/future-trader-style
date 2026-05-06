import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";
import { computeStats } from "@/lib/types";
import {
  Trophy, Sparkles, ShieldCheck, Flame, Target, Brain,
  BookOpen, Calendar, TrendingUp, Star, Zap, Lock
} from "lucide-react";

export const Route = createFileRoute("/app/logros")({ component: LogrosPage });

type Tier = "bronze" | "silver" | "gold" | "platinum";
type Category = "learning" | "discipline" | "performance" | "consistency";

const TIER_META: Record<Tier, { label: string; color: string; bg: string }> = {
  bronze:   { label: "Bronce",   color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20" },
  silver:   { label: "Plata",    color: "text-slate-400",   bg: "bg-slate-400/10 border-slate-400/20" },
  gold:     { label: "Oro",      color: "text-warning",     bg: "bg-warning/10 border-warning/20" },
  platinum: { label: "Platino",  color: "text-primary",     bg: "bg-primary/10 border-primary/20" },
};

const CATEGORY_META: Record<Category, { label: string; Icon: React.ElementType }> = {
  learning:    { label: "Aprendizaje",  Icon: BookOpen },
  discipline:  { label: "Disciplina",   Icon: ShieldCheck },
  performance: { label: "Rendimiento",  Icon: TrendingUp },
  consistency: { label: "Constancia",   Icon: Calendar },
};

interface Achievement {
  id:        string;
  title:     string;
  desc:      string;
  category:  Category;
  tier:      Tier;
  xp:        number;
  Icon:      React.ElementType;
  check:     (data: AchievementData) => { unlocked: boolean; progress?: number };
}

interface AchievementData {
  trades:      any[];
  closedTrades: any[];
  stats:       any;
  diaryDays:   number;
  habitDays:   number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "1", title: "Primera operación", desc: "Registra tu primer trade en el journal",
    category: "learning", tier: "bronze", xp: 50, Icon: Sparkles,
    check: ({ closedTrades }) => ({ unlocked: closedTrades.length >= 1 }),
  },
  {
    id: "2", title: "10 operaciones", desc: "Registra 10 trades en el journal",
    category: "learning", tier: "bronze", xp: 100, Icon: Star,
    check: ({ closedTrades }) => ({
      unlocked: closedTrades.length >= 10,
      progress: Math.min(100, (closedTrades.length / 10) * 100),
    }),
  },
  {
    id: "3", title: "50 operaciones", desc: "Registra 50 trades en el journal",
    category: "learning", tier: "silver", xp: 200, Icon: Zap,
    check: ({ closedTrades }) => ({
      unlocked: closedTrades.length >= 50,
      progress: Math.min(100, (closedTrades.length / 50) * 100),
    }),
  },
  {
    id: "4", title: "Sniper", desc: "Alcanza un win rate ≥ 60% con al menos 20 trades",
    category: "performance", tier: "silver", xp: 300, Icon: Target,
    check: ({ closedTrades, stats }) => ({
      unlocked: closedTrades.length >= 20 && stats.winRate >= 0.6,
      progress: closedTrades.length < 20
        ? (closedTrades.length / 20) * 100
        : Math.min(100, stats.winRate * 100 / 60 * 100),
    }),
  },
  {
    id: "5", title: "Profit Factor 2.0", desc: "Mantén un profit factor ≥ 2.0 en al menos 20 trades",
    category: "performance", tier: "gold", xp: 400, Icon: TrendingUp,
    check: ({ closedTrades, stats }) => ({
      unlocked: closedTrades.length >= 20 && stats.profitFactor >= 2,
      progress: closedTrades.length < 20
        ? (closedTrades.length / 20) * 100
        : Math.min(100, (stats.profitFactor / 2) * 100),
    }),
  },
  {
    id: "6", title: "Racha verde", desc: "Consigue 5 operaciones ganadoras consecutivas",
    category: "performance", tier: "silver", xp: 200, Icon: Flame,
    check: ({ closedTrades }) => {
      let maxStreak = 0, current = 0;
      for (const t of closedTrades) {
        if ((t.resultado ?? 0) > 0) { current++; maxStreak = Math.max(maxStreak, current); }
        else current = 0;
      }
      return { unlocked: maxStreak >= 5, progress: Math.min(100, (maxStreak / 5) * 100) };
    },
  },
  {
    id: "7", title: "Diario completo", desc: "Escribe 30 entradas en el diario",
    category: "consistency", tier: "silver", xp: 200, Icon: BookOpen,
    check: ({ diaryDays }) => ({
      unlocked: diaryDays >= 30,
      progress: Math.min(100, (diaryDays / 30) * 100),
    }),
  },
  {
    id: "8", title: "Hábitos constante", desc: "Registra tus hábitos 20 días",
    category: "consistency", tier: "silver", xp: 200, Icon: Calendar,
    check: ({ habitDays }) => ({
      unlocked: habitDays >= 20,
      progress: Math.min(100, (habitDays / 20) * 100),
    }),
  },
  {
    id: "9", title: "Disciplinado", desc: "Mantén un profit factor ≥ 1.5 en 50 trades",
    category: "discipline", tier: "gold", xp: 350, Icon: ShieldCheck,
    check: ({ closedTrades, stats }) => ({
      unlocked: closedTrades.length >= 50 && stats.profitFactor >= 1.5,
      progress: closedTrades.length < 50
        ? (closedTrades.length / 50) * 100
        : Math.min(100, (stats.profitFactor / 1.5) * 100),
    }),
  },
  {
    id: "10", title: "Mes perfecto", desc: "100 operaciones registradas",
    category: "consistency", tier: "platinum", xp: 800, Icon: Trophy,
    check: ({ closedTrades }) => ({
      unlocked: closedTrades.length >= 100,
      progress: Math.min(100, (closedTrades.length / 100) * 100),
    }),
  },
  {
    id: "11", title: "Profit Factor 3.0", desc: "Alcanza profit factor ≥ 3.0 en 30 trades",
    category: "performance", tier: "platinum", xp: 1000, Icon: Brain,
    check: ({ closedTrades, stats }) => ({
      unlocked: closedTrades.length >= 30 && stats.profitFactor >= 3,
      progress: closedTrades.length < 30
        ? (closedTrades.length / 30) * 100
        : Math.min(100, (stats.profitFactor / 3) * 100),
    }),
  },
];

function AchievementCard({ achievement: a, data }: { achievement: Achievement; data: AchievementData }) {
  const tier     = TIER_META[a.tier];
  const cat      = CATEGORY_META[a.category];
  const CatIcon  = cat.Icon;
  const Icon     = a.Icon;
  const result   = a.check(data);
  const unlocked = result.unlocked;
  const progress = result.progress ?? (unlocked ? 100 : 0);

  return (
    <div className={`rounded-2xl border p-5 transition ${unlocked ? `${tier.bg} border` : "border-border bg-surface/40 opacity-60"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-11 w-11 rounded-xl grid place-items-center border ${unlocked ? tier.bg : "bg-surface border-border"}`}>
          {unlocked ? <Icon className={`h-5 w-5 ${tier.color}`} /> : <Lock className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="text-right">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${tier.color}`}>{tier.label}</div>
          <div className="text-[10px] text-muted-foreground">+{a.xp} XP</div>
        </div>
      </div>
      <div className="font-bold text-sm mb-0.5">{a.title}</div>
      <div className="text-[11px] text-muted-foreground mb-3">{a.desc}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${unlocked ? "bg-success" : "bg-primary/50"}`}
            style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <CatIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{cat.label}</span>
        {unlocked && <span className="ml-auto text-[10px] text-success font-semibold">✓ Desbloqueado</span>}
      </div>
    </div>
  );
}

function LogrosPage() {
  const { trades: { trades }, diario: { entries }, habits: { habits } } = useApp();

  const closedTrades = useMemo(() => trades.filter(t => t.resultado != null), [trades]);
  const stats        = useMemo(() => computeStats(closedTrades), [closedTrades]);
  const diaryDays    = entries.length;
  const habitDays    = habits.length;

  const data: AchievementData = { trades, closedTrades, stats, diaryDays, habitDays };

  const evaluated = useMemo(() =>
    ACHIEVEMENTS.map(a => ({ ...a, result: a.check(data) })),
    [data]
  );

  const unlocked = evaluated.filter(a => a.result.unlocked);
  const locked   = evaluated.filter(a => !a.result.unlocked);
  const totalXP  = unlocked.reduce((s, a) => s + a.xp, 0);

  return (
    <PlanGate feature="logros" plan="basic">
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Trophy className="h-3.5 w-3.5 text-primary" /> Progreso
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Logros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unlocked.length} de {ACHIEVEMENTS.length} desbloqueados · {totalXP} XP total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-primary">{totalXP}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">XP Total</div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-semibold">Progreso general</span>
          <span className="font-mono text-primary">{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-primary transition-all"
            style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>Novato</span><span>Experto</span><span>Leyenda</span>
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-success mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
            Desbloqueados ({unlocked.length})
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map(a => <AchievementCard key={a.id} achievement={a} data={data} />)}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Lock className="h-3 w-3" /> Por desbloquear ({locked.length})
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map(a => <AchievementCard key={a.id} achievement={a} data={data} />)}
          </div>
        </div>
      )}
    </div>
    </PlanGate>
  );
}
