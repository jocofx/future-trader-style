import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Brain, ShieldCheck, BarChart3, Bot, Calendar, ChevronRight,
  Zap, Globe2, Lock, Star, Check, ArrowRight,
} from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { HeroDashboardMock } from "@/components/HeroDashboardMock";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="absolute inset-0 bg-mesh" aria-hidden />
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Nueva versión 2026</span>
            <span className="text-foreground font-medium">· Coach IA con memoria a largo plazo</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            El journal que <br className="hidden sm:block" />
            <span className="text-gradient">convierte datos en disciplina</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            Tradync registra cada operación, analiza tu psicología y te entrena con un Coach IA personal.
            Diseñado para traders profesionales, gratis para empezar.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="hero" size="xl" className="rounded-xl">
              <Link to="/app">
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl" className="rounded-xl">
              <Link to="/app">Ver demo en vivo</Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Sin tarjeta</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> 14 días Pro gratis</div>
            <div className="hidden sm:flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Cancela cuando quieras</div>
          </div>

          {/* Hero mock */}
          <div className="mt-16 md:mt-20 max-w-5xl mx-auto">
            <HeroDashboardMock />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="relative border-y border-border bg-surface/30 py-8 overflow-hidden">
        <div className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
          Compatible con tus brokers favoritos
        </div>
        <div className="flex gap-12 anim-marquee whitespace-nowrap">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0 px-6">
              {["MetaTrader 4","MetaTrader 5","cTrader","Binance","Bybit","NinjaTrader","TradingView","Interactive Brokers","Kraken","Coinbase"].map((b) => (
                <span key={b} className="text-lg font-semibold text-muted-foreground/60 tracking-tight hover:text-foreground transition">{b}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Features</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Todo lo que necesitas para <span className="text-gradient">trader como pro</span></h2>
            <p className="mt-4 text-muted-foreground">Herramientas serias para traders serios — no más hojas de Excel ni capturas perdidas en el móvil.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(180px,auto)]">
            {/* Card grande - Coach IA */}
            <FeatureCard className="md:col-span-4 md:row-span-2" highlight icon={Bot} title="Coach IA personal"
              desc="Aprende de cada trade tuyo. Detecta sesgos, sugiere mejoras y te habla en español natural — entrenado con tu propio historial.">
              <CoachPreview />
            </FeatureCard>

            <FeatureCard className="md:col-span-2" icon={ShieldCheck} title="Control de riesgo"
              desc="Reglas en tiempo real: límite diario, drawdown, max trades. Te frena antes de que el día se rompa." />

            <FeatureCard className="md:col-span-2" icon={BarChart3} title="Estadísticas avanzadas"
              desc="Win rate, profit factor, expectancy, R-multiple, MAE/MFE. Filtros por sesión, símbolo, setup." />

            <FeatureCard className="md:col-span-3" icon={Brain} title="Psicología medible"
              desc="Tags de emociones, confianza, FOMO. Cruza tu estado mental con tus resultados y descubre tu mejor yo." />

            <FeatureCard className="md:col-span-3" icon={Calendar} title="Calendario heatmap"
              desc="Visualiza tus mejores días, rachas y patrones temporales con un calendario interactivo." />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative py-24">
        <div className="absolute inset-0 bg-mesh opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Precios</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Empieza gratis. Escala cuando quieras.</h2>
            <p className="mt-4 text-muted-foreground">Sin compromisos. Sin tarjeta para empezar.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            <PricingCard name="Free" price="0" period="siempre" desc="Para empezar a trackear tus trades."
              features={["Hasta 50 trades/mes","Estadísticas básicas","1 cuenta de broker","Calendario y diario"]} cta="Empezar" />
            <PricingCard name="Pro" price="19" period="mes" desc="Para traders activos serios." featured
              features={["Trades ilimitados","Coach IA básico (50 msgs/mes)","Estadísticas avanzadas","Multi-broker","Control de riesgo","Psicología & hábitos"]} cta="Probar 14 días gratis" />
            <PricingCard name="Elite" price="49" period="mes" desc="Para profesionales y prop firms."
              features={["Todo de Pro","Coach IA ilimitado + memoria","Gestor EA & bots","API y exports","Soporte prioritario 24/7","Onboarding personalizado"]} cta="Hablar con ventas" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Comunidad</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Traders que mejoraron con Tradync</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Andrés M.", role: "Forex · 4 años", text: "El Coach IA me hizo ver un sesgo que tenía hace meses con NAS100. Subí mi profit factor de 1.4 a 2.1 en 8 semanas." },
              { name: "Lucía R.", role: "Cripto · Prop firm", text: "Pasé el challenge de FTMO en 3 semanas usando el control de riesgo. Las reglas en tiempo real son oro." },
              { name: "Marcos D.", role: "Futuros NQ", text: "Probé TradeZella y otros. Tradync es 10x más rápido y el journal en español hace toda la diferencia." },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl glass p-6">
                <div className="flex gap-0.5 text-warning">{Array.from({length:5}).map((_,i)=><Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-bold">{t.name[0]}</div>
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

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-16 text-center shadow-elegant">
            <div className="absolute inset-0 bg-mesh opacity-80" aria-hidden />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-[60%] rounded-full bg-primary/30 blur-3xl" />
            <div className="relative">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow anim-pulse-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">¿Listo para ser un mejor trader?</h2>
              <p className="mt-4 max-w-xl mx-auto text-muted-foreground">Empieza gratis en 60 segundos. Sin tarjeta, sin compromiso.</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild variant="hero" size="xl" className="rounded-xl">
                  <Link to="/app">Crear cuenta gratis <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="glass" size="xl" className="rounded-xl">
                  <Link to="/app">Explorar demo</Link>
                </Button>
              </div>
              <div className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Datos cifrados</div>
                <div className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> 100% en español</div>
                <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Sync en tiempo real</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function FeatureCard({
  icon: Icon, title, desc, className = "", highlight = false, children,
}: { icon: any; title: string; desc: string; className?: string; highlight?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur p-6 transition hover:border-primary/40 ${highlight ? "border-primary/30" : "border-border"} ${className}`}>
      {highlight && <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />}
      <div className="relative flex flex-col h-full">
        <div className={`h-10 w-10 grid place-items-center rounded-xl ${highlight ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-primary/10 text-primary border border-primary/20"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
        {children && <div className="mt-5 flex-1">{children}</div>}
      </div>
    </div>
  );
}

function CoachPreview() {
  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex gap-2.5">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></div>
        <div className="glass rounded-2xl px-3.5 py-2.5 max-w-md">Tu mejor sesión es de 9:30 a 11:00 GMT, con 78% win rate. ¿Quieres bloquear ese horario en tu plan diario?</div>
      </div>
      <div className="flex gap-2.5 flex-row-reverse">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-surface-3 grid place-items-center text-xs font-bold">JC</div>
        <div className="bg-primary/15 border border-primary/20 rounded-2xl px-3.5 py-2.5">Sí, hazlo. Y avísame si rompo la regla.</div>
      </div>
      <div className="flex gap-2.5">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></div>
        <div className="glass rounded-2xl px-3.5 py-2.5">Hecho ✅ Te enviaré una alerta si operas fuera de tu ventana óptima.</div>
      </div>
    </div>
  );
}

function PricingCard({
  name, price, period, desc, features, cta, featured = false,
}: { name: string; price: string; period: string; desc: string; features: string[]; cta: string; featured?: boolean }) {
  return (
    <div className={`relative rounded-2xl border p-7 backdrop-blur transition ${featured ? "border-primary/40 bg-card/80 shadow-glow scale-[1.02]" : "border-border bg-card/50 hover:border-primary/30"}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
          Más popular
        </div>
      )}
      <div className="text-sm font-semibold tracking-wide">{name}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight">${price}</span>
        <span className="text-sm text-muted-foreground">/ {period}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={`h-4 w-4 shrink-0 mt-0.5 ${featured ? "text-primary" : "text-success"}`} />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant={featured ? "hero" : "glass"} className="mt-7 w-full rounded-xl" size="lg">
        <Link to="/app">{cta}</Link>
      </Button>
    </div>
  );
}
