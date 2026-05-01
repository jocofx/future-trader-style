import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Moon, Dumbbell, Brain, Wine, Save, Check, Flame, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/habitos")({
  head: () => ({
    meta: [
      { title: "Hábitos · Tradync" },
      { name: "description", content: "Seguimiento de hábitos y bienestar para mejorar tu rendimiento." },
    ],
  }),
  component: HabitosPage,
});

const DAYS    = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const CORE_HABITS = [
  { key: "sueno",      label: "Sueño",      icon: Moon,     unit: "h",   max: 10,  tone: "oklch(0.74 0.14 240)", target: "≥ 7h" },
  { key: "ejercicio",  label: "Ejercicio",  icon: Dumbbell, unit: "min", max: 120, tone: "oklch(0.78 0.18 158)", target: "≥ 30min" },
  { key: "meditacion", label: "Meditación", icon: Brain,    unit: "min", max: 60,  tone: "oklch(0.74 0.18 305)", target: "≥ 10min" },
  { key: "alcohol",    label: "Alcohol",    icon: Wine,     unit: "u",   max: 5,   tone: "oklch(0.80 0.16 75)",  target: "= 0", inverse: true },
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

  const getScore = (h: ReturnType<typeof getForDate>) => {
    if (!h) return 0;
    let score = 0;
    if ((h.sueno ?? 0) >= 7) score++;
    if ((h.ejercicio ?? 0) >= 30) score++;
    if ((h.meditacion ?? 0) >= 10) score++;
    if ((h.alcohol ?? 0) === 0) score++;
    return score;
  };

  const monthHabits = habits.filter(h => {
    const d = new Date(h.fecha);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const avgSueno     = monthHabits.length ? (monthHabits.reduce((s,h) => s+(h.sueno??0),0)/monthHabits.length).toFixed(1) : "—";
  const daysExercise = monthHabits.filter(h => (h.ejercicio??0) >= 30).length;
  const daysNoAlc    = monthHabits.filter(h => (h.alcohol??0) === 0).length;
  const avgScore     = monthHabits.length ? (monthHabits.reduce((s,h) => s+getScore(h),0)/monthHabits.length).toFixed(1) : "—";

  // Streak (consecutive days with score >= 3)
  const streak = useMemo(() => {
    let s = 0;
    const sorted = [...habits].sort((a,b) => b.fecha.localeCompare(a.fecha));
    for (const h of sorted) {
      if (getScore(h) >= 3) s++;
      else break;
    }
    return s;
  }, [habits]);

  const todayScore = useMemo(() => {
    let s = 0;
    if ((values.sueno ?? 0) >= 7) s++;
    if ((values.ejercicio ?? 0) >= 30) s++;
    if ((values.meditacion ?? 0) >= 10) s++;
    if ((values.alcohol ?? 0) === 0) s++;
    return s;
  }, [values]);

  const scoreCellStyle = (s: number) => {
    if (s === 4) return { background: "color-mix(in oklab, oklch(0.78 0.18 158) 35%, transparent)", borderColor: "color-mix(in oklab, oklch(0.78 0.18 158) 50%, transparent)" };
    if (s === 3) return { background: "color-mix(in oklab, oklch(0.78 0.18 158) 18%, transparent)", borderColor: "color-mix(in oklab, oklch(0.78 0.18 158) 30%, transparent)" };
    if (s === 2) return { background: "color-mix(in oklab, oklch(0.80 0.16 75) 18%, transparent)",  borderColor: "color-mix(in oklab, oklch(0.80 0.16 75) 30%, transparent)" };
    if (s === 1) return { background: "color-mix(in oklab, oklch(0.68 0.22 18) 12%, transparent)",  borderColor: "color-mix(in oklab, oklch(0.68 0.22 18) 25%, transparent)" };
    return {};
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Wellness · Bienestar diario
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hábitos del Trader</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tu rendimiento empieza fuera del gráfico. Mide lo que importa cada día.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-[0_0_20px_-4px_oklch(var(--primary)/0.4)] disabled:opacity-50">
          {saved ? <><Check className="h-4 w-4" /> Guardado</> : saving ? "Guardando…" : <><Save className="h-4 w-4" /> Guardar día</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Sueño medio",      value: `${avgSueno}h`,             Icon: Moon,       tone: "text-info" },
          { label: "Días ejercicio",   value: `${daysExercise}`,          Icon: Dumbbell,   tone: "text-success" },
          { label: "Días sin alcohol", value: `${daysNoAlc}`,             Icon: Wine,       tone: "text-warning" },
          { label: "Score medio",      value: `${avgScore}/4`,            Icon: TrendingUp, tone: "text-primary" },
          { label: "Racha actual",     value: `${streak}d`,               Icon: Flame,      tone: streak >= 3 ? "text-warning" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 ${s.tone}`}>
              <s.Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</div>
              <div className={`text-lg font-bold font-mono ${s.tone}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
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
              const h = getForDate(dateStr);
              const score = getScore(h);
              const isToday    = dateStr === today;
              const isSelected = dateStr === selected;
              return (
                <button key={i} onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition relative border
                    ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary" :
                      isToday ? "border-primary/60" : "border-transparent hover:bg-surface-2/40"}`}
                  style={!isSelected && h ? scoreCellStyle(score) : undefined}>
                  <span className={`font-semibold ${isToday && !isSelected ? "text-primary" : h ? "text-foreground" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  {h && (
                    <div className="text-[8px] font-mono mt-0.5 text-muted-foreground">{score}/4</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-4 pb-4 pt-2 flex items-center gap-2 flex-wrap border-t border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score:</span>
            {[
              ["4/4", "oklch(0.78 0.18 158)", "0.35"],
              ["3/4", "oklch(0.78 0.18 158)", "0.18"],
              ["2/4", "oklch(0.80 0.16 75)",  "0.18"],
              ["1/4", "oklch(0.68 0.22 18)",  "0.12"],
            ].map(([label, color, opacity]) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm border" style={{ background: `color-mix(in oklab, ${color} ${parseFloat(opacity)*100}%, transparent)`, borderColor: `color-mix(in oklab, ${color} 30%, transparent)` }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — habit inputs */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold">
                {selected === today && <span className="text-primary">Hoy · </span>}
                <span className="capitalize">{new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Registra tus métricas de bienestar</div>
            </div>
          </div>

          <div className="space-y-5">
            {CORE_HABITS.map(h => {
              const val = values[h.key] ?? 0;
              const pct = Math.min(100, (val / h.max) * 100);
              const good = h.inverse ? val === 0 : val >= h.max * 0.5;
              const Icon = h.icon;
              return (
                <div key={h.key} className="rounded-xl border border-border bg-surface-2/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 grid place-items-center rounded-lg border"
                        style={{
                          background: `color-mix(in oklab, ${h.tone} 15%, transparent)`,
                          borderColor: `color-mix(in oklab, ${h.tone} 30%, transparent)`,
                          color: h.tone,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{h.label}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Objetivo: {h.target}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setValues(v => ({ ...v, [h.key]: Math.max(0, (v[h.key]??0)-1) }))}
                        className="w-7 h-7 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition text-sm font-bold">−</button>
                      <span className={`font-mono text-lg font-bold w-14 text-center ${good ? "text-success" : h.inverse && val > 0 ? "text-warning" : "text-foreground"}`}>
                        {val}<span className="text-xs font-normal text-muted-foreground">{h.unit}</span>
                      </span>
                      <button onClick={() => setValues(v => ({ ...v, [h.key]: Math.min(h.max, (v[h.key]??0)+1) }))}
                        className="w-7 h-7 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition text-sm font-bold">+</button>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: h.inverse
                          ? val === 0 ? "oklch(0.78 0.18 158)" : "oklch(0.80 0.16 75)"
                          : good ? h.tone : "oklch(0.65 0.04 250)",
                        boxShadow: good && !h.inverse ? `0 0 8px ${h.tone}` : (h.inverse && val === 0 ? `0 0 8px oklch(0.78 0.18 158)` : "none"),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntuación del día</span>
              <div className="flex items-center gap-1.5">
                {Array.from({length:4}).map((_,i) => {
                  const checks = [
                    (values.sueno??0) >= 7,
                    (values.ejercicio??0) >= 30,
                    (values.meditacion??0) >= 10,
                    (values.alcohol??0) === 0,
                  ];
                  const ok = checks[i];
                  return (
                    <div key={i} className={`w-6 h-6 rounded-md border flex items-center justify-center transition ${
                      ok ? "bg-success border-success shadow-[0_0_8px_oklch(0.78_0.18_158/0.5)]" : "border-border bg-surface-2/40"
                    }`}>
                      {ok && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                  );
                })}
                <span className={`ml-2 font-mono font-bold text-base ${todayScore === 4 ? "text-success" : todayScore >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                  {todayScore}/4
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
