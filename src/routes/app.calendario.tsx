import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Trade } from "@/lib/types";

export const Route = createFileRoute("/app/calendario")({
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

  // Group trades by date
  const byDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach(t => {
      if (!map[t.fecha]) map[t.fecha] = [];
      map[t.fecha].push(t);
    });
    return map;
  }, [trades]);

  // Calendar
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells  = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  // Month totals
  const monthTrades = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,"0")}`;
    return trades.filter(t => t.fecha.startsWith(prefix) && t.resultado != null);
  }, [trades, year, month]);

  const monthPnl  = monthTrades.reduce((s,t) => s+(t.resultado??0), 0);
  const monthWins = monthTrades.filter(t => (t.resultado??0) > 0).length;
  const monthWR   = monthTrades.length > 0 ? Math.round(monthWins/monthTrades.length*100) : 0;

  const selectedTrades = selected ? (byDate[selected] ?? []) : [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
            <p className="text-sm text-muted-foreground">Vista mensual de operaciones</p>
          </div>
        </div>
        {/* Month summary */}
        <div className="flex gap-3">
          {[
            { label:"Ops", value:monthTrades.length },
            { label:"WR",  value:monthWR+"%" },
            { label:"P&L", value:(monthPnl>=0?"+":"-")+"$"+Math.abs(monthPnl).toFixed(0), color:monthPnl>=0?"text-success":"text-destructive" },
          ].map(s => (
            <div key={s.label} className="text-center px-4 py-2 rounded-xl border border-border bg-card/60 backdrop-blur">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`font-mono font-bold mt-0.5 ${s.color ?? ""}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
              className="p-2 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-base font-semibold">{MONTHS[month]} {year}</div>
            <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
              className="p-2 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {DAYS.map(d => <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayTrades = byDate[dateStr] ?? [];
              const pnl = dayTrades.filter(t => t.resultado!=null).reduce((s,t) => s+(t.resultado??0), 0);
              const isPos    = pnl > 0;
              const isNeg    = pnl < 0;
              const isToday  = dateStr === today;
              const isSel    = dateStr === selected;
              const hasData  = dayTrades.length > 0;

              return (
                <button key={i} onClick={() => setSelected(isSel ? null : dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition relative
                    ${isSel ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                    ${isToday ? "border border-primary" : ""}
                    ${hasData && isPos && !isSel ? "bg-success/15" : ""}
                    ${hasData && isNeg && !isSel ? "bg-destructive/15" : ""}
                    ${!hasData && !isSel ? "hover:bg-surface/60" : ""}
                    ${isSel ? isPos ? "bg-success/20" : isNeg ? "bg-destructive/20" : "bg-surface" : ""}`}>
                  <span className={`font-semibold ${isToday ? "text-primary" : hasData ? "text-foreground" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  {hasData && (
                    <>
                      <span className={`text-[9px] font-mono font-bold ${isPos?"text-success":isNeg?"text-destructive":"text-muted-foreground"}`}>
                        {isPos?"+":isNeg?"-":""}{Math.abs(pnl).toFixed(0)}
                      </span>
                      <div className="flex gap-0.5">
                        {dayTrades.slice(0,4).map((_,j) => (
                          <div key={j} className={`w-1 h-1 rounded-full ${(_.resultado??0)>0?"bg-success":(_.resultado??0)<0?"bg-destructive":"bg-muted-foreground"}`} />
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
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden h-fit">
          {!selected ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-30" />
              Selecciona un día para ver sus operaciones
            </div>
          ) : (
            <>
              <div className="px-4 py-3.5 border-b border-border">
                <div className="font-semibold text-sm">
                  {new Date(selected+"T12:00:00").toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{selectedTrades.length} operaciones</div>
              </div>
              {selectedTrades.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Sin operaciones este día</div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedTrades.map(t => {
                    const pos = (t.resultado??0) >= 0;
                    return (
                      <div key={t.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${t.tipo==="BUY"?"text-success border-success/30 bg-success/10":"text-info border-info/30 bg-info/10"}`}>{t.tipo}</span>
                            <span className="font-semibold text-sm">{t.instrumento}</span>
                          </div>
                          <span className={`font-mono font-bold text-sm ${pos?"text-success":"text-destructive"}`}>
                            {pos?"+":"-"}${Math.abs(t.resultado??0).toFixed(2)}
                          </span>
                        </div>
                        {t.sesion && <div className="text-xs text-muted-foreground">{t.sesion}</div>}
                        {t.emocion && <div className="text-xs text-muted-foreground">Estado: {t.emocion}</div>}
                        {t.rr && <div className="text-xs text-muted-foreground font-mono">RR: {t.rr >= 0?"+":""}{t.rr.toFixed(2)}R</div>}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Day total */}
              {selectedTrades.filter(t => t.resultado!=null).length > 0 && (
                <div className="px-4 py-3 border-t border-border">
                  {(() => {
                    const pnl = selectedTrades.reduce((s,t)=>s+(t.resultado??0),0);
                    return (
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total del día</span>
                        <span className={pnl>=0?"text-success":"text-destructive"}>
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
