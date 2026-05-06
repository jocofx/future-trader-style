import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { BookText, ChevronLeft, ChevronRight, Save, Trash2, Check, Search } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/diario")({ component: DiarioPage });

const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EMOCIONES = [
  { key: "😌 Sereno",    emoji: "😌" },
  { key: "💪 Motivado",  emoji: "💪" },
  { key: "🔥 Intenso",   emoji: "🔥" },
  { key: "😐 Neutral",   emoji: "😐" },
  { key: "😰 Ansioso",   emoji: "😰" },
  { key: "😤 Frustrado", emoji: "😤" },
  { key: "😟 Inseguro",  emoji: "😟" },
  { key: "🤩 Eufórico",  emoji: "🤩" },
];

function DiarioPage() {
  const { diario: { entries, load, save, getForDate } } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [month, setMonth]       = useState(new Date().getMonth());
  const [selected, setSelected] = useState(today);
  const [texto,    setTexto]    = useState("");
  const [leccion,  setLeccion]  = useState("");
  const [energia,  setEnergia]  = useState(7);
  const [emociones, setEmociones] = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [search,   setSearch]   = useState("");

  useEffect(() => { load(365); }, []);

  useEffect(() => {
    const e = getForDate(selected);
    setTexto(e?.texto ?? "");
    setLeccion(e?.leccion ?? "");
    setEnergia(e?.energia ?? 7);
    setEmociones(Array.isArray(e?.emociones) ? e.emociones : []);
  }, [selected, entries]);

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta entrada del diario? No se puede deshacer.")) return;
    // Clear all fields and save empty entry (soft delete)
    await save(selected, { texto: "", leccion: "", energia: 5, emociones: [] });
    setTexto("");
    setLeccion("");
    setEnergia(5);
    setEmociones([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(selected, { texto, leccion, energia, emociones });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Diario save error:", e);
      alert("Error guardando: " + String(e));
    } finally { setSaving(false); }
  };

  const toggleEmocion = (key: string) => {
    setEmociones(prev =>
      prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
    );
  };

  // Calendar
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells  = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const filtered = useMemo(() => {
    if (!search) return entries.slice(0, 10);
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.texto?.toLowerCase().includes(q) ||
      e.leccion?.toLowerCase().includes(q) ||
      e.fecha.includes(q)
    ).slice(0, 15);
  }, [entries, search]);

  const stats = useMemo(() => {
    const monthKey = `${year}-${String(month+1).padStart(2,"0")}`;
    const m = entries.filter(e => e.fecha.startsWith(monthKey));
    const avgEnergia = m.length ? (m.reduce((s,e) => s + (e.energia ?? 0), 0) / m.length).toFixed(1) : "—";
    const allEmociones = m.flatMap(e => e.emociones ?? []);
    const map: Record<string,number> = {};
    allEmociones.forEach(em => { map[em] = (map[em] ?? 0) + 1; });
    const dominant = Object.entries(map).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "—";
    return { total: entries.length, monthEntries: m.length, avgEnergia, dominant };
  }, [entries, year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  return (
    <PlanGate feature="diario" plan="basic">   <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <BookText className="h-3.5 w-3.5 text-primary" /> Reflexión diaria
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Diario del Trader</h1>
          <p className="text-sm text-muted-foreground mt-1">Tu mente es tan importante como tu estrategia.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50">
          {saved ? <><Check className="h-4 w-4"/>Guardado</> : saving ? "Guardando…" : <><Save className="h-4 w-4"/>Guardar entrada</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Entradas totales",    value: stats.total.toString() },
          { label: "Este mes",            value: stats.monthEntries.toString() },
          { label: "Energía media/mes",   value: `${stats.avgEnergia}/10` },
          { label: "Emoción dominante",   value: stats.dominant },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface/60 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-lg font-bold mt-1 truncate">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Calendar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
            <div className="grid grid-cols-7 px-2 pt-2">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 p-2">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const entry = getForDate(dateStr);
                const isToday    = dateStr === today;
                const isSelected = dateStr === selected;
                return (
                  <button key={i} onClick={() => setSelected(dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition relative border
                      ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary bg-primary/10" :
                        isToday ? "border-primary/60 text-primary" :
                        entry ? "border-success/30 bg-success/8 text-foreground" :
                        "border-transparent hover:bg-surface-2/40 text-muted-foreground"}`}>
                    <span className="font-semibold">{day}</span>
                    {entry && (
                      <div className="text-[8px] mt-0.5">
                        {entry.emociones && entry.emociones.length > 0
                          ? entry.emociones[0].split(" ")[0]
                          : "✍️"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent entries */}
          <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en el diario…"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">Sin entradas</div>
              ) : filtered.map(e => (
                <button key={e.id} onClick={() => { setSelected(e.fecha); setMonth(new Date(e.fecha+"T12:00:00").getMonth()); setYear(new Date(e.fecha+"T12:00:00").getFullYear()); }}
                  className={`w-full text-left px-4 py-3 hover:bg-surface/50 transition ${selected === e.fecha ? "bg-primary/8 border-l-2 border-primary" : ""}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{e.fecha}</span>
                    <div className="flex items-center gap-1">
                      {e.emociones?.slice(0,2).map((em,i) => (
                        <span key={i} className="text-xs">{em.split(" ")[0]}</span>
                      ))}
                      {e.energia != null && (
                        <span className="text-[10px] font-mono text-muted-foreground">⚡{e.energia}</span>
                      )}
                    </div>
                  </div>
                  {e.texto && (
                    <div className="text-xs text-muted-foreground line-clamp-2">{e.texto}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Entry editor */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {selected === today && <span className="text-primary">Hoy · </span>}
                <span className="capitalize">{new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {getForDate(selected) ? "✍️ Tienes una entrada para este día" : "Sin entrada — escribe algo"}
              </div>
            </div>
          </div>

          {/* Emociones */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
              ¿Cómo te has sentido hoy?
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOCIONES.map(em => (
                <button key={em.key} onClick={() => toggleEmocion(em.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    emociones.includes(em.key)
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-surface-2/40 border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  {em.emoji} {em.key.split(" ")[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Energía */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Nivel de energía / confianza
              </label>
              <span className="text-lg font-bold font-mono text-primary">{energia}<span className="text-sm text-muted-foreground font-normal">/10</span></span>
            </div>
            <input type="range" min="1" max="10" value={energia} onChange={e => setEnergia(Number(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1 · Sin energía</span>
              <span>10 · Al máximo</span>
            </div>
          </div>

          {/* Texto principal */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
              Reflexión del día
            </label>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={6}
              placeholder="¿Cómo ha ido el día? ¿Qué has operado? ¿Cómo te has sentido con tus decisiones? ¿Has seguido tu plan?"
              className="w-full bg-surface-2/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none leading-relaxed" />
          </div>

          {/* Lección */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
              Lección aprendida
            </label>
            <textarea value={leccion} onChange={e => setLeccion(e.target.value)} rows={2}
              placeholder="Una frase, una regla, algo que no quieres olvidar de este día…"
              className="w-full bg-surface-2/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none" />
          </div>

          {texto.trim() && (
            <button onClick={handleDelete}
              className="h-10 px-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition flex items-center gap-1.5 text-sm">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saved ? <><Check className="h-4 w-4"/>Entrada guardada</> : saving ? "Guardando…" : <><Save className="h-4 w-4"/>Guardar entrada del día</>}
          </button>
        </div>
      </div>
    </div>
    </PlanGate>
  );
}
