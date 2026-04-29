import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Moon, Dumbbell, Brain, Wine } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/habitos")({
  component: HabitosPage,
});

const DAYS    = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const CORE_HABITS = [
  { key: "sueno",      label: "Sueño",      icon: Moon,        unit: "h",   max: 10, color: "text-blue" },
  { key: "ejercicio",  label: "Ejercicio",  icon: Dumbbell,    unit: "min", max: 120, color: "text-success" },
  { key: "meditacion", label: "Meditación", icon: Brain,       unit: "min", max: 60,  color: "text-purple" },
  { key: "alcohol",    label: "Alcohol",    icon: Wine,        unit: "u",   max: 5,   color: "text-warning", inverse: true },
];

function HabitosPage() {
  const { habits: { habits, load, save, getForDate } } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState(today);
  const [values, setValues]     = useState<Record<string, number>>({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => { load(year, month); }, [year, month]);

  useEffect(() => {
    const h = getForDate(selected);
    setValues({
      sueno:      h?.sueno      ?? 0,
      ejercicio:  h?.ejercicio  ?? 0,
      meditacion: h?.meditacion ?? 0,
      alcohol:    h?.alcohol    ?? 0,
    });
  }, [selected, habits]);

  const handleSave = async () => {
    setSaving(true);
    await save(selected, values);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Calendar grid
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells  = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  // Score calculation for a day
  const getScore = (h: ReturnType<typeof getForDate>) => {
    if (!h) return 0;
    let score = 0;
    if ((h.sueno ?? 0) >= 7) score++;
    if ((h.ejercicio ?? 0) >= 30) score++;
    if ((h.meditacion ?? 0) >= 10) score++;
    if ((h.alcohol ?? 0) === 0) score++;
    return score;
  };

  // Monthly stats
  const monthHabits = habits.filter(h => {
    const d = new Date(h.fecha);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const avgSueno     = monthHabits.length ? (monthHabits.reduce((s,h) => s+(h.sueno??0),0)/monthHabits.length).toFixed(1) : "—";
  const daysExercise = monthHabits.filter(h => (h.ejercicio??0) >= 30).length;
  const daysNoAlc    = monthHabits.filter(h => (h.alcohol??0) === 0).length;
  const avgScore     = monthHabits.length ? (monthHabits.reduce((s,h) => s+getScore(h),0)/monthHabits.length).toFixed(1) : "—";

  const scoreColor = (s: number) =>
    s === 4 ? "bg-success/80" : s === 3 ? "bg-success/40" : s === 2 ? "bg-warning/40" : s === 1 ? "bg-destructive/20" : "";

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hábitos</h1>
          <p className="text-sm text-muted-foreground">Seguimiento de hábitos y bienestar</p>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sueño medio",    value: avgSueno+"h",          color: "text-info" },
          { label: "Días ejercicio", value: daysExercise+" días",  color: "text-success" },
          { label: "Días sin alcohol", value: daysNoAlc+" días",   color: "text-warning" },
          { label: "Puntuación media", value: avgScore+"/4",       color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
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
              const h = getForDate(dateStr);
              const score = getScore(h);
              const isToday    = dateStr === today;
              const isSelected = dateStr === selected;
              return (
                <button key={i} onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition relative
                    ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                    ${isToday ? "border border-primary" : ""}
                    ${h && !isSelected ? scoreColor(score) : !isSelected ? "hover:bg-surface" : ""}
                    ${isSelected ? scoreColor(score) || "bg-primary/20" : ""}`}>
                  <span className={`font-semibold ${isSelected || isToday ? "text-foreground" : h ? "text-foreground" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  {h && (
                    <div className="text-[8px] font-mono mt-0.5 text-muted-foreground">{score}/4</div>
                  )}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Puntuación:</span>
            {[["4/4","bg-success/80"],["3/4","bg-success/40"],["2/4","bg-warning/40"],["1/4","bg-destructive/20"]].map(([label, cls]) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-sm ${cls}`} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — habit inputs */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold">
                {selected === today ? "Hoy — " : ""}
                {new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Registra tus hábitos del día</div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          <div className="space-y-6">
            {CORE_HABITS.map(h => {
              const val = values[h.key] ?? 0;
              const pct = Math.min(100, (val / h.max) * 100);
              const good = h.inverse ? val === 0 : val >= h.max * 0.5;
              return (
                <div key={h.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h.icon className={`h-4 w-4 ${h.color}`} />
                      <span className="text-sm font-semibold">{h.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setValues(v => ({ ...v, [h.key]: Math.max(0, (v[h.key]??0)-1) }))}
                        className="w-7 h-7 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-foreground transition text-sm font-bold">−</button>
                      <span className={`font-mono text-lg font-bold w-12 text-center ${good ? "text-success" : h.inverse && val > 0 ? "text-warning" : "text-foreground"}`}>
                        {val}<span className="text-xs font-normal text-muted-foreground">{h.unit}</span>
                      </span>
                      <button onClick={() => setValues(v => ({ ...v, [h.key]: Math.min(h.max, (v[h.key]??0)+1) }))}
                        className="w-7 h-7 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-foreground transition text-sm font-bold">+</button>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: h.inverse
                          ? val === 0 ? "oklch(0.78 0.18 158)" : "oklch(0.80 0.16 75)"
                          : good ? "oklch(0.78 0.18 158)" : "oklch(0.74 0.14 240)"
                      }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntuación del día</span>
              <div className="flex items-center gap-1">
                {Array.from({length:4}).map((_,i) => {
                  const score = [
                    (values.sueno??0) >= 7,
                    (values.ejercicio??0) >= 30,
                    (values.meditacion??0) >= 10,
                    (values.alcohol??0) === 0,
                  ][i];
                  return <div key={i} className={`w-5 h-5 rounded-md border ${score ? "bg-success border-success" : "border-border bg-surface/40"}`}>{score && <CheckCircle2 className="w-3 h-3 text-white m-auto mt-0.5" />}</div>;
                })}
                <span className="ml-2 font-mono font-bold text-primary">
                  {[values.sueno>=7,values.ejercicio>=30,values.meditacion>=10,values.alcohol===0].filter(Boolean).length}/4
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
