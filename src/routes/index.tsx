import { createFileRoute, Link } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import {
  Sparkles, Brain, ShieldCheck, BarChart3, Bot, Calendar, ChevronRight,
  Zap, Globe2, Lock, Star, Check, ArrowRight, TrendingUp, BookText,
  CheckCircle2, LineChart, X, ToggleLeft, ToggleRight,
} from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { HeroDashboardMock } from "@/components/HeroDashboardMock";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCheckout } from "@/hooks/useCheckout";

function RootPage() {
  // VITE_COMING_SOON=true → show coming soon page
  if (import.meta.env.VITE_COMING_SOON === "true") {
    return <ComingSoon />;
  }
  return <Landing />;
}

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Skip redirect if coming soon mode (ComingSoon handles its own auth)
    if (import.meta.env.VITE_COMING_SOON === "true") return;
    const { supabase } = await import("@/lib/supabase");
    const { redirect } = await import("@tanstack/react-router");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/app" });
  },
  component: RootPage,
});

// ── Pricing data ─────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    desc: "Para explorar TradyncApp y registrar tus primeras operaciones.",
    badge: null,
    featured: false,
    cta: "Empezar gratis",
    ctaLink: "/login",
    features: [
      { text: "Hasta 10 operaciones en total", included: true },
      { text: "Historial últimos 7 días", included: true },
      { text: "Dashboard con 3 KPIs básicos", included: true },
      { text: "1 cuenta de broker", included: true },
      { text: "Control de riesgo básico", included: true },
      { text: "Estadísticas avanzadas", included: false },
      { text: "Pre-Market + checklist", included: false },
      { text: "Diario, Hábitos, Psicología", included: false },
      { text: "Coach IA", included: false },
    ],
  },
  {
    name: "Basic",
    price: { monthly: 9, yearly: 7 },
    yearlyTotal: 84,
    desc: "Para el trader serio que quiere analizar y mejorar consistentemente.",
    badge: null,
    featured: false,
    cta: "Probar 14 días gratis",
    ctaLink: "/login",
    features: [
      { text: "Operaciones ilimitadas", included: true },
      { text: "Historial completo", included: true },
      { text: "Estadísticas avanzadas (WR, PF, expectancy)", included: true },
      { text: "Hasta 3 cuentas de broker", included: true },
      { text: "Pre-Market + checklist diario", included: true },
      { text: "Diario de trading", included: true },
      { text: "Hábitos y bienestar", included: true },
      { text: "Psicología + insights automáticos", included: true },
      { text: "Capital Tracker", included: true },
      { text: "Coach IA (API key propia)", included: true },
      { text: "Afiliados (20%→30% comisión)", included: true },
      { text: "Gestor EA + conexión broker", included: false },
    ],
  },
  {
    name: "Pro",
    price: { monthly: 29, yearly: 22 },
    yearlyTotal: 264,
    desc: "Para prop traders y profesionales que necesitan las herramientas más avanzadas.",
    badge: "Más popular",
    featured: true,
    cta: "Probar 14 días gratis",
    ctaLink: "/login",
    features: [
      { text: "Todo en Basic", included: true },
      { text: "Cuentas ilimitadas", included: true },
      { text: "Coach IA incluido (150 msgs/mes)", included: true },
      { text: "Gestor de Expert Advisors (EA)", included: true },
      { text: "Sincronización automática MT4/MT5 (Gestor EA)", included: true },
      { text: "Exportar CSV + PDF", included: true },
      { text: "Afiliados (30%→50% comisión)", included: true },
      { text: "Soporte prioritario", included: true },
    ],
  },
] as const;

// ── Social proof numbers ──────────────────────────────────────────
const STATS = [
  { value: "12.400+", label: "Operaciones registradas" },
  { value: "100%",    label: "Datos de trading reales" },
  { value: "2.3x",    label: "Mejora media profit factor" },
  { value: "€0",      label: "Para empezar hoy" },
];

