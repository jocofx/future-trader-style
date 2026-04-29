import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookText, Plus, Search, Smile, Meh, Frown, Tag, Pin, Image as ImageIcon,
  TrendingUp, TrendingDown, Calendar, Filter, Sparkles, MoreVertical,
} from "lucide-react";

export const Route = createFileRoute("/app/diario")({
  head: () => ({
    meta: [
      { title: "Diario · Tradync" },
      { name: "description", content: "Tu journal personal: reflexiones, lecciones y notas de cada sesión de trading." },
    ],
  }),
  component: DiarioPage,
});

type Mood = "great" | "neutral" | "bad";
type Entry = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: Mood;
  tags: string[];
  pinned?: boolean;
  pl?: number;
  hasImage?: boolean;
};

const ENTRIES: Entry[] = [
  {
    id: "e1", date: "2026-04-28", title: "Sesión NY: paciencia que paga",
    body: "Esperé el rechazo en el supply de NAS100 a las 09:35. Entré con SL ajustado y dejé correr el ganador hasta target 1:3. La clave hoy fue no anticiparme antes del NY Open.",
    mood: "great", tags: ["NAS100", "NY Open", "Paciencia"], pinned: true, pl: 1840,
  },
  {
    id: "e2", date: "2026-04-27", title: "Revenge trading detectado",
    body: "Tras la primera pérdida del día, abrí 3 trades sin plan en EURUSD. Resultado: -2.4R innecesarios. Necesito activar el cool-down automático tras pérdidas.",
    mood: "bad", tags: ["EURUSD", "Tilt", "Lección"], pl: -640,
  },
  {
    id: "e3", date: "2026-04-25", title: "Estructura clara en GOLD",
    body: "Trade limpio con confluencia de FVG + orden block H4. Ejecución correcta, gestión correcta. Día sólido aunque sin grandes movimientos.",
    mood: "great", tags: ["GOLD", "SMC", "Estructura"], pl: 920, hasImage: true,
  },
  {
    id: "e4", date: "2026-04-24", title: "Día neutral, mucho ruido",
    body: "Mercado lateral toda la sesión. Hice bien en no forzar. A veces el mejor trade es no operar. Aproveché para revisar el plan semanal.",
    mood: "neutral", tags: ["Sin trades", "Plan semanal"],
  },
  {
    id: "e5", date: "2026-04-22", title: "FOMO en BTC, lección cara",
    body: "Vi BTC subir 3% sin mí y entré tarde con tamaño doble. Stop hit casi inmediato. Recordatorio: el setup que no estaba al inicio, ya no está.",
    mood: "bad", tags: ["BTCUSD", "FOMO", "Lección"], pl: -1240,
  },
  {
    id: "e6", date: "2026-04-21", title: "Mejor semana del trimestre",
    body: "Cierre de semana con +5.4%. Disciplina al 100% en checklist pre-trade. La consistencia empieza a notarse en la curva de equity.",
    mood: "great", tags: ["Semanal", "Consistencia"], pinned: true, pl: 3210, hasImage: true,
  },
];

const MOOD_META: Record<Mood, { Icon: any; label: string; cls: string }> = {
  great:   { Icon: Smile, label: "Excelente", cls: "text-success bg-success/10 border-success/25" },
  neutral: { Icon: Meh,   label: "Neutral",   cls: "text-muted-foreground bg-surface-3 border-border" },
  bad:     { Icon: Frown, label: "Difícil",   cls: "text-destructive bg-destructive/10 border-destructive/25" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 ${className}`}>{children}</div>;
}

function DiarioPage() {
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<"all" | Mood>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);

  const allTags = useMemo(() => Array.from(new Set(ENTRIES.flatMap((e) => e.tags))), []);

  const filtered = ENTRIES.filter((e) => {
    if (moodFilter !== "all" && e.mood !== moodFilter) return false;
    if (activeTag && !e.tags.includes(activeTag)) return false;
    if (query && !(e.title + e.body).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (a.pinned === b.pinned ? b.date.localeCompare(a.date) : a.pinned ? -1 : 1));

  const stats = {
    total: ENTRIES.length,
    great: ENTRIES.filter((e) => e.mood === "great").length,
    bad: ENTRIES.filter((e) => e.mood === "bad").length,
    streak: 12,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <BookText className="h-3.5 w-3.5 text-primary" />
            Diario
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tu journal de trading</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Las notas que escribes hoy son la estrategia que ejecutas mañana.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
          <Plus className="h-3.5 w-3.5" /> Nueva entrada
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Entradas", value: stats.total, sub: "Total acumulado", Icon: BookText, tone: "text-foreground" },
          { label: "Días excelentes", value: stats.great, sub: "Última semana", Icon: Smile, tone: "text-success" },
          { label: "Lecciones", value: stats.bad, sub: "Errores documentados", Icon: Frown, tone: "text-destructive" },
          { label: "Racha journal", value: `${stats.streak}d`, sub: "Escribiendo a diario", Icon: Sparkles, tone: "text-primary" },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tus notas…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1">
          {([
            ["all", "Todos"], ["great", "Excelentes"], ["neutral", "Neutrales"], ["bad", "Difíciles"],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMoodFilter(k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                moodFilter === k
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-5">
        {/* Entries grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((e) => {
            const m = MOOD_META[e.mood];
            const MoodIcon = m.Icon;
            return (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="group text-left rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5 hover:border-primary/40 transition relative overflow-hidden"
              >
                {e.pinned && (
                  <Pin className="absolute top-3 right-3 h-3.5 w-3.5 text-primary fill-primary/40" />
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${m.cls}`}>
                    <MoodIcon className="h-3 w-3" /> {m.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {e.date}
                  </span>
                  {e.pl !== undefined && (
                    <span className={`ml-auto text-xs font-mono font-semibold flex items-center gap-1 ${e.pl >= 0 ? "text-success" : "text-destructive"}`}>
                      {e.pl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {e.pl >= 0 ? "+" : ""}${Math.abs(e.pl).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-base font-semibold tracking-tight group-hover:text-primary transition">{e.title}</div>
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">{e.body}</p>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {e.tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground border border-border">
                      #{t}
                    </span>
                  ))}
                  {e.hasImage && (
                    <span className="ml-auto text-muted-foreground"><ImageIcon className="h-3.5 w-3.5" /></span>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted-foreground">
              No hay entradas con esos filtros.
            </div>
          )}
        </div>

        {/* Tags sidebar */}
        <Card className="h-fit sticky top-20">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Etiquetas</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-[11px] px-2 py-1 rounded-md border transition ${
                !activeTag ? "bg-primary/15 text-primary border-primary/30" : "bg-surface-2 text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              Todas
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={`text-[11px] px-2 py-1 rounded-md border font-mono transition ${
                  activeTag === t ? "bg-primary/15 text-primary border-primary/30" : "bg-surface-2 text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl pointer-events-none"
              style={{ background: selected.mood === "great" ? "color-mix(in oklab, var(--primary) 30%, transparent)" : selected.mood === "bad" ? "color-mix(in oklab, var(--destructive) 30%, transparent)" : "color-mix(in oklab, var(--info) 25%, transparent)" }}
            />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{selected.date}</div>
                  <h3 className="text-2xl font-bold tracking-tight">{selected.title}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{selected.body}</p>
              <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                {selected.tags.map((t) => (
                  <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-primary border border-primary/20">#{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
