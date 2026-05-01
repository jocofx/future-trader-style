import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { BookText, ChevronLeft, ChevronRight, Save, Check, Sparkles, Search, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/diario")({
  head: () => ({
    meta: [
      { title: "Diario · Tradync" },
      { name: "description", content: "Diario de trading: registra emociones, confianza y notas para cada día." },
    ],
  }),
  component: DiarioPage,
});

const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EMOCIONES = [
  { key: "sereno",    label: "Sereno",    emoji: "😌", tone: "oklch(0.78 0.18 158)" },
  { key: "confiado",  label: "Confiado",  emoji: "💪", tone: "oklch(0.74 0.14 240)" },
  { key: "motivado",  label: "Motivado",  emoji: "🔥", tone: "oklch(0.72 0.18 35)" },
  { key: "neutral",   label: "Neutral",   emoji: "😐", tone: "oklch(0.65 0.02 250)" },
  { key: "ansioso",   label: "Ansioso",   emoji: "😰", tone: "oklch(0.80 0.16 75)" },
  { key: "frustrado", label: "Frustrado", emoji: "😤", tone: "oklch(0.68 0.22 18)" },
  { key: "inseguro",  label: "Inseguro",  emoji: "😟", tone: "oklch(0.74 0.18 305)" },
  { key: "eufórico",  label: "Eufórico",  emoji: "🤩", tone: "oklch(0.78 0.18 158)" },
];

