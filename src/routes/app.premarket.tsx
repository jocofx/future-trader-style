import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sunrise, ChevronLeft, ChevronRight, Check, Save } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/premarket")({
  component: PremarketPage,
});

const CHECKLIST_ITEMS = [
  "He revisado el calendario económico",
  "He identificado niveles clave (soporte/resistencia)",
  "Conozco mi sesgo del día (alcista/bajista/neutral)",
  "He definido mi máximo de pérdida del día",
  "He descansado bien (mínimo 6h de sueño)",
  "No tengo distracciones ni estrés externo relevante",
  "He revisado operaciones abiertas (si las hay)",
  "Tengo claro qué setups voy a buscar hoy",
];

const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function PremarketPage() {
  const { premarket: { plans, checklistState, load, savePlan, saveChecklist, getPlan, getChecklist } } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [checks, setChecks]   = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(false));
  const [sesgo, setSesgo]     = useState("");
  const [niveles, setNiveles] = useState("");
  const [noHacer, setNoHacer] = useState("");
  const [notas, setNotas]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // Load month data when month changes
  useEffect(() => { load(year, month); }, [year, month]);

  // Load selected day data
  useEffect(() => {
    const plan = getPlan(selectedDate);
    setSesgo(plan?.sesgo ?? "");
    setNiveles(plan?.niveles ?? "");
    setNoHacer(plan?.no_hacer ?? "");
    setNotas(plan?.notas ?? "");
    const cl = getChecklist(selectedDate);
    setChecks(CHECKLIST_ITEMS.map((_, i) => cl[i] ?? false));
  }, [selectedDate, plans, checklistState]);

  const toggleCheck = async (i: number) => {
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
    await saveChecklist(selectedDate, next);
  };

  const handleSave = async () => {
    setSaving(true);
    await savePlan(selectedDate, { sesgo, niveles, no_hacer: noHacer, notas });
    await saveChecklist(selectedDate, checks);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const checkedCount = checks.filter(Boolean).length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Sunrise className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Market</h1>
          <p className="text-sm text-muted-foreground">Plan del día y checklist de preparación</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}
              className="p-1.5 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
            <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}
              className="p-1.5 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const hasPlan = !!getPlan(dateStr);
              const cl = getChecklist(dateStr);
              const clCount = cl.filter(Boolean).length;
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <button key={i} onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition relative
                    ${isSelected ? "bg-primary text-primary-foreground shadow-glow" :
                      isToday ? "border border-primary text-primary" :
                      hasPlan ? "bg-success/10 border border-success/20 text-foreground" :
                      "hover:bg-surface text-muted-foreground"}`}>
                  <span className="font-semibold">{day}</span>
                  {clCount > 0 && !isSelected && (
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {Array.from({length: Math.min(clCount, 4)}).map((_,j) =>
                        <div key={j} className="w-0.5 h-0.5 rounded-full bg-success" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Checklist progress for selected day */}
          <div className="px-4 pb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Checklist de hoy</span>
              <span className="font-mono">{checkedCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-primary transition-all"
                style={{ width: `${(checkedCount/CHECKLIST_ITEMS.length)*100}%` }} />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Date label */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-muted-foreground">
              {selectedDate === today ? "Hoy — " : ""}{new Date(selectedDate+"T12:00:00").toLocaleDateString("es", { weekday:"long", day:"numeric", month:"long" })}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saved ? <><Check className="h-4 w-4" /> Guardado</> : saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar plan</>}
            </button>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-sm font-semibold mb-4">Checklist Pre-Market</div>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <button key={i} onClick={() => toggleCheck(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition
                    ${checks[i] ? "bg-success/8 border-success/20" : "bg-surface/40 border-border hover:border-border-strong"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
                    ${checks[i] ? "bg-success border-success" : "border-muted-foreground/40"}`}>
                    {checks[i] && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`text-sm ${checks[i] ? "text-foreground line-through text-muted-foreground" : "text-foreground"}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Plan del día */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="text-sm font-semibold mb-4">Plan del día</div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sesgo del día</label>
                <div className="flex gap-2 mt-1.5">
                  {["Alcista 📈","Bajista 📉","Neutral ↔️"].map(s => (
                    <button key={s} onClick={() => setSesgo(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${sesgo === s ? "bg-primary/15 text-primary border-primary/25" : "bg-surface/60 border-border text-muted-foreground hover:text-foreground"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <input value={sesgo} onChange={e => setSesgo(e.target.value)} placeholder="O escribe tu sesgo..."
                  className="mt-2 w-full bg-surface/70 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Niveles clave</label>
                <textarea value={niveles} onChange={e => setNiveles(e.target.value)} rows={2} placeholder="Soporte en 1.0820, resistencia en 1.0850..."
                  className="mt-1.5 w-full bg-surface/70 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Lo que NO voy a hacer hoy</label>
                <textarea value={noHacer} onChange={e => setNoHacer(e.target.value)} rows={2} placeholder="No operar en la apertura, no entrar sin confirmación..."
                  className="mt-1.5 w-full bg-surface/70 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notas adicionales</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Contexto macro, eventos importantes..."
                  className="mt-1.5 w-full bg-surface/70 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
