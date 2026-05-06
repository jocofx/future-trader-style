import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import {
  Wallet, Plus, Trash2, Edit2, Check, X, ChevronRight,
  TrendingUp, TrendingDown, Activity, BarChart3, Clock,
  Shield, Settings, Wifi, WifiOff,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Account, Trade } from "@/lib/types";

export const Route = createFileRoute("/app/cuentas")({ component: CuentasPage });

const TIPOS   = ["Real","Demo","Prop Firm","Fondeo","Otra"];
const BROKERS = ["FTMO","TopStep","MyForexFunds","Interactive Brokers",
                 "Pepperstone","ICMarkets","WSF Markets","Tradovate","Otro"];

function fmt(n: number) {
  return (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Account stats helper ───────────────────────────────────────────
function useAccountStats(trades: Trade[], nombre: string, numeroCuenta?: string | null) {
  return useMemo(() => {
    const num = numeroCuenta?.trim().toLowerCase();
    const ac  = nombre.trim().toLowerCase();
    const t = trades.filter(tr => {
      const tc = (tr.cuenta ?? "").trim().toLowerCase();
      const matches = tc === ac || (num ? tc === num : false) || ac.includes(tc);
      return matches && tr.resultado != null;
    });
    const wins = t.filter(tr => (tr.resultado ?? 0) > 0);
    const losses = t.filter(tr => (tr.resultado ?? 0) < 0);
    const pnl = t.reduce((s, tr) => s + (tr.resultado ?? 0), 0);
    const avgWin = wins.length ? wins.reduce((s, tr) => s + (tr.resultado ?? 0), 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, tr) => s + (tr.resultado ?? 0), 0) / losses.length : 0;
    const wr = t.length ? (wins.length / t.length) * 100 : 0;
    // Equity curve
    const sorted = [...t].sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""));
    let cum = 0;
    const curve = sorted.map(tr => ({ fecha: (tr.fecha ?? "").slice(5), value: parseFloat((cum += tr.resultado ?? 0).toFixed(2)) }));
    return { total: t.length, wins: wins.length, losses: losses.length, pnl, wr, avgWin, avgLoss, curve, trades: t };
  }, [trades, nombre]);
}

