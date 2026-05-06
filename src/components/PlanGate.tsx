import React, { useState } from "react";
import {
  Lock, Check, X, BarChart3, CalendarDays, BookText, Heart,
  Target, TrendingUp, Brain, Bot, Trophy, Cpu, Wallet, Sparkles
} from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { useApp } from "@/context/AppContext";
import { useCheckout } from "@/hooks/useCheckout";

// ── Feature descriptions ───────────────────────────────────────────
const FEATURE_INFO: Record<string, {
  icon: React.ElementType;
  title: string;
  description: string;
  bullets: string[];
  plan: "basic" | "pro";
}> = {
  stats: {
    icon: BarChart3,
    title: "Estadísticas avanzadas",
    description: "Analiza tu rendimiento con métricas profesionales y gráficas detalladas.",
    bullets: [
      "P&L por día, semana y mes",
      "Win rate, profit factor y expectancy",
      "Curva de equity y drawdown",
      "Rendimiento por instrumento y setup",
      "P&L por día de la semana",
    ],
    plan: "basic",
  },
  calendar: {
    icon: CalendarDays,
    title: "Calendario de trading",
    description: "Vista mensual de toda tu actividad con acceso rápido a cada día.",
    bullets: [
      "Resumen diario de operaciones",
      "Hábitos y checklist del día",
      "Entrada del diario por fecha",
      "P&L por día en el calendario",
      "Navegación por mes y año",
    ],
    plan: "basic",
  },
  diario: {
    icon: BookText,
    title: "Diario del trader",
    description: "Registra tus reflexiones, emociones y lecciones aprendidas cada día.",
    bullets: [
      "Reflexión diaria con texto libre",
      "Registro de emociones y energía",
      "Lección aprendida del día",
      "Búsqueda en el historial",
      "Estadísticas de bienestar mensual",
    ],
    plan: "basic",
  },
  habitos: {
    icon: Heart,
    title: "Seguimiento de hábitos",
    description: "Registra tus hábitos diarios y su impacto en tu rendimiento.",
    bullets: [
      "Hábitos personalizables",
      "Encuesta diaria de bienestar",
      "Puntuación de disciplina",
      "Historial mensual",
      "Correlación hábitos-resultados",
    ],
    plan: "basic",
  },
  premarket: {
    icon: Target,
    title: "Checklist pre-market",
    description: "Prepara cada sesión de trading con tu checklist personalizado.",
    bullets: [
      "Checklist personalizable",
      "Sesgo del mercado del día",
      "Niveles clave y noticias",
      "Historial de preparaciones",
      "Sincronizado con el calendario",
    ],
    plan: "basic",
  },
  capital: {
    icon: Wallet,
    title: "Capital Tracker",
    description: "Controla tus inversiones y ganancias entre diferentes cuentas y estrategias.",
    bullets: [
      "Registro de inversiones",
      "Vinculación con ganancias",
      "ROI y beneficio neto",
      "Múltiples fuentes de capital",
      "Historial completo",
    ],
    plan: "basic",
  },
  insights: {
    icon: TrendingUp,
    title: "Insights inteligentes",
    description: "Análisis automático de tus patrones y tendencias de trading.",
    bullets: [
      "Detección de patrones conductales",
      "Alertas de sobreoperación",
      "Mejores y peores condiciones",
      "Análisis de revenge trading",
      "Recomendaciones personalizadas",
    ],
    plan: "basic",
  },
  psicologia: {
    icon: Brain,
    title: "Psicología del trader",
    description: "Analiza cómo tus emociones y estado mental afectan a tus resultados.",
    bullets: [
      "Disciplina vs resultado",
      "Rendimiento por setup y emoción",
      "Emociones en el diario",
      "Score conductual",
      "Detección de patrones negativos",
    ],
    plan: "basic",
  },
  logros: {
    icon: Trophy,
    title: "Sistema de logros",
    description: "Desbloquea medallas y hitos por tu progreso y disciplina como trader.",
    bullets: [
      "Logros por disciplina y constancia",
      "Hitos de rendimiento",
      "Racha de días sin pérdidas",
      "Medallas por volumen de trading",
      "Seguimiento de progreso",
    ],
    plan: "basic",
  },
  gestor_ea: {
    icon: Cpu,
    title: "Gestor EA — Sincronización MT4/MT5",
    description: "Conecta MetaTrader y sincroniza tus operaciones automáticamente en tiempo real.",
    bullets: [
      "Sincronización automática cada 3 segundos",
      "Gestor de riesgo en tiempo real",
      "Límites de pérdida y operaciones",
      "Control remoto desde la app",
      "Score conductual del EA",
    ],
    plan: "pro",
  },
  coach_ia: {
    icon: Bot,
    title: "Coach IA personalizado",
    description: "Tu asistente de trading con IA entrenado con tus propios datos y operaciones.",
    bullets: [
      "150 mensajes incluidos al mes",
      "Analiza tus operaciones reales",
      "Detecta patrones en tu trading",
      "Consejos personalizados",
      "Respuestas basadas en tu historial",
    ],
    plan: "pro",
  },
};