function DiarioPage() {
  const { diario: { entries, load, save, getForDate } } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const [year, setYear]       = useState(new Date().getFullYear());
  const [month, setMonth]     = useState(new Date().getMonth());
  const [selected, setSelected] = useState(today);
  const [contenido, setContenido] = useState("");
  const [emocion, setEmocion]    = useState("");
  const [confianza, setConfianza] = useState(5);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [search, setSearch]   = useState("");

  useEffect(() => { load(60); }, []);

  useEffect(() => {
    const e = getForDate(selected);
    setContenido(e?.contenido ?? "");
    setEmocion(e?.emocion ?? "");
    setConfianza(e?.confianza ?? 5);
  }, [selected, entries]);

  const handleSave = async () => {
    setSaving(true);
    await save(selected, { contenido, emocion, confianza });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Calendar
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells  = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const filtered = useMemo(() => {
    if (!search) return entries.slice(0, 8);
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.contenido?.toLowerCase().includes(q) ||
      e.emocion?.toLowerCase().includes(q) ||
      e.fecha.includes(q)
    ).slice(0, 12);
  }, [entries, search]);

  const stats = useMemo(() => {
    const total = entries.length;
    const monthEntries = entries.filter(e => e.fecha.startsWith(`${year}-${String(month+1).padStart(2,"0")}`));
    const avgConf = monthEntries.length ? (monthEntries.reduce((s,e) => s + (e.confianza ?? 0), 0) / monthEntries.length).toFixed(1) : "—";
    const dominant = (() => {
      const map: Record<string,number> = {};
      monthEntries.forEach(e => { if (e.emocion) map[e.emocion] = (map[e.emocion] ?? 0) + 1; });
      const sorted = Object.entries(map).sort((a,b) => b[1] - a[1]);
      return sorted[0]?.[0] ?? "—";
    })();
    return { total, monthCount: monthEntries.length, avgConf, dominant };
  }, [entries, year, month]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <BookText className="h-3.5 w-3.5 text-primary" />
            Trading Journal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Diario del Trader</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registra tus emociones, nivel de confianza y notas. La consistencia construye consciencia.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-[0_0_20px_-4px_oklch(var(--primary)/0.4)] disabled:opacity-50">
          {saved ? <><Check className="h-4 w-4" /> Guardado</> : saving ? "Guardando…" : <><Save className="h-4 w-4" /> Guardar entrada</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Entradas totales",    value: String(stats.total),                                                      tone: "text-info" },
          { label: "Entradas este mes",   value: String(stats.monthCount),                                                 tone: "text-primary" },
          { label: "Confianza media",     value: `${stats.avgConf}/10`,                                                    tone: "text-success" },
          { label: "Emoción dominante",   value: stats.dominant !== "—" ? `${EMOCIONES.find(e => e.key === stats.dominant)?.emoji ?? ""} ${stats.dominant}` : "—", tone: "text-warning" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 capitalize ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden h-fit">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
            <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 p-2">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const entry   = getForDate(dateStr);
              const isToday    = dateStr === today;
              const isSelected = dateStr === selected;
              const emo = entry?.emocion ? EMOCIONES.find(e => e.key === entry.emocion) : null;
              return (
                <button key={i} onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition relative
                    ${isSelected ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_oklch(var(--primary)/0.6)]" :
                      isToday ? "border border-primary text-primary" :
                      entry ? "bg-surface-2/60 text-foreground hover:bg-surface-2" :
                      "text-muted-foreground hover:bg-surface-2/40"}`}>
                  <span>{day}</span>
                  {emo && !isSelected && (
                    <span className="absolute bottom-0.5 text-[8px] leading-none">{emo.emoji}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div className="text-sm font-semibold text-muted-foreground">
            {selected === today && <span className="text-primary">Hoy · </span>}
            <span className="capitalize">{new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
          </div>

          {/* Emotion picker */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-3">¿Cómo te sientes hoy?</div>
            <div className="grid grid-cols-4 gap-2">
              {EMOCIONES.map(e => {
                const isActive = emocion === e.key;
                return (
                  <button key={e.key} onClick={() => setEmocion(isActive ? "" : e.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                      isActive ? "border-primary/50 bg-primary/10" : "border-border bg-surface-2/40 hover:border-primary/30"
                    }`}
                    style={isActive ? { borderColor: `color-mix(in oklab, ${e.tone} 50%, transparent)`, background: `color-mix(in oklab, ${e.tone} 12%, transparent)` } : undefined}
                  >
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="text-[10px] font-semibold" style={isActive ? { color: e.tone } : { color: "var(--muted-foreground)" }}>{e.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confidence */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Nivel de confianza</div>
              <div className="font-mono font-bold text-primary text-lg">{confianza}<span className="text-xs text-muted-foreground">/10</span></div>
            </div>
            <input type="range" min={1} max={10} value={confianza} onChange={e => setConfianza(Number(e.target.value))}
              className="w-full accent-primary h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>Bajo</span><span>Medio</span><span>Alto</span>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-3 w-3" /> Notas del día
            </div>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={10}
              placeholder="¿Cómo fue el día? ¿Qué aprendiste? ¿Qué harías diferente?&#10;&#10;Describe tus operaciones, emociones, patrones que detectaste…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed font-mono" />
            <div className="text-[10px] text-muted-foreground text-right mt-1">{contenido.length} caracteres</div>
          </div>
        </div>

        {/* Recent + search */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Entradas recientes
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar…"
                className="w-full h-7 pl-8 pr-2 rounded-md bg-surface-2/60 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Sin entradas</div>
            ) : filtered.map(e => {
              const emo = EMOCIONES.find(em => em.key === e.emocion);
              return (
                <button key={e.id} onClick={() => setSelected(e.fecha)}
                  className={`w-full px-4 py-3 text-left hover:bg-surface-2/40 transition ${selected === e.fecha ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-semibold font-mono text-muted-foreground">{e.fecha}</div>
                    {emo && <span className="text-base">{emo.emoji}</span>}
                  </div>
                  {e.contenido && (
                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{e.contenido}</div>
                  )}
                  {e.confianza && (
                    <div className="mt-1.5 flex items-center gap-0.5">
                      {Array.from({length:10}).map((_,i) => (
                        <div key={i} className={`h-0.5 flex-1 rounded-full ${i < (e.confianza??0) ? "bg-primary" : "bg-surface-3"}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
