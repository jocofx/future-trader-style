import { createFileRoute } from "@tanstack/react-router";
import { Filter, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/operaciones")({
  component: OperacionesPage,
});

const TRADES = [
  { id: 1, date: "29 Abr 2026", sym: "EURUSD", side: "LONG", entry: "1.0832", exit: "1.0871", size: "1.5", r: "+2.3R", pl: 420, tag: "Breakout" },
  { id: 2, date: "29 Abr 2026", sym: "NAS100", side: "SHORT", entry: "18,420", exit: "18,355", size: "0.5", r: "+1.5R", pl: 280, tag: "Pullback" },
  { id: 3, date: "29 Abr 2026", sym: "BTCUSD", side: "LONG", entry: "67,210", exit: "66,980", size: "0.05", r: "−0.8R", pl: -140, tag: "FVG" },
  { id: 4, date: "28 Abr 2026", sym: "GOLD", side: "LONG", entry: "2,318", exit: "2,342", size: "1.0", r: "+3.1R", pl: 610, tag: "OrderBlock" },
  { id: 5, date: "28 Abr 2026", sym: "SPX500", side: "SHORT", entry: "5,142", exit: "5,128", size: "0.5", r: "+0.6R", pl: 110, tag: "Range" },
  { id: 6, date: "27 Abr 2026", sym: "USDJPY", side: "LONG", entry: "157.10", exit: "157.42", size: "1.0", r: "+1.9R", pl: 320, tag: "News" },
  { id: 7, date: "26 Abr 2026", sym: "ETHUSD", side: "SHORT", entry: "3,210", exit: "3,265", size: "0.5", r: "−1.2R", pl: -210, tag: "Fade" },
  { id: 8, date: "26 Abr 2026", sym: "XAUUSD", side: "LONG", entry: "2,295", exit: "2,318", size: "1.0", r: "+2.0R", pl: 450, tag: "Trend" },
];

function OperacionesPage() {
  const total = TRADES.reduce((a, t) => a + t.pl, 0);
  const wins = TRADES.filter((t) => t.pl > 0).length;
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Journal</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Operaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{TRADES.length} trades · {wins} ganadores · neto <span className="text-success font-mono">+${total}</span></p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nueva operación
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar por símbolo o tag…" className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {["Todos", "Long", "Short", "Ganadores", "Perdedores"].map((f, i) => (
            <button key={f} className={`text-xs px-3 py-1.5 rounded-lg border ${i===0 ? "bg-primary/15 text-primary border-primary/25" : "bg-surface/60 border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
          <button className="text-xs px-3 py-1.5 rounded-lg border bg-surface/60 border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                <th className="text-left font-medium py-3 px-4">Fecha</th>
                <th className="text-left font-medium py-3 px-4">Símbolo</th>
                <th className="text-left font-medium py-3 px-4">Lado</th>
                <th className="text-right font-medium py-3 px-4">Entrada</th>
                <th className="text-right font-medium py-3 px-4">Salida</th>
                <th className="text-right font-medium py-3 px-4">Tamaño</th>
                <th className="text-right font-medium py-3 px-4">R</th>
                <th className="text-right font-medium py-3 px-4">P&L</th>
                <th className="text-left font-medium py-3 px-4">Tag</th>
              </tr>
            </thead>
            <tbody>
              {TRADES.map((t) => {
                const pos = t.pl > 0;
                return (
                  <tr key={t.id} className="border-b border-border/60 hover:bg-surface/40 transition cursor-pointer">
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.date}</td>
                    <td className="py-3 px-4 font-semibold">{t.sym}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.side === "LONG" ? "text-success border-success/30 bg-success/10" : "text-info border-info/30 bg-info/10"}`}>{t.side}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">{t.entry}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs">{t.exit}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs">{t.size}</td>
                    <td className={`py-3 px-4 text-right font-mono ${pos ? "text-success" : "text-destructive"}`}>{t.r}</td>
                    <td className={`py-3 px-4 text-right font-mono font-semibold ${pos ? "text-success" : "text-destructive"}`}>{pos ? "+" : ""}{t.pl < 0 ? "−" : ""}${Math.abs(t.pl)}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface/80 border border-border text-muted-foreground">{t.tag}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
