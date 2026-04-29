import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sunrise, Calendar, Newspaper, Target, AlertTriangle, CheckSquare,
  Square, TrendingUp, TrendingDown, Globe, Bell, Flame, Clock, Bookmark,
} from "lucide-react";

export const Route = createFileRoute("/app/premarket")({
  head: () => ({
    meta: [
      { title: "Pre-Market · Tradync" },
      { name: "description", content: "Prepara tu sesión: noticias, calendario económico, watchlist y plan diario." },
    ],
  }),
  component: PremarketPage,
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 ${className}`}>{children}</div>;
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

const SESSIONS = [
  { name: "Sídney",   open: "21:00", close: "06:00", status: "closed",  flag: "🇦🇺" },
  { name: "Tokio",    open: "00:00", close: "09:00", status: "closed",  flag: "🇯🇵" },
  { name: "Londres",  open: "07:00", close: "16:00", status: "active",  flag: "🇬🇧" },
  { name: "Nueva York", open: "13:30", close: "20:00", status: "soon",  flag: "🇺🇸" },
];

const NEWS = [
  { time: "14:30", impact: "high",   title: "CPI YoY (USA)",         forecast: "3.2%", previous: "3.4%", currency: "USD" },
  { time: "16:00", impact: "high",   title: "Powell speech",         forecast: "—",    previous: "—",    currency: "USD" },
  { time: "10:00", impact: "medium", title: "ECB Lagarde",           forecast: "—",    previous: "—",    currency: "EUR" },
  { time: "08:30", impact: "low",    title: "Retail Sales (UK)",     forecast: "0.4%", previous: "0.2%", currency: "GBP" },
  { time: "23:50", impact: "medium", title: "GDP QoQ (Japan)",       forecast: "0.3%", previous: "0.1%", currency: "JPY" },
];

const HEADLINES = [
  { src: "Reuters",     time: "07:42", title: "Fed officials hint at slower rate cut path amid sticky inflation", tag: "Macro" },
  { src: "Bloomberg",   time: "07:15", title: "Oil rallies above $84 as Middle East tensions escalate",            tag: "Commodities" },
  { src: "FT",          time: "06:58", title: "Nvidia hits new all-time high after AI chip demand surge",          tag: "Equities" },
  { src: "WSJ",         time: "06:30", title: "Bitcoin tests $96k as institutional inflows accelerate",            tag: "Crypto" },
];

const WATCHLIST = [
  { sym: "EURUSD", price: 1.0842, ch: 0.18,  bias: "bullish", note: "Rompe resistencia 1.0830 con volumen" },
  { sym: "GBPJPY", price: 198.42, ch: -0.34, bias: "bearish", note: "Rechazo en zona supply 199.00" },
  { sym: "XAUUSD", price: 2418.5, ch: 0.62,  bias: "bullish", note: "Continuación alcista, target 2440" },
  { sym: "NAS100", price: 18420,  ch: 0.41,  bias: "neutral", note: "Esperar confirmación de NY Open" },
  { sym: "BTCUSD", price: 96320,  ch: 1.24,  bias: "bullish", note: "Breakout limpio, RR 1:3" },
];

const INITIAL_CHECKLIST = [
  { id: "c1", label: "Revisar calendario económico del día",   done: true  },
  { id: "c2", label: "Leer titulares macro relevantes",        done: true  },
  { id: "c3", label: "Marcar zonas clave en gráficos H4/D1",   done: false },
  { id: "c4", label: "Definir bias por activo de la watchlist", done: false },
  { id: "c5", label: "Confirmar tamaño de posición y SL/TP",   done: false },
  { id: "c6", label: "Estado mental: descansado, sin tilt",    done: true  },
  { id: "c7", label: "Bloquear distracciones (móvil, redes)",  done: false },
];

function PremarketPage() {
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  const toggle = (id: string) => setChecklist((c) => c.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const done = checklist.filter((c) => c.done).length;
  const pct = Math.round((done / checklist.length) * 100);

  const impactCls = (i: string) =>
    i === "high"   ? "bg-destructive/10 text-destructive border-destructive/25" :
    i === "medium" ? "bg-warning/10 text-warning border-warning/25" :
                     "bg-info/10 text-info border-info/25";

  const sessionCls = (s: string) =>
    s === "active" ? "border-success/40 bg-success/5"  :
    s === "soon"   ? "border-warning/40 bg-warning/5"   :
                     "border-border bg-surface-2/40";

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Sunrise className="h-3.5 w-3.5 text-primary" />
            Pre-Market
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">{today || "Cargando…"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prepara tu sesión antes de abrir el primer trade.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
          <Bookmark className="h-3.5 w-3.5" /> Guardar plan diario
        </button>
      </div>

      {/* Sessions */}
      <Card>
        <SectionTitle icon={Globe} hint="Hora local UTC+1">Sesiones de mercado</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SESSIONS.map((s) => (
            <div key={s.name} className={`rounded-xl border p-3 transition ${sessionCls(s.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.flag}</span>
                  <div className="text-sm font-semibold">{s.name}</div>
                </div>
                {s.status === "active" && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE
                  </span>
                )}
                {s.status === "soon" && <span className="text-[10px] font-mono text-warning">PRONTO</span>}
                {s.status === "closed" && <span className="text-[10px] font-mono text-muted-foreground">CERRADA</span>}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground font-mono">{s.open} → {s.close}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
        {/* Calendar + News */}
        <div className="space-y-5">
          <Card>
            <SectionTitle icon={Calendar} hint={`${NEWS.length} eventos hoy`}>Calendario económico</SectionTitle>
            <div className="space-y-2">
              {NEWS.sort((a, b) => a.time.localeCompare(b.time)).map((n, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/30 transition">
                  <div className="text-xs font-mono text-muted-foreground w-12 shrink-0">{n.time}</div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${impactCls(n.impact)}`}>
                    {n.impact === "high" ? "Alto" : n.impact === "medium" ? "Medio" : "Bajo"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {n.currency} · Forecast {n.forecast} · Prev {n.previous}
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-primary transition shrink-0">
                    <Bell className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Newspaper} hint="Top headlines">Noticias del día</SectionTitle>
            <ul className="space-y-2.5">
              {HEADLINES.map((h, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/30 transition cursor-pointer">
                  <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{h.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                      <span>{h.src}</span>·<span><Clock className="inline h-2.5 w-2.5 mr-1" />{h.time}</span>·
                      <span className="text-primary">#{h.tag}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Watchlist + Checklist */}
        <div className="space-y-5">
          <Card>
            <SectionTitle icon={Target} hint={`${WATCHLIST.length} activos`}>Watchlist del día</SectionTitle>
            <div className="space-y-2">
              {WATCHLIST.map((w) => {
                const up = w.ch >= 0;
                const biasCls =
                  w.bias === "bullish" ? "text-success bg-success/10 border-success/25" :
                  w.bias === "bearish" ? "text-destructive bg-destructive/10 border-destructive/25" :
                                         "text-muted-foreground bg-surface-3 border-border";
                return (
                  <div key={w.sym} className="rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/30 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm font-bold tracking-tight">{w.sym}</div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${biasCls}`}>
                          {w.bias}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${up ? "text-success" : "text-destructive"}`}>
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? "+" : ""}{w.ch.toFixed(2)}%
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-[11px] text-muted-foreground truncate">{w.note}</div>
                      <div className="text-xs font-mono text-foreground/80 ml-2 shrink-0">{w.price.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={CheckSquare} hint={`${done}/${checklist.length} completados`}>
              Checklist pre-trade
            </SectionTitle>

            <div className="mb-4">
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                  style={{ width: `${pct}%`, boxShadow: "0 0 10px color-mix(in oklab, var(--primary) 40%, transparent)" }}
                />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">{pct}% listo para operar</div>
            </div>

            <ul className="space-y-1.5">
              {checklist.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      c.done ? "text-muted-foreground line-through" : "hover:bg-surface-2"
                    }`}
                  >
                    {c.done
                      ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="flex-1">{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            {pct === 100 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 text-success p-2.5 text-xs font-medium">
                <CheckSquare className="h-4 w-4" /> Listo para operar. ¡Buena sesión!
              </div>
            )}
            {pct < 100 && pct >= 50 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 text-warning p-2.5 text-xs font-medium">
                <AlertTriangle className="h-4 w-4" /> Completa el checklist antes de abrir posiciones.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
