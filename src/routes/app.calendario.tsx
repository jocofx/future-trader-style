import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, Activity, X, Calendar as CalendarIcon,
} from "lucide-react";

export const Route = createFileRoute("/app/calendario")({
  component: CalendarioPage,
});

/* ───────── Synthetic data (deterministic by date) ───────── */
type DayData = { date: string; pl: number; trades: number; winRate: number; rMultiple: number };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateMonthData(year: number, month: number): Record<string, DayData> {
  const days = new Date(year, month + 1, 0).getDate();
  const out: Record<string, DayData> = {};
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // weekends off
    const r = rng(year * 10000 + (month + 1) * 100 + d);
    const skip = r() < 0.2;
    if (skip) continue;
    const trades = 1 + Math.floor(r() * 6);
    const winRate = Math.floor(40 + r() * 50);
    const isWin = r() > 0.38;
    const magnitude = Math.floor(r() * 800) + 50;
    const pl = isWin ? magnitude : -Math.floor(magnitude * 0.65);
    const rMultiple = Number(((isWin ? 1 : -1) * (0.4 + r() * 2.6)).toFixed(2));
    const key = date.toISOString().slice(0, 10);
    out[key] = { date: key, pl, trades, winRate, rMultiple };
  }
  return out;
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
type Filter = "all" | "wins" | "losses";