// ── Account Detail Modal ───────────────────────────────────────────
function AccountDetailModal({ account, trades, onClose, onEdit, onDelete }: {
  account: Account;
  trades: Trade[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stats = useAccountStats(trades, account.nombre, account.numero_cuenta);
  const [tab, setTab] = useState<"overview"|"trades"|"config">("overview");

  const recentTrades = useMemo(() =>
    [...stats.trades].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? "")).slice(0, 20),
    [stats.trades]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${account.activa ? "bg-success" : "bg-muted-foreground"}`} />
            <div>
              <div className="font-bold text-base">{account.nombre}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {account.broker && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{account.broker}</span>}
                {account.tipo   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{account.tipo}</span>}
                {account.plataforma && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{account.plataforma}</span>}
                {account.mt_conectada && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success flex items-center gap-1">
                    <Wifi className="h-2.5 w-2.5" /> EA conectado
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {([
            { key: "overview", label: "Resumen", Icon: BarChart3 },
            { key: "trades",   label: `Operaciones (${stats.total})`, Icon: Activity },
            { key: "config",   label: "Configuración", Icon: Settings },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${tab === key ? "bg-primary/8 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "P&L Total",      value: fmt(stats.pnl),                              color: stats.pnl >= 0 ? "text-success" : "text-destructive" },
                  { label: "Win Rate",        value: stats.total ? stats.wr.toFixed(1) + "%" : "—", color: stats.wr >= 50 ? "text-success" : "text-warning" },
                  { label: "Operaciones",     value: String(stats.total),                          color: "text-foreground" },
                  { label: "Balance actual",  value: account.balance != null ? "$" + Number(account.balance).toLocaleString() : "—", color: "text-primary" },
                  { label: "Ganancia media",  value: stats.avgWin ? fmt(stats.avgWin)  : "—",      color: "text-success" },
                  { label: "Pérdida media",   value: stats.avgLoss ? fmt(stats.avgLoss) : "—",     color: "text-destructive" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-surface/40 border border-border/60 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className={`text-lg font-bold font-mono mt-1 ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* EA live data if connected */}
              {account.mt_conectada && (account.ea_balance != null || account.ea_pnl_dia != null) && (
                <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                  <div className="text-xs font-semibold text-success mb-3 flex items-center gap-2">
                    <Wifi className="h-3.5 w-3.5" /> Datos en tiempo real del EA
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Balance EA",  value: account.ea_balance  != null ? "$" + Number(account.ea_balance).toLocaleString()  : "—" },
                      { label: "Equity",      value: account.ea_equity   != null ? "$" + Number(account.ea_equity).toLocaleString()   : "—" },
                      { label: "P&L hoy",     value: account.ea_pnl_dia  != null ? fmt(Number(account.ea_pnl_dia))                   : "—" },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                        <div className="text-sm font-bold font-mono mt-0.5">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account info */}
              <div className="rounded-xl border border-border bg-surface/30 p-4 space-y-2">
                {[
                  ["Número de cuenta", account.numero_cuenta],
                  ["Servidor",         account.servidor],
                  ["Divisa",           account.divisa],
                  ["Apalancamiento",   account.apalancamiento ? `1:${account.apalancamiento}` : null],
                  ["Fase",             account.fase],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TRADES ── */}
          {tab === "trades" && (
            <div className="space-y-2">
              {recentTrades.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <div className="text-3xl mb-2">📊</div>
                  Sin operaciones registradas para esta cuenta.
                  {account.mt_conectada && <div className="mt-1 text-xs">Las operaciones del EA se sincronizarán automáticamente.</div>}
                </div>
              ) : recentTrades.map(tr => (
                <div key={tr.id} className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                  (tr.resultado ?? 0) > 0 ? "border-success/20 bg-success/5" :
                  (tr.resultado ?? 0) < 0 ? "border-destructive/20 bg-destructive/5" :
                  "border-border bg-surface/30"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tr.tipo === "BUY" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                      {tr.tipo}
                    </div>
                    <div>
                      <div className="font-semibold">{tr.instrumento}</div>
                      <div className="text-[10px] text-muted-foreground">{(tr.fecha ?? "").slice(0, 10)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold ${(tr.resultado ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                      {tr.resultado != null ? fmt(tr.resultado) : "—"}
                    </div>
                    {tr.entrada != null && (
                      <div className="text-[10px] text-muted-foreground font-mono">@ {tr.entrada}</div>
                    )}
                  </div>
                </div>
              ))}
              {stats.trades.length > 20 && (
                <div className="text-center text-xs text-muted-foreground pt-2">
                  Mostrando las 20 más recientes de {stats.trades.length} operaciones
                </div>
              )}
            </div>
          )}

          {/* ── CONFIG ── */}
          {tab === "config" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface/30 p-4 space-y-3">
                <div className="text-xs font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Información de la cuenta
                </div>
                {[
                  ["Nombre",    account.nombre],
                  ["Broker",    account.broker],
                  ["Tipo",      account.tipo],
                  ["Balance",   account.balance != null ? "$" + Number(account.balance).toLocaleString() : null],
                  ["Divisa",    account.divisa],
                  ["Servidor",  account.servidor],
                  ["Plataforma",account.plataforma],
                  ["Nº cuenta", account.numero_cuenta],
                  ["Apalancamiento", account.apalancamiento ? `1:${account.apalancamiento}` : null],
                  ["Estado",    account.activa ? "Activa" : "Inactiva"],
                  ["EA conectado", account.mt_conectada ? "Sí" : "No"],
                ].filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={onEdit}
                className="w-full h-10 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition flex items-center justify-center gap-2">
                <Edit2 className="h-4 w-4" /> Editar cuenta
              </button>
              <button onClick={onDelete}
                className="w-full h-10 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" /> Eliminar cuenta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
function CuentasPage() {
  const { accounts: { accounts, save, update, remove, loading }, trades: { trades } } = useApp();
  const { limits, plan } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canAddAccount = () => {
    if (limits.max_accounts === Infinity) return true;
    return accounts.length < limits.max_accounts;
  };

  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [detailId,   setDetailId]   = useState<string | null>(null);

  const [nombre,  setNombre]  = useState("");
  const [broker,  setBroker]  = useState("");
  const [tipo,    setTipo]    = useState("");
  const [balance, setBalance] = useState<string>("");
  const [moneda,  setMoneda]  = useState("USD");
  const [activa,  setActiva]  = useState(true);

  const resetForm = useCallback(() => {
    setNombre(""); setBroker(""); setTipo(""); setBalance("");
    setMoneda("USD"); setActiva(true); setErr("");
  }, []);

  const loadIntoForm = (a: Account) => {
    setNombre(a.nombre ?? "");
    setBroker(a.broker ?? "");
    setTipo(a.tipo ?? "");
    setBalance(a.balance != null ? String(a.balance) : "");
    setMoneda(a.divisa ?? "USD");
    setActiva(a.activa ?? true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) return setErr("El nombre es obligatorio");
    setSaving(true); setErr("");
    try {
      const payload = {
        nombre:  nombre.trim(),
        broker:  broker  || null,
        tipo:    tipo    || null,
        balance: balance ? Number(balance) : null,
        divisa:  moneda  || "USD",
        activa,
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
      setErr(e instanceof Error ? e.message : "Error guardando");
      console.error(e);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    setDetailId(null);
    await remove(id).catch(console.error);
  };

  const detailAccount = detailId ? accounts.find(a => a.id === detailId) : null;

  // Stats per account for card preview
  const cardStats = (a: Account) => {
    const num = a.numero_cuenta?.trim().toLowerCase();
    const ac = a.nombre.trim().toLowerCase();
    const t = trades.filter(tr => {
      const tc = (tr.cuenta ?? "").trim().toLowerCase();
      return (tc === ac || (num ? tc === num : false) || (num ? ac.includes(tc) : false)) && tr.resultado != null;
    });
    const wins = t.filter(tr => (tr.resultado ?? 0) > 0);
    const pnl = t.reduce((s, tr) => s + (tr.resultado ?? 0), 0);
    return { total: t.length, wr: t.length ? Math.round(wins.length / t.length * 100) : null, pnl };
  };

  // Form JSX (reusable)
  const formFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre *</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Mi cuenta real"
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Broker</label>
          <select value={broker} onChange={e => setBroker(e.target.value)}
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {BROKERS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance</label>
          <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="10000"
            className="mt-1 w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setActiva(v => !v)}
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
          <p className="text-sm text-muted-foreground mt-1">
            {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => {
            if (!canAddAccount()) { setShowUpgradeModal(true); return; }
            resetForm(); setEditing(null); setShowForm(v => !v);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nueva cuenta
          {limits.max_accounts !== Infinity && (
            <span className="text-[10px] opacity-70">({accounts.length}/{limits.max_accounts})</span>
          )}
        </button>
      </div>

      {/* New account form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Nueva cuenta</div>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          {formFields}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar cuenta"}
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Editando cuenta</div>
            <button onClick={() => { setEditing(null); resetForm(); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          {formFields}
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setEditing(null); resetForm(); }} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50">
              {saving ? "Guardando…" : <><Check className="h-4 w-4 inline mr-1" />Guardar cambios</>}
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
            const s = cardStats(a);
            return (
              <button key={a.id} onClick={() => setDetailId(a.id)}
                className={`text-left rounded-2xl border bg-card/60 backdrop-blur overflow-hidden hover:border-primary/30 hover:shadow-lg transition group ${a.activa ? "border-border" : "border-border/50 opacity-60"}`}>
                <div className="p-5">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${a.activa ? "bg-success" : "bg-muted-foreground"}`} />
                        <span className="font-bold text-base">{a.nombre}</span>
                        {a.mt_conectada && <Wifi className="h-3.5 w-3.5 text-success" />}
                      </div>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {a.broker && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.broker}</span>}
                        {a.tipo   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.tipo}</span>}
                        {a.plataforma && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">{a.plataforma}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ops</div>
                      <div className="font-mono font-bold mt-0.5">{s.total}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">WR</div>
                      <div className="font-mono font-bold mt-0.5">{s.total ? s.wr + "%" : "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">P&L</div>
                      <div className={`font-mono font-bold mt-0.5 ${s.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {s.total ? fmt(s.pnl) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  {(a.balance != null || a.ea_balance != null) && (
                    <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground text-center font-mono">
                      Balance: ${Number(a.ea_balance ?? a.balance).toLocaleString()} {a.divisa ?? "USD"}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailAccount && (
        <AccountDetailModal
          account={detailAccount}
          trades={trades}
          onClose={() => setDetailId(null)}
          onEdit={() => { loadIntoForm(detailAccount); setEditing(detailAccount.id); setDetailId(null); }}
          onDelete={() => { setConfirmId(detailAccount.id); setDetailId(null); }}
        />
      )}

      <UpgradeModal open={showUpgradeModal} feature="max_accounts" onClose={() => setShowUpgradeModal(false)} />
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
