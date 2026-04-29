import { createFileRoute } from "@tanstack/react-router";
import { Filter, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Trade } from "@/lib/types";

export const Route = createFileRoute("/app/operaciones")({
  component: OperacionesPage,
});

function fmt(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (sign ? (n >= 0 ? "+" : "-") : (n < 0 ? "-" : "")) + "$" + abs;
}

function OperacionesPage() {
  const { trades: { trades, remove, loading } } = useApp();
  const [search, setSearch] = useState("");
  const [side, setSide]     = useState<"Todos" | "BUY" | "SELL">("Todos");
  const [result, setResult] = useState<"Todos" | "Ganadores" | "Perdedores">("Todos");

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (search && !t.instrumento.toLowerCase().includes(search.toLowerCase()) &&
          !(t.tags ?? []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))) return false;
      if (side !== "Todos" && t.tipo !== side) return false;
      if (result === "Ganadores" && (t.resultado ?? 0) <= 0) return false;
      if (result === "Perdedores" && (t.resultado ?? 0) >= 0) return false;
      return true;
    });
  }, [trades, search, side, result]);

  const total = filtered.reduce((a, t) => a + (t.resultado ?? 0), 0);
  const wins  = filtered.filter(t => (t.resultado ?? 0) > 0).length;

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta operación?")) return;
    await remove(id);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Journal</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Operaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} trades · {wins} ganadores ·{" "}
            <span className={`font-mono ${total >= 0 ? "text-success" : "text-destructive"}`}>
              {fmt(total, true)}
            </span>
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nueva operación
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar por símbolo o tag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          {(["Todos", "BUY", "SELL"] as const).map(f => (
            <button key={f} onClick={() => setSide(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${side === f ? "bg-primary/15 text-primary border-primary/25" : "bg-surface/60 border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
          {(["Todos", "Ganadores", "Perdedores"] as const).map(f => (
            <button key={f} onClick={() => setResult(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${result === f ? "bg-primary/15 text-primary border-primary/25" : "bg-surface/60 border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
          <button className="text-xs px-3 py-1.5 rounded-lg border bg-surface/60 border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Cargando operaciones…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Sin operaciones con estos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                  <th className="text-left font-medium py-3 px-4">Fecha</th>
                  <th className="text-left font-medium py-3 px-4">Símbolo</th>
                  <th className="text-left font-medium py-3 px-4">Lado</th>
                  <th className="text-right font-medium py-3 px-4 hidden md:table-cell">Entrada</th>
                  <th className="text-right font-medium py-3 px-4 hidden md:table-cell">Salida</th>
                  <th className="text-right font-medium py-3 px-4 hidden lg:table-cell">Lotes</th>
                  <th className="text-right font-medium py-3 px-4">R:R</th>
                  <th className="text-right font-medium py-3 px-4">P&L</th>
                  <th className="text-left font-medium py-3 px-4 hidden sm:table-cell">Sesión</th>
                  <th className="text-center font-medium py-3 px-4">✕</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: Trade) => {
                  const pos = (t.resultado ?? 0) >= 0;
                  return (
                    <tr key={t.id} className="border-b border-border/60 hover:bg-surface/40 transition cursor-pointer">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.fecha}</td>
                      <td className="py-3 px-4 font-semibold">{t.instrumento}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.tipo === "BUY" ? "text-success border-success/30 bg-success/10" : "text-info border-info/30 bg-info/10"}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs hidden md:table-cell">
                        {t.precio_entrada != null ? `$${t.precio_entrada}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs hidden md:table-cell">
                        {t.precio_salida != null ? `$${t.precio_salida}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs hidden lg:table-cell">
                        {t.lotes ?? "—"}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${pos ? "text-success" : "text-destructive"}`}>
                        {t.rr != null ? `${t.rr >= 0 ? "+" : ""}${t.rr.toFixed(2)}R` : "—"}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-semibold ${pos ? "text-success" : "text-destructive"}`}>
                        {t.resultado != null ? fmt(t.resultado, true) : "—"}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface/80 border border-border text-muted-foreground">
                          {t.sesion ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-muted-foreground hover:text-destructive transition p-1 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
