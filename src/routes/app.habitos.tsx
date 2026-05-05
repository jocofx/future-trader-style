import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Moon, Dumbbell, Brain, Wine,
  Save, Check, Flame, TrendingUp, Plus, Pencil, Trash2, X, Settings,
  ArrowUp, ArrowDown, ToggleLeft, ToggleRight,
} from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";
import { useHabitosConfig } from "@/hooks/useHabitosConfig";
import type { HabitConfig } from "@/hooks/useHabitosConfig";
import { ConfirmModal } from "@/components/ConfirmModal";

export const Route = createFileRoute("/app/habitos")({ component: HabitosPage });

const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
// Parse target string to get the threshold number
// Examples: "≥ 7h" → 7, "≥ 30min" → 30, "= 0" → 0, "≥ 6 vasos" → 6
function parseTarget(target: string, max: number): number {
  if (!target) return max * 0.5;
  const match = target.match(/[\d]+/);
  if (match) return Number(match[0]);
  return max * 0.5;
}

const ICONS  = ["🌙","💪","🧘","🍷","💧","🥗","📚","🎯","🏃","🛏️","🧠","💊","🚭","☀️","🏋️"];

const EMPTY_HABIT = { label: "", unit: "min", max: 60, target: "", inverse: false, icon: "🎯" };

