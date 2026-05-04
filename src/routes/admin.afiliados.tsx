import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ShieldCheck, Check, X, Clock, DollarSign, Users2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/afiliados")({ component: AdminAfiliadosPage });

// ── Admin user ID — only this user can access ──────────────────────
const ADMIN_USER_ID = "7b14f1e1-4e5a-41e9-a3cc-48161ca41adb";

const fmtUSD = (n: number) => `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Payout = {
  id:           string
  affiliate_id: string
  user_id:      string
  amount:       number
  method:       string
  paypal_email: string | null
  wise_email:   string | null
  bank_iban:    string | null
  bank_name:    string | null
  bank_holder:  string | null
  status:       string
  admin_notes:  string | null
  requested_at: string
  processed_at: string | null
  affiliates?: { codigo: string; nombre: string | null; email: string | null }
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pendiente",  cls: "text-warning bg-warning/10 border-warning/30" },
  approved: { label: "Aprobado",   cls: "text-info bg-info/10 border-info/30" },
  paid:     { label: "Pagado",     cls: "text-success bg-success/10 border-success/30" },
  rejected: { label: "Rechazado",  cls: "text-destructive bg-destructive/10 border-destructive/30" },
};

const METHOD_ICONS: Record<string, string> = { paypal: "🅿️", wise: "🌍", bank: "🏦" };

function AdminAfiliadosPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [payouts,  setPayouts]  = useState<Payout[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState<"all"|"pending"|"approved"|"paid">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes,    setNotes]    = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState<string | null>(null);

  // Guard — only admin
  useEffect(() => {
    if (user && user.id !== ADMIN_USER_ID) navigate({ to: "/app" });
  }, [user]);

  const load = async () => {
    setLoading(true);
    const q = supabase
      .from("affiliate_payouts")
      .select("*, affiliates(codigo, nombre, email)")
      .order("requested_at", { ascending: false });

    const { data } = filter === "all" ? await q : await q.eq("status", filter);
    setPayouts((data ?? []) as Payout[]);
    setLoading(false);
  };

  useEffect(() => { if (user?.id === ADMIN_USER_ID) load(); }, [filter, user]);

  const updateStatus = async (id: string, status: string) => {
    setSaving(id);
    await supabase.from("affiliate_payouts").update({
      status,
      admin_notes:  notes[id] ?? null,
      processed_at: ["paid", "rejected"].includes(status) ? new Date().toISOString() : null,
    }).eq("id", id);
    await load();
    setSaving(null);
  };

  const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalPaid    = payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  if (!user || user.id !== ADMIN_USER_ID) return null;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin — Pagos de Afiliados</h1>
            <p className="text-sm text-muted-foreground">Gestiona solicitudes de retiro</p>
          </div>
        </div>
        <button onClick={load} className="h-9 px-4 rounded-xl border border-border text-sm hover:bg-surface transition flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Por pagar",      value: fmtUSD(totalPending), color: "text-warning",  Icon: Clock },
          { label: "Total pagado",   value: fmtUSD(totalPaid),    color: "text-success",  Icon: DollarSign },
          { label: "Solicitudes",    value: String(payouts.filter(p => p.status === "pending").length), color: "text-primary", Icon: Users2 },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-4 flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <s.Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-surface/60 border border-border rounded-xl p-1 gap-1">
        {(["pending", "approved", "paid", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition capitalize ${filter === f ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "Todos" : STATUS_META[f]?.label}
          </button>
        ))}
      </div>

      {/* Payouts list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Cargando…</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <div className="text-3xl mb-2">✅</div>
            Sin solicitudes {filter !== "all" ? `en estado "${STATUS_META[filter]?.label}"` : ""}
          </div>
        ) : payouts.map(p => {
          const meta = STATUS_META[p.status] ?? STATUS_META.pending;
          const isOpen = expanded === p.id;
          const paymentDetail = p.method === "paypal" ? p.paypal_email
            : p.method === "wise" ? p.wise_email
            : `${p.bank_holder} · ${p.bank_iban}`;

          return (
            <div key={p.id} className={`rounded-2xl border bg-card/60 overflow-hidden transition ${p.status === "pending" ? "border-warning/20" : "border-border"}`}>
              {/* Row header */}
              <button onClick={() => setExpanded(isOpen ? null : p.id)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface/30 transition text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{METHOD_ICONS[p.method] ?? "💳"}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {p.affiliates?.nombre ?? p.affiliates?.email ?? "Afiliado"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {p.affiliates?.codigo} · {p.method.toUpperCase()} · {paymentDetail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-mono font-bold text-base">{fmtUSD(p.amount)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(p.requested_at).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.cls}`}>
                    {meta.label}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded actions */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                  {/* Payment details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Método</div>
                      <div className="font-semibold">{METHOD_ICONS[p.method]} {p.method.charAt(0).toUpperCase() + p.method.slice(1)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Destino del pago</div>
                      <div className="font-mono text-sm break-all">
                        {p.method === "paypal" && p.paypal_email}
                        {p.method === "wise"   && p.wise_email}
                        {p.method === "bank"   && (
                          <div className="space-y-0.5">
                            <div>{p.bank_holder}</div>
                            <div className="text-muted-foreground">{p.bank_iban}</div>
                            {p.bank_name && <div className="text-muted-foreground text-xs">{p.bank_name}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Email afiliado</div>
                      <div className="font-mono text-sm">{p.affiliates?.email ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Importe</div>
                      <div className="font-mono font-bold text-lg text-primary">{fmtUSD(p.amount)}</div>
                    </div>
                  </div>

                  {/* Admin notes */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">
                      Notas internas (visibles solo para admin)
                    </label>
                    <textarea
                      value={notes[p.id] ?? p.admin_notes ?? ""}
                      onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                      placeholder="Referencia del pago, observaciones…"
                      rows={2}
                      className="w-full bg-surface/80 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {p.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(p.id, "approved")} disabled={saving === p.id}
                          className="flex-1 h-9 rounded-xl border border-info/30 bg-info/8 text-info text-sm font-semibold hover:bg-info/15 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                          <Check className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button onClick={() => updateStatus(p.id, "rejected")} disabled={saving === p.id}
                          className="flex-1 h-9 rounded-xl border border-destructive/30 bg-destructive/8 text-destructive text-sm font-semibold hover:bg-destructive/15 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                          <X className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <button onClick={() => updateStatus(p.id, "paid")} disabled={saving === p.id}
                        className="flex-1 h-9 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> Marcar como PAGADO
                      </button>
                    )}
                    {(p.status === "paid" || p.status === "rejected") && (
                      <button onClick={() => updateStatus(p.id, "pending")} disabled={saving === p.id}
                        className="h-9 px-4 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground hover:bg-surface transition disabled:opacity-50">
                        Volver a pendiente
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
