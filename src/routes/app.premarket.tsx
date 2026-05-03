import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Sunrise, ChevronLeft, ChevronRight, Check, Save, TrendingUp, TrendingDown,
  Minus, Target, ShieldAlert, FileText, Settings, Plus, Pencil, Trash2,
  X, ArrowUp, ArrowDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useChecklistConfig } from "@/hooks/useChecklistConfig";
import { ConfirmModal } from "@/components/ConfirmModal";

export const Route = createFileRoute("/app/premarket")({ component: PremarketPage });

const SESGO_OPTIONS = [
  { key: "Alcista", Icon: TrendingUp,   tone: "oklch(0.78 0.18 158)" },
  { key: "Bajista", Icon: TrendingDown, tone: "oklch(0.68 0.22 18)" },
  { key: "Neutral", Icon: Minus,        tone: "oklch(0.65 0.02 250)" },
];
const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function PremarketPage() {
  const { user, premarket: { plans, checklistState, load, savePlan, saveChecklist, getPlan, getChecklist } } = useApp();
  const clConfig = useChecklistConfig(user?.id ?? null);

  const today = new Date().toISOString().slice(0, 10);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [month, setMonth]       = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [checks, setChecks]     = useState<boolean[]>([]);
  const [sesgo, setSesgo]       = useState("");
  const [niveles, setNiveles]   = useState("");
  const [noHacer, setNoHacer]   = useState("");
  const [notas, setNotas]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // Config panel state
  const [showConfig, setShowConfig]   = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editText, setEditText]       = useState("");
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  useEffect(() => {
    load(year, month);
    clConfig.load();
  }, [year, month]);

  // Sync checks array size when config changes
  useEffect(() => {
    const cl = getChecklist(selectedDate);
    setChecks(clConfig.items.map((_, i) => cl[i] ?? false));
  }, [selectedDate, plans, checklistState, clConfig.items]);

  useEffect(() => {
    const plan = getPlan(selectedDate);
    setSesgo(plan?.sesgo ?? "");
    setNiveles(plan?.niveles ?? "");
    setNoHacer(plan?.no_hacer ?? "");
    setNotas(plan?.notas ?? "");
  }, [selectedDate, plans]);

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
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const checkedCount = checks.filter(Boolean).length;
  const totalItems   = clConfig.items.length;
  const progressPct  = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  const isReady      = totalItems > 0 && checkedCount === totalItems;

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,"0")}`;
    const monthPlans = plans.filter((p: any) => p.fecha?.startsWith(prefix));
    const monthCl    = Object.entries(checklistState).filter(([k]) => k.startsWith(prefix));
    const fullDays   = monthCl.filter(([_, cl]: any) => (cl as boolean[]).filter(Boolean).length === totalItems).length;
    return { plans: monthPlans.length, fullDays };
  }, [plans, checklistState, year, month, totalItems]);

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    await clConfig.addItem(newItemText);
    setNewItemText("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await clConfig.updateItem(editingId, editText);
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Sunrise className="h-3.5 w-3.5 text-primary" /> Pre-Market Routine
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Plan del Día</h1>
          <p className="text-sm text-muted-foreground mt-1">La diferencia entre operar y especular: tu plan, escrito y verificado.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(v => !v)}
            className={`h-9 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition ${showConfig ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:bg-surface text-muted-foreground hover:text-foreground"}`}>
            <Settings className="h-4 w-4" /> Mi checklist
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50">
            {saved ? <><Check className="h-4 w-4" />Guardado</> : saving ? "Guardando…" : <><Save className="h-4 w-4" />Guardar plan</>}
          </button>
        </div>
      </div>

      {/* ── CHECKLIST CONFIG PANEL ── */}
      {showConfig && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">Personaliza tu checklist pre-market</div>
            <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div className="space-y-2">
            {clConfig.items.map((item, idx) => (
              <div key={item.id} className="rounded-xl border border-border bg-card/60 p-3">
                {editingId === item.id ? (
                  <div className="flex gap-2">
                    <input value={editText} onChange={e => setEditText(e.target.value)}
                      className="flex-1 bg-surface/80 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={e => e.key === "Enter" && handleSaveEdit()}
                      autoFocus />
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-surface transition">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-mono w-5 text-center shrink-0">{idx + 1}</span>
                    <span className="flex-1 text-sm">{item.text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => clConfig.moveItem(item.id, 'up')} disabled={idx === 0}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition disabled:opacity-30">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => clConfig.moveItem(item.id, 'down')} disabled={idx === clConfig.items.length - 1}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition disabled:opacity-30">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setEditingId(item.id); setEditText(item.text); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add new item */}
          <div className="flex gap-2">
            <input
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddItem()}
              placeholder="Nuevo ítem del checklist…"
              className="flex-1 bg-surface/80 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            <button onClick={handleAddItem} disabled={!newItemText.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Añadir
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Planes este mes",     value: String(monthStats.plans),          tone: "text-info" },
          { label: "Días 100% checklist", value: String(monthStats.fullDays),       tone: "text-success" },
          { label: "Ítems hoy",           value: `${checkedCount}/${totalItems}`,   tone: isReady ? "text-success" : "text-warning" },
          { label: "Estado",              value: isReady ? "READY ✓" : "PENDIENTE", tone: isReady ? "text-success" : "text-warning" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
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
              const hasPlan  = !!getPlan(dateStr);
              const cl       = getChecklist(dateStr);
              const clCount  = cl.filter(Boolean).length;
              const isFull   = totalItems > 0 && clCount === totalItems;
              const isToday    = dateStr === today;
              const isSelected = dateStr === selectedDate;
              return (
                <button key={i} onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition relative
                    ${isSelected ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_oklch(var(--primary)/0.6)]" :
                      isToday ? "border border-primary text-primary" :
                      isFull ? "bg-success/15 border border-success/30 text-foreground" :
                      hasPlan ? "bg-surface-2/60 text-foreground" :
                      "hover:bg-surface-2/40 text-muted-foreground"}`}>
                  <span className="font-semibold">{day}</span>
                  {clCount > 0 && !isSelected && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {Array.from({length: Math.min(clCount, 4)}).map((_,j) =>
                        <div key={j} className={`w-1 h-1 rounded-full ${isFull ? "bg-success" : "bg-primary/60"}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-4 pb-4 border-t border-border pt-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progreso del día</span>
              <span className="font-mono font-bold">{checkedCount}/{totalItems}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%`, boxShadow: progressPct > 0 ? "0 0 8px oklch(var(--primary))" : "none" }} />
            </div>
          </div>
        </div>

        {/* Right panels */}
        <div className="space-y-4 xl:contents">
          <div className="text-sm font-semibold text-muted-foreground xl:col-span-2">
            {selectedDate === today && <span className="text-primary">Hoy · </span>}
            <span className="capitalize">{new Date(selectedDate+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}</span>
          </div>
          <div className="space-y-4 xl:space-y-0">

          {/* Checklist */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Checklist Pre-Market
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isReady ? "text-success bg-success/10 border-success/25" : "text-warning bg-warning/10 border-warning/25"
              }`}>{isReady ? "READY ✓" : `${checkedCount}/${totalItems}`}</span>
            </div>

            {clConfig.items.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <div className="text-3xl mb-2">📋</div>
                No tienes ítems en el checklist. Pulsa "Mi checklist" para añadir.
              </div>
            ) : (
              <div className="space-y-2">
                {clConfig.items.map((item, i) => (
                  <button key={item.id} onClick={() => toggleCheck(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition group ${
                      checks[i] ? "bg-success/8 border-success/25" : "bg-surface-2/40 border-border hover:border-primary/30"
                    }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                      checks[i] ? "bg-success border-success shadow-[0_0_8px_oklch(0.78_0.18_158/0.5)]" : "border-muted-foreground/40 group-hover:border-primary/60"
                    }`}>
                      {checks[i] && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm transition ${checks[i] ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Plan del día */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5 space-y-5">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Plan del día
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Sesgo del día</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {SESGO_OPTIONS.map(s => {
                  const isActive = sesgo.startsWith(s.key);
                  const Icon = s.Icon;
                  return (
                    <button key={s.key} type="button" onClick={() => setSesgo(s.key)}
                      className={`h-11 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${
                        isActive ? "border-primary/50 bg-primary/10" : "border-border bg-surface-2/40 text-muted-foreground hover:border-primary/30"
                      }`}
                      style={isActive ? { color: s.tone, borderColor: `color-mix(in oklab,${s.tone} 50%,transparent)`, background: `color-mix(in oklab,${s.tone} 12%,transparent)` } : undefined}>
                      <Icon className="h-3.5 w-3.5" /> {s.key}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Niveles clave
              </label>
              <textarea value={niveles} onChange={e => setNiveles(e.target.value)} rows={2}
                placeholder="Soporte 1.0820 · Resistencia 1.0850 · Pivot 1.0835…"
                className="mt-2 w-full bg-surface-2/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none font-mono" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3 text-destructive" /> Lo que NO voy a hacer
              </label>
              <textarea value={noHacer} onChange={e => setNoHacer(e.target.value)} rows={2}
                placeholder="No operar en la apertura · No entrar sin confirmación…"
                className="mt-2 w-full bg-surface-2/40 border border-destructive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40 placeholder:text-muted-foreground resize-none" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Notas adicionales
              </label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                placeholder="Contexto macro, eventos importantes, sesiones a evitar…"
                className="mt-2 w-full bg-surface-2/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none" />
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        title="¿Eliminar ítem?"
        message="Se eliminará este ítem del checklist. Los registros históricos no se borrarán."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => { if (deleteId) await clConfig.removeItem(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
