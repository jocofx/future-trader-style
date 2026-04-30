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
  const handleSaveTrade = async () => {
    if (!newTrade.instrumento) return setNewTrade(p => ({...p, error: "El instrumento es obligatorio"}));
    setSaving(true);
    try {
      await save({
        user_id: "",
        instrumento: newTrade.instrumento!,
        tipo: (newTrade.tipo as "BUY"|"SELL") || "BUY",
        fecha: newTrade.fecha || new Date().toISOString().slice(0,10),
        hora: newTrade.hora || null,
        cuenta: newTrade.cuenta || null,
        precio_entrada: newTrade.precio_entrada ?? null,
        precio_salida: newTrade.precio_salida ?? null,
        resultado: newTrade.resultado ?? null,
        lotes: newTrade.lotes ?? null,
        rr: newTrade.rr ?? null,
        sesion: newTrade.sesion || null,
        emocion: null, confianza: null, tags: null, notas: null, imagen_url: null,
        estado: "Cerrada", estrategia: null, setup: null,
      });
      setShowModal(false);
      setNewTrade({});
    } catch(e) {
      setNewTrade(p => ({...p, error: e instanceof Error ? e.message : "Error guardando"}));
    } finally { setSaving(false); }
  };

  return (sign ? (n >= 0 ? "+" : "-") : (n < 0 ? "-" : "")) + "$" + abs;
}

function OperacionesPage() {
  const { trades: { trades, remove, save, loading } } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [newTrade, setNewTrade] = useState<Partial<Trade & {error: string}>>({});
  const [saving, setSaving]     = useState(false);
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
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
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
      {/* New Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border-strong rounded-2xl w-full shadow-elegant p-6" style={{maxWidth:"480px"}}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-lg font-bold">Nueva operación</div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Símbolo *</label>
                <input value={newTrade.instrumento ?? ""} onChange={e => setNewTrade(p=>({...p,instrumento:e.target.value}))}
                  placeholder="EURUSD, XAUUSD..." className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Lado</label>
                <select value={newTrade.tipo ?? "BUY"} onChange={e => setNewTrade(p=>({...p,tipo:e.target.value as "BUY"|"SELL"}))}
                  className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fecha</label>
                <input type="date" value={newTrade.fecha ?? new Date().toISOString().slice(0,10)} onChange={e => setNewTrade(p=>({...p,fecha:e.target.value}))}
                  className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">P&L ($)</label>
                <input type="number" value={newTrade.resultado ?? ""} onChange={e => setNewTrade(p=>({...p,resultado:Number(e.target.value)}))}
                  placeholder="+150 o -80" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Entrada</label>
                <input type="number" step="0.00001" value={newTrade.precio_entrada ?? ""} onChange={e => setNewTrade(p=>({...p,precio_entrada:Number(e.target.value)}))}
                  placeholder="1.08450" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Salida</label>
                <input type="number" step="0.00001" value={newTrade.precio_salida ?? ""} onChange={e => setNewTrade(p=>({...p,precio_salida:Number(e.target.value)}))}
                  placeholder="1.08600" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Lotes</label>
                <input type="number" step="0.01" value={newTrade.lotes ?? ""} onChange={e => setNewTrade(p=>({...p,lotes:Number(e.target.value)}))}
                  placeholder="0.10" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">R:R</label>
                <input type="number" step="0.1" value={newTrade.rr ?? ""} onChange={e => setNewTrade(p=>({...p,rr:Number(e.target.value)}))}
                  placeholder="2.0" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sesión</label>
              <select value={newTrade.sesion ?? ""} onChange={e => setNewTrade(p=>({...p,sesion:e.target.value}))}
                className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— Sin sesión —</option>
                {["Asia","Londres","Nueva York","Tarde"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {newTrade.error && <div className="text-destructive text-xs mb-3">{newTrade.error}</div>}
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
              <button onClick={handleSaveTrade} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar operación"}
              </button>
            </div>
          </div>
        </div>
      )}
  );
}
