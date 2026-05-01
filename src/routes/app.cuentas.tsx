import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Wallet, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Account } from "@/lib/types";

export const Route = createFileRoute("/app/cuentas")({
  component: CuentasPage,
});

const TIPOS   = ["Real","Demo","Prop Firm","Fondeo","Otra"];
const BROKERS = ["FTMO","TopStep","MyForexFunds","Interactive Brokers",
                 "Pepperstone","ICMarkets","WSF Markets","Tradovate","Otro"];

// ── Empty form state ────────────────────────────────────────────────
const EMPTY: Partial<Account> = { activa: true, moneda: "USD" };

function CuentasPage() {
  const { accounts: { accounts, save, update, remove, loading }, trades: { trades } } = useApp();

  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ── Form fields as individual state (fixes 1-char-at-a-time bug) ──
  const [nombre,  setNombre]  = useState("");
  const [broker,  setBroker]  = useState("");
  const [tipo,    setTipo]    = useState("");
  const [balance, setBalance] = useState<string>("");
  const [moneda,  setMoneda]  = useState("USD");
  const [activa,  setActiva]  = useState(true);
  const [notas,   setNotas]   = useState("");

  const resetForm = useCallback(() => {
    setNombre(""); setBroker(""); setTipo(""); setBalance("");
    setMoneda("USD"); setActiva(true); setNotas(""); setErr("");
  }, []);

  const loadIntoForm = (a: Account) => {
    setNombre(a.nombre ?? "");
    setBroker(a.broker ?? "");
    setTipo(a.tipo ?? "");
    setBalance(a.balance != null ? String(a.balance) : "");
    setMoneda(a.moneda ?? "USD");
    setActiva(a.activa ?? true);
    setNotas(a.notas ?? "");
  };

  const handleSave = async () => {
    if (!nombre.trim()) return setErr("El nombre es obligatorio");
    setSaving(true);
    setErr("");
    try {
      const payload = {
        nombre:  nombre.trim(),
        broker:  broker  || null,
        tipo:    tipo    || null,
        balance: balance ? Number(balance) : null,
        moneda:  moneda  || "USD",
        activa,
        notas:   notas   || null,
      };

      if (editing) {
        await update(editing, payload);
        setEditing(null);
      } else {
        await save({ user_id: "", ...payload } as any);
        setShowForm(false);
      }
      resetForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error guardando";
      console.error("cuentas save error:", e);
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: Account) => {
    setEditing(a.id);
    loadIntoForm(a);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await remove(confirmId);
    } catch (e) {
      console.error("delete error:", e);
    } finally {
      setConfirmId(null);
    }
  };

  // Stats per account
  const accountStats = (nombre: string) => {
    const t = trades.filter(tr => tr.cuenta === nombre && tr.resultado != null);
    const wins = t.filter(tr => (tr.resultado ?? 0) > 0);
    const pnl  = t.reduce((s, tr) => s + (tr.resultado ?? 0), 0);
    return { total: t.length, wins: wins.length, pnl };
  };

  // ── Form UI — NOT a nested component (avoids remount on every render) ──
  const formUI = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre *</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Mi cuenta real"
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Broker</label>
          <select
            value={broker}
            onChange={e => setBroker(e.target.value)}
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {BROKERS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance</label>
          <input
            type="number"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="10000"
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notas</label>
        <input
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Descripción opcional..."
          className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiva(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors relative ${activa ? "bg-success" : "bg-surface-3"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${activa ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm text-muted-foreground">Cuenta activa</span>
      </div>

      {err && <div className="text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{err}</div>}
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" /> Gestión
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-sm text-muted-foreground mt-1">{accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditing(null); setShowForm(v => !v); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nueva cuenta
        </button>
      </div>

      {/* New account form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Nueva cuenta</div>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {formUI}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar cuenta"}
            </button>
          </div>
        </div>
      )}

      {/* Accounts grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando cuentas…</div>
      ) : accounts.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🏦</div>
          <div className="text-muted-foreground text-sm">Sin cuentas. Añade tu primera cuenta para organizar tus operaciones.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(a => {
            const stats = accountStats(a.nombre);
            const isEditing = editing === a.id;
            return (
              <div key={a.id}
                className={`rounded-2xl border bg-card/60 backdrop-blur overflow-hidden ${a.activa ? "border-border" : "border-border/50 opacity-60"}`}>

                {/* Card header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${a.activa ? "bg-success" : "bg-muted-foreground"}`} />
                        <span className="font-bold text-base">{a.nombre}</span>
                      </div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {a.broker && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.broker}</span>}
                        {a.tipo   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.tipo}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => isEditing ? (setEditing(null), resetForm()) : handleEdit(a)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition">
                        {isEditing ? <X className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setConfirmId(a.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit form inline */}
                {isEditing ? (
                  <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                    {formUI}
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(null); resetForm(); }}
                        className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-surface transition">
                        Cancelar
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition disabled:opacity-50">
                        {saving ? "…" : <><Check className="h-3 w-3 inline mr-1" />Guardar</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Stats */
                  <div className="px-5 pb-5 border-t border-border pt-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ops</div>
                        <div className="font-mono font-bold mt-0.5">{stats.total}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">WR</div>
                        <div className="font-mono font-bold mt-0.5">
                          {stats.total ? Math.round(stats.wins / stats.total * 100) + "%" : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">P&L</div>
                        <div className={`font-mono font-bold mt-0.5 ${stats.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {stats.total ? (stats.pnl >= 0 ? "+" : "-") + "$" + Math.abs(stats.pnl).toFixed(0) : "—"}
                        </div>
                      </div>
                    </div>
                    {a.balance != null && (
                      <div className="mt-3 text-xs text-muted-foreground text-center font-mono">
                        Balance: ${Number(a.balance).toLocaleString()} {a.moneda}
                      </div>
                    )}
                    {a.notas && <div className="mt-2 text-xs text-muted-foreground text-center">{a.notas}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmId !== null}
        title="¿Eliminar cuenta?"
        message="Se eliminará la cuenta permanentemente. Las operaciones asociadas no se borrarán."
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
