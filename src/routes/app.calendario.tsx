import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Activity, Target, BookOpen, ClipboardList, Heart, Brain, CheckCircle2,
  XCircle, AlertTriangle, Smile, Sparkles, Percent, DollarSign,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Trade } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/app/calendario")({
    component: CalendarioPage,
});

const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function CalendarioPage() {
  const { trades: { trades }, diario, premarket, habits } = useApp();
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  // Cargar datos del mes (premarket + hábitos) cuando cambia mes/año
  useEffect(() => {
    premarket.load(year, month);
    habits.load(year, month);
    // diario ya se carga global
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const today = new Date().toISOString().slice(0, 10);

  const byDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach(t => {
      const dateKey = (t.fecha ?? "").slice(0, 10);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [trades]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells  = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const monthTrades = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,"0")}`;
    return trades.filter(t => (t.fecha ?? '').slice(0,10).startsWith(prefix) && t.resultado != null);
  }, [trades, year, month]);

  const monthPnl  = monthTrades.reduce((s,t) => s+(t.resultado??0), 0);
  const monthWins = monthTrades.filter(t => (t.resultado??0) > 0).length;
  const monthWR   = monthTrades.length > 0 ? Math.round(monthWins/monthTrades.length*100) : 0;
  const greenDays = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,"0")}`;
    let g = 0;
    Object.entries(byDate).forEach(([d, ts]) => {
      if (d.startsWith(prefix)) {
        const pnl = ts.reduce((s,t)=>s+(t.resultado??0),0);
        if (pnl > 0) g++;
      }
    });
    return g;
  }, [byDate, year, month]);

  // Max abs day pnl para escalar opacidad
  const maxAbsDayPnl = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,"0")}`;
    let max = 1;
    Object.entries(byDate).forEach(([d, ts]) => {
      if (d.startsWith(prefix)) {
        const pnl = Math.abs(ts.reduce((s,t)=>s+(t.resultado??0),0));
        if (pnl > max) max = pnl;
      }
    });
    return max;
  }, [byDate, year, month]);

  const selectedTrades = selected ? (byDate[selected] ?? []) : [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Performance Calendar
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista mensual de tus operaciones con P&L diario.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Operaciones",  value: String(monthTrades.length),                                    Icon: Activity,    tone: "text-info" },
          { label: "Win rate",     value: `${monthWR}%`,                                                 Icon: Target,      tone: monthWR >= 50 ? "text-success" : "text-warning" },
          { label: "Días verdes",  value: String(greenDays),                                             Icon: TrendingUp,  tone: "text-success" },
          { label: "P&L del mes",  value: `${monthPnl >= 0 ? "+" : "-"}$${Math.abs(monthPnl).toFixed(0)}`, Icon: monthPnl >= 0 ? TrendingUp : TrendingDown, tone: monthPnl >= 0 ? "text-success" : "text-destructive" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 ${s.tone}`}>
              <s.Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold font-mono ${s.tone}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
              className="p-2 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-base font-semibold">{MONTHS[month]} {year}</div>
            <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
              className="p-2 rounded-lg hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {DAYS.map(d => <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5 p-3">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayTrades = byDate[dateStr] ?? [];
              const closedTrades = dayTrades.filter(t => t.resultado != null);
              const pnl = closedTrades.reduce((s,t) => s+(t.resultado??0), 0);
              const isPos    = pnl > 0;
              const isNeg    = pnl < 0;
              const isToday  = dateStr === today;
              const isSel    = dateStr === selected;
              const hasData  = dayTrades.length > 0;
              const intensity = hasData ? Math.max(0.18, Math.min(0.55, Math.abs(pnl) / maxAbsDayPnl * 0.55)) : 0;
              const baseColor = isPos ? "oklch(0.78 0.18 158)" : isNeg ? "oklch(0.68 0.22 18)" : "oklch(0.65 0.04 250)";

              return (
                <button key={i} onClick={() => setSelected(isSel ? null : dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition relative border
                    ${isSel ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary" :
                      isToday ? "border-primary/60" : "border-transparent hover:border-primary/30"}`}
                  style={hasData && !isSel ? {
                    background: `color-mix(in oklab, ${baseColor} ${intensity * 100}%, transparent)`,
                    borderColor: `color-mix(in oklab, ${baseColor} ${intensity * 60}%, transparent)`,
                  } : undefined}>
                  <span className={`font-semibold ${isToday && !isSel ? "text-primary" : hasData ? "text-foreground" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  {hasData && (
                    <>
                      <span className={`text-[9px] font-mono font-bold leading-none ${isPos?"text-success":isNeg?"text-destructive":"text-muted-foreground"}`}>
                        {isPos?"+":isNeg?"-":""}{Math.abs(pnl).toFixed(0)}
                      </span>
                      <div className="flex gap-0.5 mt-0.5">
                        {dayTrades.slice(0,5).map((t,j) => (
                          <div key={j} className={`w-1 h-1 rounded-full ${(t.resultado??0)>0?"bg-success":(t.resultado??0)<0?"bg-destructive":"bg-muted-foreground"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel — Day Detail */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden h-fit max-h-[calc(100vh-180px)] flex flex-col">
          {!selected ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 mx-auto mb-3 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-semibold mb-1">Selecciona un día</div>
              <div className="text-xs text-muted-foreground">
                Para ver el detalle completo: operaciones, diario, premarket, hábitos y psicología.
              </div>
            </div>
          ) : (() => {
            const closed = selectedTrades.filter(t => t.resultado != null);
            const dayPnl = closed.reduce((s,t)=>s+(t.resultado??0),0);
            const dayWins = closed.filter(t => (t.resultado??0) > 0).length;
            const dayWR = closed.length ? Math.round(dayWins/closed.length*100) : 0;
            const bestT = closed.length ? Math.max(...closed.map(t=>t.resultado??0)) : 0;
            const worstT = closed.length ? Math.min(...closed.map(t=>t.resultado??0)) : 0;
            const avgRR = closed.filter(t=>t.rr!=null).reduce((s,t)=>s+(t.rr??0),0) / (closed.filter(t=>t.rr!=null).length || 1);
            const avgConf = closed.filter(t=>t.disciplina!=null).reduce((s,t)=>s+(t.disciplina??0),0) / (closed.filter(t=>t.disciplina!=null).length || 1);

            const diaryEntry = diario.getForDate(selected);
            const planEntry = premarket.getPlan(selected);
            const checklistState = premarket.getChecklist(selected);
            const habitEntry = habits.getForDate(selected);

            // Emociones agregadas
            const emoCount: Record<string, number> = {};
            const emoPnl: Record<string, number> = {};
            closed.forEach(t => {
              if (t.emocion) {
                emoCount[t.emocion] = (emoCount[t.emocion] ?? 0) + 1;
                emoPnl[t.emocion] = (emoPnl[t.emocion] ?? 0) + (t.resultado ?? 0);
              }
            });
            const emociones = Object.entries(emoCount).sort((a,b)=>b[1]-a[1]);

            return (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 sticky top-0 bg-surface/95 backdrop-blur-xl z-10">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm capitalize truncate">
                      {new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {closed.length} op · {selectedTrades.length - closed.length > 0 ? `${selectedTrades.length - closed.length} abierta(s)` : "todas cerradas"}
                    </div>
                  </div>
                  <div className={`text-right shrink-0`}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">P&L</div>
                    <div className={`font-mono font-bold text-sm ${dayPnl>=0?"text-success":"text-destructive"}`}>
                      {dayPnl>=0?"+":"-"}${Math.abs(dayPnl).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-border">
                  {/* === STATS DEL DÍA === */}
                  {closed.length > 0 && (
                    <section className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-3.5 w-3.5 text-info" />
                        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Stats del día</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { l: "Win rate", v: `${dayWR}%`, Icon: Target, tone: dayWR>=50?"text-success":"text-warning" },
                          { l: "Avg RR", v: `${avgRR>=0?"+":""}${avgRR.toFixed(2)}R`, Icon: Percent, tone: avgRR>=0?"text-success":"text-destructive" },
                          { l: "Mejor", v: `+$${bestT.toFixed(0)}`, Icon: TrendingUp, tone: "text-success" },
                          { l: "Peor", v: `-$${Math.abs(worstT).toFixed(0)}`, Icon: TrendingDown, tone: "text-destructive" },
                          { l: "Disciplina", v: avgConf ? `${avgConf.toFixed(1)}/10` : "—", Icon: Sparkles, tone: "text-primary" },
                          { l: "Wins/Loss", v: `${dayWins}/${closed.length-dayWins}`, Icon: DollarSign, tone: "text-info" },
                        ].map(s => (
                          <div key={s.l} className="rounded-xl border border-border bg-surface-2/40 p-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                              <s.Icon className="h-3 w-3" />{s.l}
                            </div>
                            <div className={`font-mono font-bold text-sm ${s.tone}`}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* === OPERACIONES === */}
                  {selectedTrades.length > 0 && (
                    <section className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Operaciones</span>
                        </div>
                        <Link to="/app/operaciones" className="text-[10px] text-primary hover:underline">Ver todas →</Link>
                      </div>
                      <div className="space-y-1.5">
                        {selectedTrades.map(t => {
                          const pos = (t.resultado??0) >= 0;
                          return (
                            <div key={t.id} className="rounded-xl border border-border bg-surface-2/30 px-3 py-2 hover:bg-surface-2/60 transition">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                    t.tipo === "BUY" ? "text-success border-success/30 bg-success/10" : "text-destructive border-destructive/30 bg-destructive/10"
                                  }`}>{t.tipo}</span>
                                  <span className="font-semibold text-xs truncate">{t.instrumento}</span>
                                </div>
                                {t.resultado != null && (
                                  <span className={`font-mono font-bold text-xs ${pos?"text-success":"text-destructive"}`}>
                                    {pos?"+":"-"}${Math.abs(t.resultado).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                                {t.sesion && <span>{t.sesion}</span>}
                                {t.emocion && <span>· {t.emocion}</span>}
                                {t.rr != null && <span className="font-mono">· RR {t.rr>=0?"+":""}{t.rr.toFixed(2)}</span>}
                                {t.setup && <span>· {t.setup}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* === PRE-MARKET === */}
                  <section className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-3.5 w-3.5 text-info" />
                        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Pre-Market</span>
                      </div>
                      <Link to="/app/premarket" className="text-[10px] text-primary hover:underline">Editar →</Link>
                    </div>
                    {!planEntry && checklistState.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground italic">Sin plan registrado este día</div>
                    ) : (
                      <div className="space-y-2">
                        {planEntry?.sesgo && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sesgo:</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              planEntry.sesgo === "Alcista" ? "text-success border-success/30 bg-success/10" :
                              planEntry.sesgo === "Bajista" ? "text-destructive border-destructive/30 bg-destructive/10" :
                              "text-muted-foreground border-border bg-surface-2"
                            }`}>{planEntry.sesgo}</span>
                          </div>
                        )}
                        {planEntry?.niveles && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Niveles</div>
                            <div className="text-[11px] text-foreground/90 font-mono leading-relaxed">{planEntry.niveles}</div>
                          </div>
                        )}
                        {planEntry?.no_hacer && (
                          <div className="rounded-lg border border-warning/30 bg-warning/5 p-2 flex gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                            <div className="text-[11px] text-foreground/90">{planEntry.no_hacer}</div>
                          </div>
                        )}
                        {checklistState.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Checklist:</span>
                            <div className="flex items-center gap-1">
                              {checklistState.map((c,i) => c
                                ? <CheckCircle2 key={i} className="h-3 w-3 text-success" />
                                : <XCircle key={i} className="h-3 w-3 text-muted-foreground/40" />
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground ml-1">
                              {checklistState.filter(Boolean).length}/{checklistState.length}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* === DIARIO === */}
                  <section className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Diario</span>
                      </div>
                      <Link to="/app/diario" className="text-[10px] text-primary hover:underline">Editar →</Link>
                    </div>
                    {!diaryEntry ? (
                      <div className="text-[11px] text-muted-foreground italic">Sin entrada de diario</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {diaryEntry.emocion && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary">
                              {diaryEntry.emocion}
                            </span>
                          )}
                          {diaryEntry.confianza != null && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Confianza: <span className="text-foreground font-bold">{diaryEntry.confianza}/10</span>
                            </span>
                          )}
                        </div>
                        {diaryEntry.contenido && (
                          <div className="rounded-lg border border-border bg-surface-2/40 p-2.5 text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-6">
                            {diaryEntry.contenido}
                          </div>
                        )}
                        {diaryEntry.tags && diaryEntry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {diaryEntry.tags.map((t,i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* === HÁBITOS === */}
                  <section className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Hábitos</span>
                      </div>
                      <Link to="/app/habitos" className="text-[10px] text-primary hover:underline">Editar →</Link>
                    </div>
                    {!habitEntry ? (
                      <div className="text-[11px] text-muted-foreground italic">Sin registro de hábitos</div>
                    ) : (
                      <>
                        {habitEntry.puntuacion != null && (
                          <div className="mb-2 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Puntuación</span>
                            <span className="font-mono font-bold text-sm text-primary">{habitEntry.puntuacion}/4</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { k: "sueno", l: "Sueño", u: "h" },
                            { k: "ejercicio", l: "Ejercicio", u: "min" },
                            { k: "meditacion", l: "Meditación", u: "min" },
                            { k: "alcohol", l: "Alcohol", u: "ud" },
                          ].map(h => {
                            const v = (habitEntry as any)[h.k];
                            return (
                              <div key={h.k} className="rounded-lg border border-border bg-surface-2/40 px-2 py-1.5">
                                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{h.l}</div>
                                <div className="font-mono text-xs font-semibold">{v ?? 0} <span className="text-[9px] text-muted-foreground">{h.u}</span></div>
                              </div>
                            );
                          })}
                          {habitEntry.habitos_extra && Object.entries(habitEntry.habitos_extra).map(([k,v]) => (
                            <div key={k} className="rounded-lg border border-border bg-surface-2/40 px-2 py-1.5">
                              <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{k}</div>
                              <div className="font-mono text-xs font-semibold">{String(v)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>

                  {/* === PSICOLOGÍA === */}
                  {(emociones.length > 0 || avgConf > 0) && (
                    <section className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Psicología</span>
                        </div>
                        <Link to="/app/psicologia" className="text-[10px] text-primary hover:underline">Ver →</Link>
                      </div>
                      <div className="space-y-2">
                        {emociones.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Smile className="h-3 w-3" />Emociones operadas
                            </div>
                            <div className="space-y-1">
                              {emociones.map(([emo, count]) => {
                                const pnl = emoPnl[emo] ?? 0;
                                return (
                                  <div key={emo} className="flex items-center justify-between rounded-lg border border-border bg-surface-2/40 px-2.5 py-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-semibold">{emo}</span>
                                      <span className="text-[10px] text-muted-foreground">×{count}</span>
                                    </div>
                                    <span className={`font-mono text-[11px] font-bold ${pnl>=0?"text-success":"text-destructive"}`}>
                                      {pnl>=0?"+":"-"}${Math.abs(pnl).toFixed(0)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {avgConf > 0 && (
                          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Disciplina media</span>
                            <span className="font-mono font-bold text-sm text-primary">{avgConf.toFixed(1)}/10</span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
