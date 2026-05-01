import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Trade } from "@/lib/types";

export const Route = createFileRoute("/app/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario · Tradync" },
      { name: "description", content: "Vista mensual de tus operaciones con P&L diario." },
    ],
  }),
  component: CalendarioPage,
});

const DAYS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function CalendarioPage() {
  const { trades: { trades } } = useApp();
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);

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

        {/* Side panel */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden h-fit">
          {!selected ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 mx-auto mb-3 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-semibold mb-1">Selecciona un día</div>
              <div className="text-xs text-muted-foreground">Para ver el detalle de operaciones</div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-border">
                <div className="font-semibold text-sm capitalize">
                  {new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{selectedTrades.length} operación{selectedTrades.length !== 1 ? "es" : ""}</div>
              </div>
              {selectedTrades.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Sin operaciones este día</div>
              ) : (
                <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                  {selectedTrades.map(t => {
                    const pos = (t.resultado??0) >= 0;
                    return (
                      <div key={t.id} className="px-5 py-3 hover:bg-surface-2/40 transition">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              t.tipo === "BUY"
                                ? "text-success border-success/30 bg-success/10"
                                : "text-destructive border-destructive/30 bg-destructive/10"
                            }`}>{t.tipo}</span>
                            <span className="font-semibold text-sm">{t.instrumento}</span>
                          </div>
                          <span className={`font-mono font-bold text-sm ${pos?"text-success":"text-destructive"}`}>
                            {pos?"+":"-"}${Math.abs(t.resultado??0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {t.sesion && <span>{t.sesion}</span>}
                          {t.emocion && <span>· {t.emocion}</span>}
                          {t.rr != null && <span className="font-mono">· RR {t.rr >= 0?"+":""}{t.rr.toFixed(2)}R</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedTrades.filter(t => t.resultado!=null).length > 0 && (
                <div className="px-5 py-3.5 border-t border-border bg-surface-2/30">
                  {(() => {
                    const pnl = selectedTrades.reduce((s,t)=>s+(t.resultado??0),0);
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total del día</span>
                        <span className={`font-mono font-bold text-base ${pnl>=0?"text-success":"text-destructive"}`}>
                          {pnl>=0?"+":"-"}${Math.abs(pnl).toFixed(2)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
