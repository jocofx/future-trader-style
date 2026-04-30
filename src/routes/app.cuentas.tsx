import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Account } from "@/lib/types";

export const Route = createFileRoute("/app/cuentas")({
  component: CuentasPage,
});

const TIPOS = ["Real","Demo","Prop Firm","Fondeo","Otra"];
const BROKERS = ["FTMO","TopStep","MyForexFunds","Interactive Brokers","Pepperstone","ICMarkets","Otro"];

function CuentasPage() {
  const { accounts: { accounts, save, update, remove, loading }, trades: { trades } } = useApp();
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<string | null>(null);
  const [form, setForm]           = useState<Partial<Account>>({ activa: true, moneda: "USD" });
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");

  const resetForm = () => { setForm({ activa: true, moneda: "USD" }); setErr(""); };

  const handleSave = async () => {
    if (!form.nombre?.trim()) return setErr("El nombre es obligatorio");
    setSaving(true);
    try {
      if (editing) {
        await update(editing, form);
        setEditing(null);
      } else {
        await save({
          user_id: "",
          nombre: form.nombre!,
          broker: form.broker ?? null,
          tipo: form.tipo ?? null,
          balance: form.balance ?? null,
          moneda: form.moneda ?? "USD",
          activa: form.activa ?? true,
          notas: form.notas ?? null,
        });
        setShowForm(false);
      }
      resetForm();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error guardando"); }
    finally { setSaving(false); }
  };

  const handleEdit = (a: Account) => {
    setEditing(a.id);
    setForm({ nombre: a.nombre, broker: a.broker ?? "", tipo: a.tipo ?? "", balance: a.balance ?? undefined, moneda: a.moneda ?? "USD", activa: a.activa ?? true, notas: a.notas ?? "" });
  };

  // Stats per account
  const accountStats = (nombre: string) => {
    const t = trades.filter(tr => tr.cuenta === nombre && tr.resultado != null);
    const wins = t.filter(tr => (tr.resultado??0) > 0);
    const pnl  = t.reduce((s,tr) => s+(tr.resultado??0), 0);
    return { total: t.length, wins: wins.length, pnl };
  };

  const FormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre *</label>
          <input value={form.nombre ?? ""} onChange={e => setForm(f=>({...f,nombre:e.target.value}))}
            placeholder="Mi cuenta real" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Broker</label>
          <select value={form.broker ?? ""} onChange={e => setForm(f=>({...f,broker:e.target.value}))}
            className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {BROKERS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo</label>
          <select value={form.tipo ?? ""} onChange={e => setForm(f=>({...f,tipo:e.target.value}))}
            className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance ($)</label>
          <input type="number" value={form.balance ?? ""} onChange={e => setForm(f=>({...f,balance:Number(e.target.value)}))}
            placeholder="10000" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notas</label>
        <input value={form.notas ?? ""} onChange={e => setForm(f=>({...f,notas:e.target.value}))}
          placeholder="Descripción opcional..." className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setForm(f=>({...f,activa:!f.activa}))}
          className={`w-10 h-5 rounded-full transition-colors ${form.activa ? "bg-success" : "bg-surface-3"} relative`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.activa ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm text-muted-foreground">Cuenta activa</span>
      </div>
      {err && <div className="text-destructive text-xs">{err}</div>}
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" /> Gestión
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-sm text-muted-foreground mt-1">{accounts.length} cuentas registradas</p>
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nueva cuenta
        </button>
      </div>

      {/* New account form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Nueva cuenta</div>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <FormFields />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar cuenta"}
            </button>
          </div>
        </div>
      )}

      {/* Accounts grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando cuentas…</div>
      ) : accounts.length === 0 ? (
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
              <div key={a.id} className={`rounded-2xl border bg-card/60 backdrop-blur overflow-hidden ${a.activa ? "border-border" : "border-border/50 opacity-60"}`}>
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${a.activa ? "bg-success" : "bg-muted-foreground"}`} />
                        <span className="font-bold text-base">{a.nombre}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {a.broker && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.broker}</span>}
                        {a.tipo   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.tipo}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if(confirm("¿Eliminar esta cuenta?")) remove(a.id); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                    <FormFields />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(null); resetForm(); }} className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-surface transition">Cancelar</button>
                      <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition disabled:opacity-50">
                        {saving ? "…" : <><Check className="h-3 w-3 inline mr-1"/>Guardar</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 pb-5 border-t border-border pt-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ops</div>
                        <div className="font-mono font-bold mt-0.5">{stats.total}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">WR</div>
                        <div className="font-mono font-bold mt-0.5">{stats.total ? Math.round(stats.wins/stats.total*100)+"%" : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">P&L</div>
                        <div className={`font-mono font-bold mt-0.5 ${stats.pnl>=0?"text-success":"text-destructive"}`}>
                          {stats.total ? (stats.pnl>=0?"+":"-")+"$"+Math.abs(stats.pnl).toFixed(0) : "—"}
                        </div>
                      </div>
                    </div>
                    {a.balance && (
                      <div className="mt-3 text-xs text-muted-foreground text-center font-mono">
                        Balance: ${a.balance.toLocaleString()} {a.moneda}
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
    </div>
  );
}