function HabitosPage() {
  const { user, habits: { habits, load, save, getForDate } } = useApp();
  const config = useHabitosConfig(user?.id ?? null);

  const today = new Date().toISOString().slice(0, 10);
  const [year, setYear]     = useState(new Date().getFullYear());
  const [month, setMonth]   = useState(new Date().getMonth());
  const [selected, setSelected] = useState(today);
  const [values, setValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Config panel state
  const [showConfig, setShowConfig] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [newHabit, setNewHabit]     = useState({ ...EMPTY_HABIT });
  const [showAdd, setShowAdd]       = useState(false);
  const [editForm, setEditForm]     = useState<Partial<HabitConfig>>({});

  useEffect(() => { load(year, month); config.load(); }, [year, month]);

  useEffect(() => {
    const h = getForDate(selected);
    const vals: Record<string, number> = {};
    config.habits.forEach(c => { vals[c.id] = (h as any)?.[c.id] ?? 0; });
    setValues(vals);
  }, [selected, habits, config.habits]);

  const handleSave = async () => {
    setSaving(true);
    await save(selected, values);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getScore = (h: any) => {
    if (!h) return 0;
    return config.habits.filter(c =>
      c.inverse ? (h[c.id] ?? 0) === 0 : (h[c.id] ?? 0) >= parseTarget(c.target, c.max)
    ).length;
  };

  const maxScore = config.habits.length;

  const monthHabits = habits.filter(h => {
    const d = new Date((h as any).fecha ?? "");
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const streak = useMemo(() => {
    let s = 0;
    const sorted = [...habits].sort((a: any, b: any) => b.fecha.localeCompare(a.fecha));
    for (const h of sorted) { if (getScore(h) >= Math.ceil(maxScore * 0.75)) s++; else break; }
    return s;
  }, [habits, config.habits]);

  const todayScore = useMemo(() => config.habits.filter(c =>
    c.inverse ? (values[c.id] ?? 0) === 0 : (values[c.id] ?? 0) >= parseTarget(c.target, c.max)
  ).length, [values, config.habits]);

  // Calendar
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const scoreCellStyle = (s: number, max: number) => {
    const pct = max > 0 ? s / max : 0;
    if (pct >= 1)   return { background: "color-mix(in oklab,oklch(0.78 0.18 158) 35%,transparent)", borderColor: "color-mix(in oklab,oklch(0.78 0.18 158) 50%,transparent)" };
    if (pct >= 0.75) return { background: "color-mix(in oklab,oklch(0.78 0.18 158) 18%,transparent)", borderColor: "color-mix(in oklab,oklch(0.78 0.18 158) 30%,transparent)" };
    if (pct >= 0.5)  return { background: "color-mix(in oklab,oklch(0.80 0.16 75) 18%,transparent)",  borderColor: "color-mix(in oklab,oklch(0.80 0.16 75) 30%,transparent)" };
    if (pct >= 0.25) return { background: "color-mix(in oklab,oklch(0.68 0.22 18) 12%,transparent)",  borderColor: "color-mix(in oklab,oklch(0.68 0.22 18) 25%,transparent)" };
    return {};
  };

  const handleStartEdit = (h: HabitConfig) => {
    setEditingId(h.id);
    setEditForm({ label: h.label, unit: h.unit, max: h.max, target: h.target, inverse: h.inverse, icon: h.icon });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.label?.trim()) return;
    await config.updateHabit(editingId, editForm);
    setEditingId(null);
  };

  const handleAddHabit = async () => {
    if (!newHabit.label.trim()) return;
    await config.addHabit(newHabit);
    setNewHabit({ ...EMPTY_HABIT });
    setShowAdd(false);
  };

  return (
    <PlanGate feature="habitos" plan="basic">   <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Wellness · Bienestar diario
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hábitos del Trader</h1>
          <p className="text-sm text-muted-foreground mt-1">Tu rendimiento empieza fuera del gráfico.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(v => !v)}
            className={`h-9 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition ${showConfig ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:bg-surface text-muted-foreground hover:text-foreground"}`}>
            <Settings className="h-4 w-4" /> Mis hábitos
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50">
            {saved ? <><Check className="h-4 w-4" />Guardado</> : saving ? "Guardando…" : <><Save className="h-4 w-4" />Guardar día</>}
          </button>
        </div>
      </div>

      {/* ── CONFIG PANEL ── */}
      {showConfig && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">Gestiona tus hábitos personales</div>
            <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          {/* Existing habits */}
          <div className="space-y-2">
            {config.habits.map((h, idx) => (
              <div key={h.id} className="rounded-xl border border-border bg-card/60 p-3">
                {editingId === h.id ? (
                  /* Edit form */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre *</label>
                        <input value={editForm.label ?? ""} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                          className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Unidad</label>
                        <input value={editForm.unit ?? ""} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                          placeholder="h, min, u..." className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Máximo</label>
                        <input type="number" value={editForm.max ?? ""} onChange={e => setEditForm(f => ({ ...f, max: Number(e.target.value) }))}
                          className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Objetivo</label>
                        <input value={editForm.target ?? ""} onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))}
                          placeholder="≥ 7h" className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Icono</label>
                        <div className="flex gap-1 flex-wrap">
                          {ICONS.map(ic => (
                            <button key={ic} onClick={() => setEditForm(f => ({ ...f, icon: ic }))}
                              className={`w-8 h-8 rounded-lg border text-base flex items-center justify-center transition ${editForm.icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button onClick={() => setEditForm(f => ({ ...f, inverse: !f.inverse }))}
                          className="text-muted-foreground hover:text-primary transition">
                          {editForm.inverse ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <span className="text-xs text-muted-foreground">Menos = mejor (ej. alcohol)</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface transition">Cancelar</button>
                      <button onClick={handleSaveEdit} className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition">Guardar</button>
                    </div>
                  </div>
                ) : (
                  /* View row */
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{h.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{h.label}</div>
                      <div className="text-[11px] text-muted-foreground">Objetivo: {h.target} · Máx: {h.max}{h.unit} {h.inverse ? "· (menos = mejor)" : ""}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => config.moveHabit(h.id, 'up')} disabled={idx === 0}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition disabled:opacity-30">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => config.moveHabit(h.id, 'down')} disabled={idx === config.habits.length - 1}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition disabled:opacity-30">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleStartEdit(h)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(h.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add new habit */}
          {showAdd ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="text-sm font-semibold">Nuevo hábito</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre *</label>
                  <input value={newHabit.label} onChange={e => setNewHabit(h => ({ ...h, label: e.target.value }))}
                    placeholder="Lectura, Agua, Vitaminas..." className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Unidad</label>
                  <input value={newHabit.unit} onChange={e => setNewHabit(h => ({ ...h, unit: e.target.value }))}
                    placeholder="h, min, u, vasos..." className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Máximo</label>
                  <input type="number" value={newHabit.max} onChange={e => setNewHabit(h => ({ ...h, max: Number(e.target.value) }))}
                    className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Objetivo</label>
                  <input value={newHabit.target} onChange={e => setNewHabit(h => ({ ...h, target: e.target.value }))}
                    placeholder="≥ 30min" className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Icono</label>
                <div className="flex gap-1 flex-wrap">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setNewHabit(h => ({ ...h, icon: ic }))}
                      className={`w-8 h-8 rounded-lg border text-base flex items-center justify-center transition ${newHabit.icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setNewHabit(h => ({ ...h, inverse: !h.inverse }))} className="text-muted-foreground hover:text-primary transition">
                  {newHabit.inverse ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <span className="text-xs text-muted-foreground">Menos = mejor (ej. alcohol)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
                <button onClick={handleAddHabit} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition">Añadir hábito</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-primary/30 text-sm text-primary hover:bg-primary/5 transition flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Añadir nuevo hábito
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Días este mes", value: `${monthHabits.length}`, Icon: CheckCircle2, tone: "text-info" },
          { label: "Score medio",   value: monthHabits.length ? (monthHabits.reduce((s,h) => s+getScore(h),0)/monthHabits.length).toFixed(1)+"/"+maxScore : "—", Icon: TrendingUp, tone: "text-primary" },
          { label: "Racha actual",  value: `${streak}d`, Icon: Flame, tone: streak >= 3 ? "text-warning" : "text-muted-foreground" },
          { label: "Hoy",           value: `${todayScore}/${maxScore}`, Icon: Check, tone: todayScore === maxScore ? "text-success" : "text-warning" },
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
              className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4"/></button>
            <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
            <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4"/></button>
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
              const isToday = dateStr === today;
              const isSelected = dateStr === selected;
              return (
                <button key={i} onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition relative border
                    ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary" :
                      isToday ? "border-primary/60" : "border-transparent hover:bg-surface-2/40"}`}
                  style={!isSelected && h ? scoreCellStyle(score, maxScore) : undefined}>
                  <span className={`font-semibold ${isToday && !isSelected ? "text-primary" : h ? "text-foreground" : "text-muted-foreground"}`}>{day}</span>
                  {h && <div className="text-[8px] font-mono mt-0.5 text-muted-foreground">{score}/{maxScore}</div>}
                </button>
              );
            })}
          </div>
          <div className="px-4 pb-3 pt-2 border-t border-border">
            <div className="text-[10px] text-muted-foreground text-center">Toca un día para registrar tus hábitos</div>
          </div>
        </div>

        {/* Habit inputs */}
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

          {config.habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <div className="text-3xl mb-3">🎯</div>
              No tienes hábitos configurados. Pulsa "Mis hábitos" para añadir.
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-3">
              {config.habits.map(h => {
                const val = values[h.id] ?? 0;
                const pct = Math.min(100, (val / h.max) * 100);
                const good = h.inverse ? val === 0 : val >= parseTarget(h.target, h.max);
                return (
                  <div key={h.id} className="rounded-xl border border-border bg-surface-2/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 bg-surface/40 text-xl">{h.icon}</div>
                        <div>
                          <div className="text-sm font-semibold">{h.label}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">Objetivo: {h.target}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setValues(v => ({ ...v, [h.id]: Math.max(0, (v[h.id]??0)-1) }))}
                          className="w-7 h-7 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition text-sm font-bold">−</button>
                        <span className={`font-mono text-lg font-bold w-14 text-center ${good ? "text-success" : h.inverse && val > 0 ? "text-warning" : "text-foreground"}`}>
                          {val}<span className="text-xs font-normal text-muted-foreground">{h.unit}</span>
                        </span>
                        <button onClick={() => setValues(v => ({ ...v, [h.id]: Math.min(h.max, (v[h.id]??0)+1) }))}
                          className="w-7 h-7 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition text-sm font-bold">+</button>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: good ? "oklch(0.78 0.18 158)" : "oklch(0.65 0.04 250)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Score */}
          {config.habits.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntuación del día</span>
              <div className="flex items-center gap-1.5">
                {config.habits.map((h, i) => {
                  const ok = h.inverse ? (values[h.id]??0) === 0 : (values[h.id]??0) >= parseTarget(h.target, h.max);
                  return (
                    <div key={i} title={h.label} className={`w-6 h-6 rounded-md border flex items-center justify-center text-[11px] transition ${
                      ok ? "bg-success border-success" : "border-border bg-surface-2/40"
                    }`}>
                      {ok ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : h.icon}
                    </div>
                  );
                })}
                <span className={`ml-2 font-mono font-bold text-base ${todayScore === maxScore ? "text-success" : todayScore >= maxScore*0.5 ? "text-primary" : "text-muted-foreground"}`}>
                  {todayScore}/{maxScore}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        title="¿Eliminar hábito?"
        message="Se eliminará este hábito de tu seguimiento. Los registros históricos no se borrarán."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => { if (deleteId) await config.removeHabit(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
    </PlanGate>
  );
}