// ── Feature sections ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: BarChart3,
    title: "Estadísticas que importan",
    desc: "Win rate, profit factor, expectancy, R-multiple, drawdown máximo, mejor sesión, peor día. Filtros por cuenta, período y símbolo.",
    highlight: false,
  },
  {
    icon: ShieldCheck,
    title: "Control de riesgo en tiempo real",
    desc: "Define tu máximo diario de pérdida, límite de operaciones y objetivo. La app te frena antes de que el día se rompa.",
    highlight: false,
  },
  {
    icon: Brain,
    title: "Psicología medible",
    desc: "Registra emociones, confianza y estado mental. Cruza tu psicología con tus resultados y descubre cuándo rindes mejor.",
    highlight: false,
  },
  {
    icon: Calendar,
    title: "Pre-Market + Calendario",
    desc: "Planifica cada sesión con sesgo, niveles clave y lista de reglas. El heatmap mensual te muestra tus mejores y peores días.",
    highlight: false,
  },
  {
    icon: TrendingUp,
    title: "Capital Tracker",
    desc: "Registra challenges, fondeadas y ganancias. Calcula tu ROI real, aprobaciones y cuánto has ganado neto sobre lo invertido.",
    highlight: false,
  },
  {
    icon: BookText,
    title: "Diario + Hábitos",
    desc: "Escribe tu diario post-sesión y registra sueño, ejercicio y meditación. El heatmap de hábitos revela cómo tu bienestar afecta tu trading.",
    highlight: false,
  },
];

// ── FAQs ─────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí. Sin permanencia. Si cancelas, mantienes el acceso hasta el final del período pagado. Tus datos no se borran.",
  },
  {
    q: "¿Qué pasa cuando se acaban los 14 días gratis?",
    a: "Pasas automáticamente al plan Free (10 operaciones, 7 días de historial). Tus datos guardados se conservan siempre.",
  },
  {
    q: "¿El Coach IA habla español?",
    a: "Sí, 100%. Analiza tu historial real de operaciones y te responde en español con insights personalizados a tu trading.",
  },
  {
    q: "¿Compatible con mi broker?",
    a: "TradyncApp sincroniza automáticamente con MetaTrader 4/5 mediante el Gestor EA. También puedes añadir operaciones manualmente desde cualquier broker.",
  },
  {
    q: "¿Es seguro guardar mis datos aquí?",
    a: "Todos los datos se cifran en tránsito (TLS) y en reposo. Cada usuario solo puede ver sus propios datos. Nunca vendemos información a terceros.",
  },
  {
    q: "¿Qué es el plan Basic vs Pro?",
    a: "Basic cubre todo lo que necesita un trader activo: estadísticas, diario, psicología, Capital Tracker y hasta 3 cuentas. Pro añade el Gestor EA y el Coach IA con 150 mensajes/mes incluidos.",
  },
];

