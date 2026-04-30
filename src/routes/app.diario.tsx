import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookText, ChevronLeft, ChevronRight, Save, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/diario")({
  component: DiarioPage,
});

const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EMOCIONES = [
  { key: "sereno",      label: "Sereno",      emoji: "😌" },
  { key: "confiado",    label: "Confiado",    emoji: "💪" },
  { key: "ansioso",     label: "Ansioso",     emoji: "😰" },
  { key: "frustrado",   label: "Frustrado",   emoji: "😤" },
  { key: "motivado",    label: "Motivado",    emoji: "🔥" },
  { key: "inseguro",    label: "Inseguro",    emoji: "😟" },
  { key: "eufórico",    label: "Eufórico",    emoji: "🤩" },
  { key: "neutral",     label: "Neutral",     emoji: "😐" },
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

  // Recent entries for sidebar
  const recent = entries.slice(0, 5);

  const emoColor: Record<string, string> = {
    sereno: "text-success", confiado: "text-primary", ansioso: "text-warning",
    frustrado: "text-destructive", motivado: "text-primary", inseguro: "text-warning",
    eufórico: "text-success", neutral: "text-muted-foreground",
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <BookText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diario de Trading</h1>
          <p className="text-sm text-muted-foreground">{entries.length} entradas registradas</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr_240px] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden h-fit">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
              className="p-1.5 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
            <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
              className="p-1.5 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground">
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
              return (
                <button key={i} onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition
                    ${isSelected ? "bg-primary text-primary-foreground shadow-glow" :
                      isToday ? "border border-primary text-primary" :
                      entry ? "bg-surface-2 text-foreground" :
                      "text-muted-foreground hover:bg-surface"}`}>
                  {entry && !isSelected ? "📝" : day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-muted-foreground">
              {selected === today ? "Hoy — " : ""}
              {new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saved ? <><Check className="h-4 w-4"/>Guardado</> : saving ? "Guardando..." : <><Save className="h-4 w-4"/>Guardar</>}
            </button>
          </div>

          {/* Emotion picker */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">¿Cómo te sientes hoy?</div>
            <div className="grid grid-cols-4 gap-2">
              {EMOCIONES.map(e => (
                <button key={e.key} onClick={() => setEmocion(emocion === e.key ? "" : e.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition
                    ${emocion === e.key ? "border-primary bg-primary/10" : "border-border bg-surface/40 hover:border-border-strong"}`}>
                  <span className="text-2xl">{e.emoji}</span>
                  <span className={`text-[10px] font-semibold ${emocion === e.key ? "text-primary" : "text-muted-foreground"}`}>{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nivel de confianza</div>
              <div className="font-mono font-bold text-primary">{confianza}/10</div>
            </div>
            <input type="range" min={1} max={10} value={confianza} onChange={e => setConfianza(Number(e.target.value))}
              className="w-full accent-primary h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Bajo</span><span>Medio</span><span>Alto</span>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Notas del día</div>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={10}
              placeholder="¿Cómo fue el día? ¿Qué aprendiste? ¿Qué harías diferente?&#10;&#10;Describe tus operaciones, emociones, patrones que detectaste..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed" />
          </div>
        </div>

        {/* Recent entries */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold">Entradas recientes</div>
          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Sin entradas</div>
            ) : recent.map(e => {
              const emo = EMOCIONES.find(em => em.key === e.emocion);
              return (
                <button key={e.id} onClick={() => setSelected(e.fecha)}
                  className={`w-full px-4 py-3 text-left hover:bg-surface/40 transition ${selected === e.fecha ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold font-mono text-muted-foreground">{e.fecha}</div>
                    {emo && <span className="text-base">{emo.emoji}</span>}
                  </div>
                  {e.contenido && (
                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {e.contenido.slice(0, 80)}{e.contenido.length > 80 ? "..." : ""}
                    </div>
                  )}
                  {e.confianza && (
                    <div className="mt-1.5 flex items-center gap-1">
                      {Array.from({length:10}).map((_,i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < (e.confianza??0) ? "bg-primary" : "bg-surface-3"}`} />
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