// ── Plan Selector (embedded in PlanGate) ──────────────────────────
function PlanSelector({ onClose }: { onClose: () => void }) {
  const { startCheckout, loading } = useCheckout();
  const { plan: currentPlan } = useApp();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [selected, setSelected] = useState<"basic" | "pro">("pro");

  const PLANS = [
    {
      id: "basic" as const,
      name: "Basic",
      monthlyPrice: 9,
      yearlyPrice: 84,
      yearlyMonthly: 7,
      features: ["100 operaciones/mes", "Estadísticas completas", "Diario + Hábitos + Premarket", "Capital Tracker", "Logros e Insights", "Afiliados 20%→30%"],
    },
    {
      id: "pro" as const,
      name: "Pro",
      monthlyPrice: 29,
      yearlyPrice: 264,
      yearlyMonthly: 22,
      popular: true,
      features: ["Operaciones ilimitadas", "Todo lo de Basic", "Gestor EA + MT4/MT5", "Coach IA (150 msgs/mes)", "Afiliados 30%→50%", "Soporte prioritario"],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="font-bold text-base">Elige tu plan</div>
            <div className="text-xs text-muted-foreground mt-0.5">Cancela cuando quieras · Sin permanencia</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-1 bg-surface/60 border border-border rounded-xl p-1">
            <button onClick={() => setInterval("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${interval === "monthly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Mensual
            </button>
            <button onClick={() => setInterval("yearly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${interval === "yearly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Anual
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-bold border border-success/20">-25%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 gap-4 px-6 pb-4">
          {PLANS.map(p => {
            const isCurrent  = currentPlan === p.id;
            const isSelected = selected === p.id;
            return (
              <button key={p.id} onClick={() => !isCurrent && setSelected(p.id)} disabled={isCurrent}
                className={`relative text-left rounded-2xl border-2 p-4 transition ${
                  isSelected  ? "border-primary bg-primary/5 shadow-lg" :
                  isCurrent   ? "border-border bg-surface/30 opacity-60 cursor-not-allowed" :
                  "border-border bg-surface/40 hover:border-primary/40"
                }`}>
                {p.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider whitespace-nowrap">
                    Más popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-success text-white font-bold">
                    Plan actual
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base">{p.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold font-mono">
                    {interval === "yearly" ? p.yearlyMonthly : p.monthlyPrice}€
                  </span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                  {interval === "yearly" && (
                    <span className="text-[10px] text-muted-foreground ml-1">({p.yearlyPrice}€/año)</span>
                  )}
                </div>
                <div className="space-y-1">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Check className="h-3 w-3 text-success shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <button onClick={() => startCheckout(selected, interval)} disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? "Redirigiendo a Stripe…" : <><Sparkles className="h-4 w-4" /> Empezar con {selected === "pro" ? "Pro" : "Basic"} {interval === "yearly" ? "Anual" : "Mensual"} →</>}
          </button>
          <div className="text-center text-[11px] text-muted-foreground mt-2">
            Pago seguro con Stripe · Cancela cuando quieras
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PlanGate ───────────────────────────────────────────────────────
export function PlanGate({ feature, plan, children }: {
  feature: string;
  plan: "basic" | "pro";
  children: React.ReactNode;
}) {
  const { can } = usePlan();
  const { planLoading } = useApp();
  const [showPlans, setShowPlans] = useState(false);

  if (planLoading) return <>{children}</>;
  if (can(feature)) return <>{children}</>;

  const info = FEATURE_INFO[feature];
  const Icon = info?.icon ?? Lock;

  return (
    <div className="max-w-[700px] mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border mb-2
            bg-primary/8 border-primary/20 text-primary">
            <Lock className="h-3 w-3" />
            {plan === "pro" ? "Plan Pro" : "Plan Basic"}
          </div>
          <h1 className="text-2xl font-bold">{info?.title ?? "Función Premium"}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {info?.description ?? "Actualiza tu plan para acceder a esta sección."}
          </p>
        </div>
      </div>

      {/* Feature list */}
      {info?.bullets && (
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            ¿Qué incluye?
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {info.bullets.map(b => (
              <div key={b} className="flex items-center gap-2.5 text-sm">
                <div className="h-5 w-5 rounded-full bg-success/15 border border-success/25 grid place-items-center shrink-0">
                  <Check className="h-3 w-3 text-success" />
                </div>
                {b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-4 ${plan === "basic" ? "border-primary/30 bg-primary/5" : "border-border bg-surface/40"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Basic</span>
            <span className="text-lg font-bold font-mono text-primary">9€<span className="text-xs font-normal text-muted-foreground">/mes</span></span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {["Estadísticas y gráficas", "Diario, Hábitos, Premarket", "Capital Tracker", "Logros e Insights", "Afiliados 20%→30%"].map(f => (
              <div key={f} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success shrink-0" />{f}</div>
            ))}
          </div>
        </div>
        <div className={`rounded-2xl border p-4 relative ${plan === "pro" ? "border-primary/30 bg-primary/5" : "border-border bg-surface/40"}`}>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
            Más popular
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Pro</span>
            <span className="text-lg font-bold font-mono text-primary">29€<span className="text-xs font-normal text-muted-foreground">/mes</span></span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {["Todo lo de Basic", "Gestor EA + MT4/MT5", "Coach IA (150 msgs/mes)", "Operaciones ilimitadas", "Afiliados 30%→50%"].map(f => (
              <div key={f} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success shrink-0" />{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-2">
        <button onClick={() => setShowPlans(true)}
          className="h-12 px-8 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:brightness-110 transition shadow-glow inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Ver planes y precios →
        </button>
        <div className="text-xs text-muted-foreground">14 días de prueba gratis · Sin tarjeta</div>
      </div>

      {showPlans && <PlanSelector onClose={() => setShowPlans(false)} />}
    </div>
  );
}