// ── Component ─────────────────────────────────────────────────────
function Landing() {
  const [yearly, setYearly]         = useState(false);
  const { startCheckout, loading: checkoutLoading } = useCheckout();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <MarketingHeader />

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="absolute inset-0 bg-mesh" aria-hidden />
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 text-center">

          {/* Pill */}
          <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">100% en español</span>
            <span className="text-foreground font-medium">· Journal + Coach IA para traders</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Deja de perder dinero<br className="hidden sm:block" />
            <span className="text-gradient"> por errores que ya cometiste</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            TradyncApp es el journal de trading en español que analiza tus operaciones, mide tu psicología
            y te entrena con un Coach IA personal para que no repitas los mismos fallos.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="hero" size="xl" className="rounded-xl">
              <Link to="/login">
                Empezar gratis — sin tarjeta <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl" className="rounded-xl">
              <Link to="/login">Ver demo en vivo</Link>
            </Button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Sin tarjeta</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> 14 días Basic gratis</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Cancela cuando quieras</div>
          </div>

          {/* Hero screenshot */}
          <div className="mt-16 md:mt-20 max-w-5xl mx-auto">
            <HeroDashboardMock />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-border bg-surface/30 py-10">
        <div className="mx-auto max-w-5xl px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold tracking-tight text-gradient">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BROKERS MARQUEE ── */}
      <section className="relative border-b border-border bg-surface/20 py-6 overflow-hidden">
        <div className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Compatible con tus brokers favoritos
        </div>
        <div className="flex gap-12 anim-marquee whitespace-nowrap">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0 px-6">
              {["MetaTrader 4","MetaTrader 5","cTrader","Binance","Bybit","NinjaTrader","TradingView","Interactive Brokers","FTMO","Kraken"].map(b => (
                <span key={b} className="text-base font-semibold text-muted-foreground/50 tracking-tight hover:text-foreground transition">{b}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── COACH IA HIGHLIGHT ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Inteligencia Artificial
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                Un coach que conoce<br/>
                <span className="text-gradient">cada trade que has hecho</span>
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                El Coach IA de TradyncApp no es un chatbot genérico. Analiza tu historial real — tus emociones,
                tus peores rachas, tus mejores sesiones — y te da feedback accionable en español.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Detecta sesgos y errores repetitivos en tu trading",
                  "Identifica en qué sesión y símbolo rindes mejor",
                  "Te hace las preguntas incómodas que nadie más hace",
                  "Aprende de tu historial — cuanto más usas, más preciso",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="hero" size="lg" className="mt-8 rounded-xl">
                <Link to="/login">Probar Coach IA gratis <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Chat preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl glass-strong p-5 space-y-3 shadow-elegant">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <div className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold">Coach IA · TradyncApp</span>
                  <span className="ml-auto text-[10px] text-success flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online
                  </span>
                </div>
                {[
                  { role: "ai", text: "He analizado tus últimas 47 operaciones. Tu mejor sesión es de 9:30 a 11:00 UTC con un 78% WR. Fuera de ese horario caes al 41%." },
                  { role: "user", text: "¿Qué me recomiendas?" },
                  { role: "ai", text: "Opera SOLO en esa ventana de 90 min durante 2 semanas. Tu profit factor pasaría de 1.4 a ~2.1 sin cambiar ningún setup." },
                  { role: "user", text: "Tiene sentido. ¿Y mis pérdidas del miércoles?" },
                  { role: "ai", text: "Los miércoles operas con FOMO post-noticias. Es tu peor día: -€340 de media. Te recomiendo no operar los miércoles hasta las 14:00." },
                ].map((m, i) => (
                  <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    {m.role === "ai"
                      ? <div className="h-6 w-6 shrink-0 rounded-md bg-gradient-primary grid place-items-center"><Sparkles className="h-3 w-3 text-primary-foreground" /></div>
                      : <div className="h-6 w-6 shrink-0 rounded-md bg-surface-3 grid place-items-center text-[10px] font-bold">TÚ</div>
                    }
                    <div className={`text-xs rounded-xl px-3 py-2 max-w-[80%] leading-relaxed ${m.role === "ai" ? "glass" : "bg-primary/15 border border-primary/20"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Herramientas</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Todo lo que necesitas para<br/><span className="text-gradient">operar con disciplina</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              No más hojas de Excel. No más capturas perdidas en el móvil. Un sistema completo en español.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/40 transition">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/8 blur-2xl opacity-0 group-hover:opacity-100 transition" />
                <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative py-24">
        <div className="absolute inset-0 bg-mesh opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Precios</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Empieza gratis.<br/>Escala cuando quieras.
            </h2>
            <p className="mt-4 text-muted-foreground">Sin compromisos. Sin tarjeta para empezar. 14 días Basic gratis.</p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 glass rounded-full px-4 py-2">
              <span className={`text-sm font-medium transition ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
                Mensual
              </span>
              <button onClick={() => setYearly(v => !v)}
                className="relative w-11 h-6 rounded-full bg-primary/20 border border-primary/30 transition hover:border-primary/50">
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary shadow-glow transition-all ${yearly ? "left-5" : "left-0.5"}`} />
              </button>
              <span className={`text-sm font-medium transition ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
                Anual
              </span>
              {yearly && (
                <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                  2 MESES GRATIS
                </span>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan) => {
              const price = yearly ? plan.price.yearly : plan.price.monthly;
              return (
                <div key={plan.name}
                  className={`relative rounded-2xl border p-7 backdrop-blur transition
                    ${plan.featured
                      ? "border-primary/40 bg-card/80 shadow-glow scale-[1.02]"
                      : "border-border bg-card/50 hover:border-primary/20"
                    }`}>

                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground shadow-glow whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div className="text-sm font-bold tracking-wide text-foreground">{plan.name}</div>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-5xl font-black tracking-tight">
                      {price === 0 ? "€0" : `€${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">/mes</span>
                    )}
                  </div>

                  {/* Yearly total */}
                  {yearly && "yearlyTotal" in plan && plan.yearlyTotal && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      €{plan.yearlyTotal}/año — <span className="text-success font-semibold">ahorras 2 meses</span>
                    </div>
                  )}
                  {!yearly && price > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">facturado mensualmente</div>
                  )}

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{plan.desc}</p>

                  {/* 14-day trial badge */}
                  {plan.name !== "Free" && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> 14 días gratis · sin tarjeta
                    </div>
                  )}

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f.text} className="flex items-start gap-2.5 text-sm">
                        {f.included
                          ? <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.featured ? "text-primary" : "text-success"}`} />
                          : <X className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/40" />
                        }
                        <span className={f.included ? "text-foreground/85" : "text-muted-foreground/50 line-through text-xs"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.name === "Free" ? (
                    <Button asChild variant="glass" className="mt-7 w-full rounded-xl" size="lg">
                      <Link to="/login">{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      variant={plan.featured ? "hero" : "glass"}
                      className="mt-7 w-full rounded-xl"
                      size="lg"
                      disabled={checkoutLoading}
                      onClick={() => startCheckout(
                        plan.name.toLowerCase() as "basic" | "pro",
                        yearly ? "yearly" : "monthly"
                      )}
                    >
                      {checkoutLoading ? "Redirigiendo…" : plan.cta}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pricing footnote */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Todos los precios en EUR · IVA no incluido · Cancela en cualquier momento
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Comunidad</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Traders que mejoran<br/><span className="text-gradient">con datos reales</span>
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Andrés M.", role: "Forex · 4 años", avatar: "A",
                text: "El Coach IA me hizo ver un sesgo con NAS100 que tenía hace meses. Subí mi profit factor de 1.4 a 2.1 en 8 semanas sin cambiar el setup." },
              { name: "Lucía R.", role: "Cripto · Prop Firm FTMO", avatar: "L",
                text: "Pasé el challenge de FTMO en 3 semanas usando el control de riesgo en tiempo real. Las reglas automáticas me salvaron 3 veces de un blown." },
              { name: "Marcos D.", role: "Futuros NQ", avatar: "M",
                text: "Probé TradeZella, Edgewonk y otros. TradyncApp es el único en español y 10x más rápido de registrar. El diario diario cambió mi mentalidad." },
            ].map(t => (
              <div key={t.name} className="rounded-2xl glass p-6 hover:border-primary/20 transition border border-transparent">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({length:5}).map((_,i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-24 border-t border-border">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">FAQ</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-16 text-center shadow-elegant border border-primary/20">
            <div className="absolute inset-0 bg-mesh opacity-80" aria-hidden />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-[60%] rounded-full bg-primary/25 blur-3xl" />
            <div className="relative">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow anim-pulse-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">
                Tu próxima operación<br/>
                <span className="text-gradient">puede ser diferente</span>
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                Empieza gratis en 60 segundos. Sin tarjeta. 14 días con todas las funciones de Basic.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild variant="hero" size="xl" className="rounded-xl">
                  <Link to="/login">Crear cuenta gratis <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="glass" size="xl" className="rounded-xl">
                  <Link to="/login">Ver precios</Link>
                </Button>
              </div>
              <div className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Datos cifrados</div>
                <div className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> 100% en español</div>
                <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Sin tarjeta para empezar</div>
                <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Cancela cuando quieras</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold hover:bg-surface/40 transition">
        {q}
        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {a}
        </div>
      )}
    </div>
  );
}