function CalendarioPage() {
  // Avoid SSR/CSR mismatch: date-dependent state initializes on the client only.
  const [today, setToday] = useState<Date | null>(null);
  const [cursor, setCursor] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<DayData | null>(null);

  useEffect(() => {
    const d = new Date();
    setToday(d);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  // Fallback for first SSR/CSR render — keeps hook order stable.
  const safeCursor = cursor ?? new Date(2026, 3, 1);
  const safeToday = today ?? safeCursor;

  const data = useMemo(() => generateMonthData(safeCursor.getFullYear(), safeCursor.getMonth()), [safeCursor]);

  const stats = useMemo(() => {
    const days = Object.values(data);
    const totalPL = days.reduce((a, d) => a + d.pl, 0);
    const wins = days.filter((d) => d.pl > 0);
    const losses = days.filter((d) => d.pl < 0);
    const totalTrades = days.reduce((a, d) => a + d.trades, 0);
    const bestDay = days.reduce<DayData | null>((b, d) => (!b || d.pl > b.pl ? d : b), null);
    const worstDay = days.reduce<DayData | null>((b, d) => (!b || d.pl < b.pl ? d : b), null);
    const winDayRate = days.length ? Math.round((wins.length / days.length) * 100) : 0;
    return { totalPL, wins: wins.length, losses: losses.length, totalTrades, bestDay, worstDay, winDayRate, tradedDays: days.length };
  }, [data]);

  const maxAbs = useMemo(() => {
    return Math.max(1, ...Object.values(data).map((d) => Math.abs(d.pl)));
  }, [data]);

  // Build calendar grid: weeks rows, days columns (Mon-first)
  const grid = useMemo(() => {
    const year = safeCursor.getFullYear();
    const month = safeCursor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: ({ d: number; key: string } | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ d, key: new Date(year, month, d).toISOString().slice(0, 10) });
    }
    while (cells.length % 7) cells.push(null);
    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [safeCursor]);

  const weekTotals = useMemo(() => {
    return grid.map((week) => {
      let pl = 0, trades = 0, days = 0;
      week.forEach((c) => {
        if (!c) return;
        const day = data[c.key];
        if (!day) return;
        pl += day.pl; trades += day.trades; days++;
      });
      return { pl, trades, days };
    });
  }, [grid, data]);

  const passesFilter = (d?: DayData) => {
    if (!d) return true;
    if (filter === "wins") return d.pl > 0;
    if (filter === "losses") return d.pl < 0;
    return true;
  };

  const goPrev = () => setCursor(new Date(safeCursor.getFullYear(), safeCursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(safeCursor.getFullYear(), safeCursor.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date(safeToday.getFullYear(), safeToday.getMonth(), 1));
  const isToday = (key: string) => key === safeToday.toISOString().slice(0, 10);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-mesh opacity-50" aria-hidden />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Performance mensual</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Calendario</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Heatmap de tu P&L diario · {stats.tradedDays} días con operaciones · {stats.totalTrades} trades este mes
            </p>
          </div>

          {/* Month navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="h-9 w-9 grid place-items-center rounded-lg glass hover:border-primary/40 transition"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[180px] text-center px-4 py-2 rounded-lg glass">
              <div className="text-sm font-semibold tracking-tight">{MONTHS[safeCursor.getMonth()]} {safeCursor.getFullYear()}</div>
            </div>
            <button
              onClick={goNext}
              className="h-9 w-9 grid place-items-center rounded-lg glass hover:border-primary/40 transition"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="ml-1 h-9 px-3 rounded-lg text-xs font-medium glass hover:border-primary/40 transition inline-flex items-center gap-1.5"
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Hoy
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="P&L del mes"
            value={`${stats.totalPL >= 0 ? "+" : "−"}$${Math.abs(stats.totalPL).toLocaleString()}`}
            tone={stats.totalPL >= 0 ? "success" : "destructive"}
            icon={stats.totalPL >= 0 ? TrendingUp : TrendingDown}
            sub={`${stats.wins}W · ${stats.losses}L días`}
          />
          <StatCard
            label="Win rate diario"
            value={`${stats.winDayRate}%`}
            tone="primary"
            icon={Target}
            sub={`${stats.wins} de ${stats.tradedDays} días positivos`}
          />
          <StatCard
            label="Mejor día"
            value={stats.bestDay ? `+$${stats.bestDay.pl.toLocaleString()}` : "—"}
            tone="success"
            icon={TrendingUp}
            sub={stats.bestDay ? formatShortDate(stats.bestDay.date) : "Sin datos"}
          />
          <StatCard
            label="Peor día"
            value={stats.worstDay ? `−$${Math.abs(stats.worstDay.pl).toLocaleString()}` : "—"}
            tone="destructive"
            icon={Activity}
            sub={stats.worstDay ? formatShortDate(stats.worstDay.date) : "Sin datos"}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Filtro</span>
          {([
            { k: "all", label: "Todos los días" },
            { k: "wins", label: "Solo ganadores" },
            { k: "losses", label: "Solo perdedores" },
          ] as { k: Filter; label: string }[]).map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                filter === f.k
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface/60 border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Pérdida</span>
            <div className="flex gap-1">
              {[0.9, 0.55, 0.25].map((o) => (
                <span key={`l${o}`} className="h-3 w-3 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--destructive) ${o * 100}%, transparent)` }} />
              ))}
              <span className="h-3 w-3 rounded-[3px] bg-surface-2" />
              {[0.25, 0.55, 0.9].map((o) => (
                <span key={`g${o}`} className="h-3 w-3 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--primary) ${o * 100}%, transparent)` }} />
              ))}
            </div>
            <span>Ganancia</span>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 md:p-6">
          {/* Header row: DOW + weekly total */}
          <div className="grid grid-cols-[repeat(7,1fr)_120px] gap-2 px-1 mb-2">
            {DOW.map((d) => (
              <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium py-1">{d}</div>
            ))}
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium py-1 text-right">Semana</div>
          </div>

          <div className="space-y-2">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-[repeat(7,1fr)_120px] gap-2">
                {week.map((cell, ci) => {
                  if (!cell) return <div key={ci} className="aspect-[5/4] rounded-xl bg-surface/20 border border-dashed border-border/50" />;
                  const day = data[cell.key];
                  const dimmed = day && !passesFilter(day);
                  const today = isToday(cell.key);

                  if (!day) {
                    return (
                      <div
                        key={ci}
                        className={`aspect-[5/4] rounded-xl bg-surface/40 border border-border/60 p-2 flex flex-col ${today ? "ring-2 ring-primary/40" : ""}`}
                      >
                        <span className="text-xs font-mono text-muted-foreground/70">{cell.d}</span>
                        <span className="mt-auto text-[10px] text-muted-foreground/50">Sin trades</span>
                      </div>
                    );
                  }

                  const positive = day.pl > 0;
                  const intensity = Math.min(1, Math.abs(day.pl) / maxAbs);
                  const colorVar = positive ? "var(--primary)" : "var(--destructive)";
                  const bg = `color-mix(in oklab, ${colorVar} ${Math.max(0.12, intensity * 0.85) * 100}%, transparent)`;
                  const borderC = `color-mix(in oklab, ${colorVar} ${Math.max(0.25, intensity) * 60}%, transparent)`;

                  return (
                    <button
                      key={ci}
                      onClick={() => setSelected(day)}
                      className={`group relative aspect-[5/4] rounded-xl border p-2 flex flex-col text-left transition hover:scale-[1.03] hover:z-10 hover:shadow-elegant ${
                        dimmed ? "opacity-25 hover:opacity-60" : ""
                      } ${today ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""}`}
                      style={{ background: bg, borderColor: borderC }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold font-mono ${positive ? "text-success" : "text-destructive"}`}>{cell.d}</span>
                        <span className="text-[9px] font-mono text-foreground/60 px-1 py-0.5 rounded bg-background/30">
                          {day.trades}t
                        </span>
                      </div>
                      <div className="mt-auto">
                        <div className={`font-mono text-[13px] font-semibold tabular ${positive ? "text-success" : "text-destructive"}`}>
                          {positive ? "+" : "−"}${Math.abs(day.pl) >= 1000 ? (Math.abs(day.pl) / 1000).toFixed(1) + "k" : Math.abs(day.pl)}
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground">
                          {day.rMultiple > 0 ? "+" : ""}{day.rMultiple}R
                        </div>
                      </div>
                    </button>
                  );
                })}
                {/* Week total */}
                <div className="aspect-auto rounded-xl border border-border bg-surface/40 p-2 flex flex-col justify-center items-end text-right">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Sem {wi + 1}</div>
                  <div className={`mt-1 font-mono text-sm font-semibold tabular ${weekTotals[wi].pl > 0 ? "text-success" : weekTotals[wi].pl < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {weekTotals[wi].pl === 0 ? "—" : `${weekTotals[wi].pl > 0 ? "+" : "−"}$${Math.abs(weekTotals[wi].pl).toLocaleString()}`}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">{weekTotals[wi].trades}t · {weekTotals[wi].days}d</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      {selected && <DayModal day={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({
  label, value, tone, icon: Icon, sub,
}: { label: string; value: string; tone: "success" | "destructive" | "primary"; icon: any; sub: string }) {
  const toneCls =
    tone === "success" ? "bg-success/10 text-success border-success/20"
    : tone === "destructive" ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-primary/10 text-primary border-primary/20";
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/30 transition">
      <div className={`h-9 w-9 grid place-items-center rounded-lg border ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

function DayModal({ day, onClose }: { day: DayData; onClose: () => void }) {
  const date = new Date(day.date + "T00:00:00");
  const positive = day.pl > 0;
  // Synthetic trade list for the modal
  const trades = useMemo(() => {
    const r = rng(date.getTime());
    const symbols = ["EURUSD","NAS100","BTCUSD","GOLD","SPX500","USDJPY","ETHUSD"];
    return Array.from({ length: day.trades }).map((_, i) => {
      const sym = symbols[Math.floor(r() * symbols.length)];
      const win = r() > (positive ? 0.25 : 0.65);
      const mag = Math.floor(r() * 300) + 30;
      return {
        sym,
        side: r() > 0.5 ? "LONG" : "SHORT",
        rr: Number(((win ? 1 : -1) * (0.3 + r() * 2.5)).toFixed(2)),
        pl: win ? mag : -Math.floor(mag * 0.7),
        time: `${String(8 + Math.floor(r() * 9)).padStart(2,"0")}:${String(Math.floor(r() * 60)).padStart(2,"0")}`,
      };
    });
  }, [day]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl glass-strong shadow-elegant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: positive ? "color-mix(in oklab, var(--primary) 30%, transparent)" : "color-mix(in oklab, var(--destructive) 30%, transparent)" }}
        />
        <div className="relative p-6 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {DOW[(date.getDay() + 6) % 7]} · {date.getDate()} {MONTHS[date.getMonth()]} {date.getFullYear()}
              </div>
              <div className={`mt-2 font-mono text-3xl font-bold tabular ${positive ? "text-success" : "text-destructive"}`}>
                {positive ? "+" : "−"}${Math.abs(day.pl).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {day.trades} operaciones · Win rate {day.winRate}% · {day.rMultiple > 0 ? "+" : ""}{day.rMultiple}R promedio
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-lg glass hover:border-destructive/40 transition"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <MiniStat label="Trades" value={String(day.trades)} />
            <MiniStat label="Win rate" value={`${day.winRate}%`} />
            <MiniStat label="R total" value={`${day.rMultiple > 0 ? "+" : ""}${day.rMultiple}R`} tone={day.rMultiple >= 0 ? "success" : "destructive"} />
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Operaciones del día</div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-surface/40">
                    <th className="text-left font-medium py-2 px-3">Hora</th>
                    <th className="text-left font-medium py-2 px-3">Símbolo</th>
                    <th className="text-left font-medium py-2 px-3">Lado</th>
                    <th className="text-right font-medium py-2 px-3">R</th>
                    <th className="text-right font-medium py-2 px-3">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => {
                    const pos = t.pl > 0;
                    return (
                      <tr key={i} className="border-t border-border/60">
                        <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{t.time}</td>
                        <td className="py-2 px-3 font-semibold">{t.sym}</td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.side === "LONG" ? "text-success border-success/30 bg-success/10" : "text-info border-info/30 bg-info/10"}`}>{t.side}</span>
                        </td>
                        <td className={`py-2 px-3 text-right font-mono ${pos ? "text-success" : "text-destructive"}`}>{t.rr > 0 ? "+" : ""}{t.rr}R</td>
                        <td className={`py-2 px-3 text-right font-mono font-semibold ${pos ? "text-success" : "text-destructive"}`}>
                          {pos ? "+" : "−"}${Math.abs(t.pl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" }) {
  const cls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold tabular ${cls}`}>{value}</div>
    </div>
  );
}
