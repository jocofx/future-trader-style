import { createFileRoute } from "@tanstack/react-router";
import { Filter, Plus, Search, Trash2, Pencil, X, AlertCircle, Bot } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { usePlan } from "@/hooks/usePlan";
import type { Trade } from "@/lib/types";

export const Route = createFileRoute("/app/operaciones")({
  component: OperacionesPage,
});

function fmt(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (sign ? (n >= 0 ? "+" : "-") : (n < 0 ? "-" : "")) + "$" + abs;
}

const SESIONES  = ["Asia", "Londres", "Nueva York", "Tarde"];
const EMOCIONES = ["Sereno", "Confiado", "Ansioso", "Frustrado", "Motivado", "Neutral", "Eufórico", "Inseguro"];

const inputCls = "mt-1 w-full bg-surface/80 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold";

// ── Trade Form (shared for new + edit) ────────────────────────────
interface TradeFormProps {
  trade:      Partial<Trade & { error?: string }>;
  accounts:   { id: string; nombre: string }[];
  isEATrade:  boolean;
  saving:     boolean;
  onSet:      (k: keyof Trade, v: unknown) => void;
  onSave:     () => void;
  onClose:    () => void;
  isEdit?:    boolean;
}

function TradeForm({ trade, accounts, isEATrade, saving, onSet, onSave, onClose, isEdit }: TradeFormProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full shadow-elegant overflow-y-auto"
        style={{ maxWidth: "520px", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-base font-bold">
                {isEdit ? "Editar operación" : "Nueva operación"}
              </div>
              {isEATrade && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Bot className="h-3 w-3" /> EA
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isEATrade
                ? "Añade emoción, notas y sesión a esta operación sincronizada"
                : isEdit ? "Modifica los datos de esta operación" : "Registra un trade manualmente"
              }
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* EA notice */}
          {isEATrade && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
              <Bot className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Los datos técnicos (precio, lotes, P&L) vienen del EA y no se pueden cambiar. Solo puedes añadir el contexto psicológico.</span>
            </div>
          )}

          {/* BUY/SELL — only for new trades */}
          {!isEATrade && !isEdit && (
            <div>
              <label className={labelCls}>Lado *</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(["BUY","SELL"] as const).map(s => (
                  <button key={s} onClick={() => onSet("tipo", s)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-bold transition ${
                      trade.tipo === s
                        ? s === "BUY" ? "border-success bg-success/10 text-success" : "border-info bg-info/10 text-info"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    {s === "BUY" ? "📈 BUY / LONG" : "📉 SELL / SHORT"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Símbolo */}
            {!isEATrade && (
              <div className="col-span-2">
                <label className={labelCls}>Símbolo *</label>
                <input value={trade.instrumento ?? ""} onChange={e => onSet("instrumento", e.target.value)}
                  placeholder="EURUSD, XAUUSD, NAS100…" className={inputCls} />
              </div>
            )}

            {/* Fecha */}
            {!isEATrade && (
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" value={trade.fecha ?? ""} onChange={e => onSet("fecha", e.target.value)}
                  className={inputCls} />
              </div>
            )}

            {/* P&L — editable for manual trades */}
            {!isEATrade && (
              <div>
                <label className={labelCls}>P&L ($)</label>
                <input type="number" step="0.01" value={trade.resultado ?? ""}
                  onChange={e => onSet("resultado", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="+150 o -80" className={inputCls} />
              </div>
            )}

            {/* R:R — editable */}
            <div>
              <label className={labelCls}>R:R</label>
              <input type="number" step="0.1" value={trade.rr ?? ""}
                onChange={e => onSet("rr", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="2.0" className={inputCls} />
            </div>

            {/* Prices — only for manual trades */}
            {!isEATrade && (
              <>
                <div>
                  <label className={labelCls}>Precio entrada</label>
                  <input type="number" step="0.00001" value={trade.precio_entrada ?? ""}
                    onChange={e => onSet("precio_entrada", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="1.08450" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Precio salida</label>
                  <input type="number" step="0.00001" value={trade.precio_salida ?? ""}
                    onChange={e => onSet("precio_salida", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="1.08600" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Lotes</label>
                  <input type="number" step="0.01" value={trade.lotes ?? ""}
                    onChange={e => onSet("lotes", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="0.10" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cuenta</label>
                  <select value={trade.cuenta ?? ""} onChange={e => onSet("cuenta", e.target.value || null)}
                    className={inputCls}>
                    <option value="">— Sin cuenta —</option>
                    {accounts.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Sesión — always editable */}
            <div>
              <label className={labelCls}>Sesión</label>
              <select value={trade.sesion ?? ""} onChange={e => onSet("sesion", e.target.value || null)}
                className={inputCls}>
                <option value="">— Sin sesión —</option>
                {SESIONES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Emoción — always editable (key field for psychology) */}
            <div>
              <label className={labelCls}>Emoción 🧠</label>
              <select value={trade.emocion ?? ""} onChange={e => onSet("emocion", e.target.value || null)}
                className={inputCls}>
                <option value="">— Sin emoción —</option>
                {EMOCIONES.map(e => <option key={e} value={e.toLowerCase()}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Notas — always editable */}
          <div>
            <label className={labelCls}>Notas 📝</label>
            <textarea value={trade.notas ?? ""} onChange={e => onSet("notas", e.target.value || null)}
              rows={3} placeholder="Setup, contexto, qué salió bien/mal, lecciones aprendidas…"
              className={`${inputCls} resize-none`} />
          </div>

          {trade.error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {trade.error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">
              Cancelar
            </button>
            <button onClick={onSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar operación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
function OperacionesPage() {
  const { trades: { trades, remove, save, update, loading, error }, accounts: { accounts }, premarket: { getPlan } } = useApp();
  const todayPremarketCuenta = useMemo(() => {
    const today = new Date().toISOString().slice(0,10);
    const plan = getPlan(today);
    return (plan as any)?.cuenta_dia ?? null;
  }, [getPlan]);
  const { canAddTrade } = usePlan();

  // New trade modal
  const [showModal,   setShowModal]   = useState(false);
  const [newTrade,    setNewTrade]    = useState<Partial<Trade & { error?: string }>>({ tipo: "BUY", fecha: new Date().toISOString().slice(0, 10) });
  const [saving,      setSaving]      = useState(false);

  // Edit modal
  const [editTrade,   setEditTrade]   = useState<Partial<Trade & { error?: string }> | null>(null);
  const [editSaving,  setEditSaving]  = useState(false);

  // Other state
  const [showUpgrade,      setShowUpgrade]      = useState(false);
  const [confirmDeleteId,  setConfirmDeleteId]  = useState<string | null>(null);
  const [search,  setSearch]  = useState("");
  const [side,    setSide]    = useState<"Todos" | "BUY" | "SELL">("Todos");
  const [result,  setResult]  = useState<"Todos" | "Ganadores" | "Perdedores">("Todos");

  const setNew = (k: keyof Trade, v: unknown) => setNewTrade(p => ({ ...p, [k]: v }));
  const setEdit = (k: keyof Trade, v: unknown) => setEditTrade(p => p ? { ...p, [k]: v } : p);

  const filtered = useMemo(() => trades.filter(t => {
    if (search && !t.instrumento.toLowerCase().includes(search.toLowerCase())) return false;
    if (side !== "Todos" && t.tipo !== side) return false;
    if (result === "Ganadores"  && (t.resultado ?? 0) <= 0) return false;
    if (result === "Perdedores" && (t.resultado ?? 0) >= 0) return false;
    return true;
  }), [trades, search, side, result]);

  const total = filtered.reduce((a, t) => a + (t.resultado ?? 0), 0);
  const wins  = filtered.filter(t => (t.resultado ?? 0) > 0).length;

  // ── New trade ──
  const handleSave = async () => {
    if (!newTrade.instrumento?.trim()) {
      setNewTrade(p => ({ ...p, error: "El símbolo es obligatorio" }));
      return;
    }
    if (!canAddTrade(trades.length)) { setShowUpgrade(true); return; }
    setSaving(true);
    try {
      await (save as any)({
        user_id: "", instrumento: newTrade.instrumento!.trim(),
        tipo: (newTrade.tipo ?? "BUY") as "BUY" | "SELL",
        direccion: newTrade.tipo ?? "BUY",
        fecha: newTrade.fecha || new Date().toISOString().slice(0, 10),
        cuenta: newTrade.cuenta ?? null, entrada: newTrade.precio_entrada ?? null,
        precio_entrada: newTrade.precio_entrada ?? null, tp: newTrade.precio_salida ?? null,
        precio_salida: newTrade.precio_salida ?? null, sl: null,
        resultado: newTrade.resultado ?? null, contratos: newTrade.lotes ?? null,
        lotes: newTrade.lotes ?? null, rr: newTrade.rr ?? null,
        sesion: newTrade.sesion ?? null, emocion: newTrade.emocion ?? null,
        notas: newTrade.notas ?? null, estado: "Cerrada",
        setup: null, disciplina: null, impulsos: null, errores: null,
        img_apertura: null, img_cierre: null, mt_ticket: null,
        plataforma: null, mt_sincronizada: null,
      });
      setShowModal(false);
      setNewTrade({ tipo: "BUY", fecha: new Date().toISOString().slice(0, 10) });
    } catch (e) {
      setNewTrade(p => ({ ...p, error: e instanceof Error ? e.message : "Error guardando" }));
    } finally { setSaving(false); }
  };

  // ── Edit trade ──
  const openEdit = (t: Trade) => setEditTrade({ ...t });

  const handleUpdate = async () => {
    if (!editTrade?.id) return;
    setEditSaving(true);
    try {
      const isEA = !!(editTrade as any).mt_ticket || !!(editTrade as any).mt_sincronizada;
      const changes: Partial<Trade> = {
        sesion:  editTrade.sesion  ?? null,
        emocion: editTrade.emocion ?? null,
        notas:   editTrade.notas   ?? null,
        rr:      editTrade.rr      ?? null,
      };
      // For manual trades, allow editing more fields
      if (!isEA) {
        Object.assign(changes, {
          instrumento:    editTrade.instrumento,
          tipo:           editTrade.tipo,
          fecha:          editTrade.fecha,
          resultado:      editTrade.resultado  ?? null,
          precio_entrada: editTrade.precio_entrada ?? null,
          precio_salida:  editTrade.precio_salida  ?? null,
          lotes:          editTrade.lotes          ?? null,
          cuenta:         editTrade.cuenta         ?? null,
        });
      }
      await update(editTrade.id, changes);
      setEditTrade(null);
    } catch (e: any) {
      console.error("Update error:", e);
      setEditTrade(p => p ? { ...p, error: e?.message ?? "Error actualizando" } : p);
    } finally { setEditSaving(false); }
  };

  const doDelete = async () => {
    if (confirmDeleteId) { await remove(confirmDeleteId); setConfirmDeleteId(null); }
  };

  return (
    <>
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
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
        <button onClick={() => { setNewTrade({ tipo: "BUY", fecha: new Date().toISOString().slice(0, 10), cuenta: todayPremarketCuenta }); setShowModal(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nueva operación
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Error al cargar operaciones: {error}. Comprueba tu conexión e intenta recargar.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar símbolo…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
          </div>
          {(["Todos","BUY","SELL"] as const).map(f => (
            <button key={f} onClick={() => setSide(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${side===f?"bg-primary/15 text-primary border-primary/25":"bg-surface/60 border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
          {(["Todos","Ganadores","Perdedores"] as const).map(f => (
            <button key={f} onClick={() => setResult(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${result===f?"bg-primary/15 text-primary border-primary/25":"bg-surface/60 border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {trades.length === 0 ? "Sin operaciones. ¡Añade tu primera trade!" : "Sin resultados con estos filtros."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                  <th className="text-left font-medium py-3 px-4">Fecha</th>
                  <th className="text-left font-medium py-3 px-4">Símbolo</th>
                  <th className="text-left font-medium py-3 px-4">Lado</th>
                  <th className="text-left font-medium py-3 px-4 hidden sm:table-cell">Cuenta</th>
                  <th className="text-left font-medium py-3 px-4 hidden lg:table-cell">Emoción</th>
                  <th className="text-right font-medium py-3 px-4">R:R</th>
                  <th className="text-right font-medium py-3 px-4">P&L</th>
                  <th className="text-left font-medium py-3 px-4 hidden lg:table-cell">Sesión</th>
                  <th className="text-center font-medium py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: Trade) => {
                  const pos   = (t.resultado ?? 0) >= 0;
                  const isEA  = !!(t as any).mt_ticket || !!(t as any).mt_sincronizada;
                  return (
                    <tr key={t.id} className="border-b border-border/60 hover:bg-surface/40 transition group">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.fecha}</td>
                      <td className="py-3 px-4 font-semibold">
                        <div className="flex items-center gap-1.5">
                          {t.instrumento}
                          {isEA && <span title="Sincronizado con EA"><Bot className="h-3 w-3 text-primary/60" /></span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${t.tipo==="BUY"?"text-success border-success/30 bg-success/10":"text-info border-info/30 bg-info/10"}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell">{t.cuenta ?? "—"}</td>
                      <td className="py-3 px-4 text-xs hidden lg:table-cell">
                        {t.emocion
                          ? <span className="px-2 py-0.5 rounded-md bg-surface/80 border border-border text-muted-foreground capitalize">{t.emocion}</span>
                          : <span className="text-muted-foreground/40 italic text-[11px]">sin emoción</span>
                        }
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${pos?"text-success":"text-destructive"}`}>
                        {t.rr!=null?`${t.rr>=0?"+":""}${t.rr.toFixed(2)}R`:"—"}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-semibold ${pos?"text-success":"text-destructive"}`}>
                        {t.resultado!=null?fmt(t.resultado,true):"—"}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {t.sesion && <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface/80 border border-border text-muted-foreground">{t.sesion}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(t)}
                            title={isEA ? "Añadir emoción y notas" : "Editar operación"}
                            className="text-muted-foreground hover:text-primary transition p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmDeleteId(t.id)}
                            className="text-muted-foreground hover:text-destructive transition p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

    {/* New trade modal */}
    {showModal && (
      <TradeForm
        trade={newTrade} accounts={accounts} isEATrade={false}
        saving={saving} onSet={setNew} onSave={handleSave}
        onClose={() => setShowModal(false)}
      />
    )}

    {/* Edit modal */}
    {editTrade && (
      <TradeForm
        trade={editTrade}
        accounts={accounts}
        isEATrade={!!(editTrade as any).mt_ticket || !!(editTrade as any).mt_sincronizada}
        saving={editSaving} onSet={setEdit} onSave={handleUpdate}
        onClose={() => setEditTrade(null)} isEdit
      />
    )}

    <ConfirmModal
      open={confirmDeleteId !== null}
      title="¿Eliminar operación?"
      message="Se eliminará permanentemente. Esta acción no se puede deshacer."
      confirmLabel="Sí, eliminar"
      onConfirm={doDelete}
      onCancel={() => setConfirmDeleteId(null)}
    />
    {showUpgrade && (
      <UpgradeModal open={showUpgrade} feature="max_trades" onClose={() => setShowUpgrade(false)} />
    )}
    </>
  );
}
