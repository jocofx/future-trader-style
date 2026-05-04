import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { useAfiliados } from "@/hooks/useAfiliados";
import { useEffect, useMemo, useState } from "react";
import {
  Users2, Copy, Check, DollarSign, Share2, TrendingUp, Gift, Crown,
  Twitter, Send, Mail, Sparkles, Zap, ArrowUpRight, Trophy,
  Wallet, Clock, ExternalLink, AlertCircle, ChevronRight, X,
} from "lucide-react";

export const Route = createFileRoute("/app/afiliados")({ component: AfiliadosPage });

const fmtUSD = (n: number) => `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:  { label: "Activo",    cls: "text-success bg-success/10 border-success/25" },
  trial:   { label: "Prueba",    cls: "text-info bg-info/10 border-info/25" },
  churned: { label: "Cancelado", cls: "text-muted-foreground bg-surface-3 border-border" },
  paid:    { label: "Pagado",    cls: "text-success bg-success/10 border-success/25" },
  pending: { label: "Pendiente", cls: "text-warning bg-warning/10 border-warning/25" },
};

function convStatus(c: { monto: number; pagado: boolean }) {
  if (c.pagado) return "paid";
  if (c.monto > 0) return "active";
  return "trial";
}

// ── Payout Request Modal ──────────────────────────────────────────
function PayoutModal({ amount, onClose, onSubmit }: {
  amount: number;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [method, setMethod] = useState<"paypal"|"wise"|"bank">("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wiseEmail,   setWiseEmail]   = useState("");
  const [bankIban,    setBankIban]    = useState("");
  const [bankName,    setBankName]    = useState("");
  const [bankHolder,  setBankHolder]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [err,         setErr]         = useState("");

  const handleSubmit = async () => {
    setErr("");
    if (method === "paypal" && !paypalEmail.includes("@")) return setErr("Introduce un email de PayPal válido");
    if (method === "wise"   && !wiseEmail.includes("@"))   return setErr("Introduce un email de Wise válido");
    if (method === "bank"   && bankIban.length < 10)        return setErr("Introduce un IBAN válido");
    if (method === "bank"   && !bankHolder.trim())          return setErr("Introduce el titular de la cuenta");

    setSubmitting(true);
    try {
      await onSubmit({
        method,
        paypal_email: method === "paypal" ? paypalEmail : undefined,
        wise_email:   method === "wise"   ? wiseEmail   : undefined,
        bank_iban:    method === "bank"   ? bankIban    : undefined,
        bank_name:    method === "bank"   ? bankName    : undefined,
        bank_holder:  method === "bank"   ? bankHolder  : undefined,
      });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al enviar solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const METHODS = [
    { key: "paypal" as const, label: "PayPal",       icon: "🅿️",  desc: "Más rápido, 1-2 días" },
    { key: "wise"   as const, label: "Wise",          icon: "🌍",  desc: "Internacional, mejor cambio" },
    { key: "bank"   as const, label: "Transferencia", icon: "🏦",  desc: "3-5 días hábiles" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-bold text-base">Solicitar retiro</div>
            <div className="text-xs text-muted-foreground mt-0.5">Importe disponible: <span className="font-mono font-bold text-success">{fmtUSD(amount)}</span></div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Method selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(m => (
                <button key={m.key} onClick={() => setMethod(m.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                    method === m.key
                      ? "border-primary/50 bg-primary/8 text-primary"
                      : "border-border bg-surface-2/40 text-muted-foreground hover:border-primary/30"
                  }`}>
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-xs font-semibold">{m.label}</span>
                  <span className="text-[10px] opacity-70">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment details */}
          {method === "paypal" && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Email de PayPal</label>
              <input value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)}
                placeholder="tu@paypal.com" type="email"
                className="w-full bg-surface/80 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          {method === "wise" && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Email de Wise</label>
              <input value={wiseEmail} onChange={e => setWiseEmail(e.target.value)}
                placeholder="tu@wise.com" type="email"
                className="w-full bg-surface/80 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          {method === "bank" && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">IBAN</label>
                <input value={bankIban} onChange={e => setBankIban(e.target.value.toUpperCase())}
                  placeholder="ES12 3456 7890 1234 5678 9012"
                  className="w-full bg-surface/80 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Titular de la cuenta</label>
                <input value={bankHolder} onChange={e => setBankHolder(e.target.value)}
                  placeholder="Nombre Apellidos"
                  className="w-full bg-surface/80 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Banco (opcional)</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)}
                  placeholder="Nombre del banco"
                  className="w-full bg-surface/80 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="rounded-xl bg-info/5 border border-info/20 p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 text-info font-semibold"><AlertCircle className="h-3.5 w-3.5" />Información</div>
            <div>• Los pagos se procesan manualmente en los primeros 5 días de cada mes.</div>
            <div>• Mínimo de retiro: <span className="font-semibold text-foreground">$20</span></div>
            <div>• Recibirás confirmación por email cuando se procese.</div>
          </div>

          {err && <div className="text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{err}</div>}

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={submitting || amount < 20}
              className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? "Enviando…" : <><Check className="h-4 w-4" />Solicitar {fmtUSD(amount)}</>}
            </button>
          </div>
          {amount < 20 && (
            <div className="text-center text-xs text-muted-foreground">Mínimo $20 para solicitar retiro (tienes {fmtUSD(amount)})</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AfiliadosPage() {
  const { user, plan } = useApp();
  const aff = useAfiliados(user?.id ?? null, plan);

  useEffect(() => { if (user) aff.load(); }, [user?.id]);

  const [copied, setCopied] = useState<"code" | "url" | null>(null);
  const [payoutRequested, setPayoutRequested] = useState(false);

  // Fallback code from user id if no profile yet
  const code = aff.profile?.codigo ?? ("TRADYNCAPP-" + (user?.id ?? "XXXX").slice(0, 6).toUpperCase());
  const url  = `https://tradyncapp.com/r/${code.toLowerCase()}`;

  // Use stats computed by the hook from real schema
  const s          = aff.stats;
  const commission = aff.commission;
  const stats = {
    active:     s.activos,
    trial:      aff.conversions.filter(c => !c.pagado && c.monto === 0).length,
    earned:     s.totalGanado,
    pending:    s.pendiente,
    paid:       s.pagado,
    clicks:     s.totalClicks,
    conv:       s.convRate,
    commission,
    total:      aff.conversions.length,
  };

  const tierInfo = useMemo(() => {
    // Tiers depend on current plan
    const isPro   = plan === "pro";
    const isBasic = plan === "basic";
    const tiers = isPro
      ? [
          { label: "Pro Base",    min: 0,  pct: 30, color: "text-primary" },
          { label: "Pro Plata",   min: 5,  pct: 40, color: "text-slate-400" },
          { label: "Pro Platino", min: 10, pct: 50, color: "text-warning" },
        ]
      : isBasic
      ? [
          { label: "Basic Base",  min: 0,  pct: 20, color: "text-orange-400" },
          { label: "Basic Plata", min: 5,  pct: 25, color: "text-slate-400" },
          { label: "Basic Oro",   min: 10, pct: 30, color: "text-success" },
        ]
      : [
          { label: "Free",        min: 0,  pct: 15, color: "text-muted-foreground" },
        ];
    const current = [...tiers].reverse().find(t => stats.active >= t.min) ?? tiers[0];
    const next    = tiers[tiers.indexOf(current) + 1];
    const progress = next
      ? Math.min(100, ((stats.active - current.min) / (next.min - current.min)) * 100)
      : 100;
    return { current, next, progress, tiers, isPro, isBasic };
  }, [stats.active, plan]);

  const copy = async (val: string, kind: "code" | "url") => {
    try { await navigator.clipboard.writeText(val); setCopied(kind); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  const share = (network: "twitter" | "telegram" | "email") => {
    const text = encodeURIComponent("Llevo meses usando TradyncApp para mi journal de trading y mi disciplina ha cambiado. Pruébalo gratis:");
    const u = encodeURIComponent(url);
    const links = {
      twitter:  `https://twitter.com/intent/tweet?text=${text}&url=${u}`,
      telegram: `https://t.me/share/url?url=${u}&text=${text}`,
      email:    `mailto:?subject=${encodeURIComponent("Te recomiendo TradyncApp")}&body=${text}%20${u}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer");
  };

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutSuccess,   setPayoutSuccess]   = useState(false);

  const handlePayoutSubmit = async (data: any) => {
    await aff.requestPayout(data);
    setPayoutSuccess(true);
    setTimeout(() => setPayoutSuccess(false), 4000);
    await aff.load();
  };

  if (aff.loading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Cargando datos de afiliado…</div>
  );

  return (
    <>
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
          <Users2 className="h-3.5 w-3.5 text-primary" /> Programa de Afiliados
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Gana {stats.commission}% recurrente
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Refiere traders, gana cada mes mientras sigan suscritos. Sin límites.
        </p>
      </div>

      {/* Error */}
      {aff.error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/8 text-warning text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {aff.error}
        </div>
      )}

      {/* Hero — Earnings */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface/60 to-surface/40 backdrop-blur-xl p-6 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)" }} />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
              <Wallet className="h-3 w-3 text-primary" /> Total ganado
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl md:text-5xl font-bold font-mono">{fmtUSD(stats.earned)}</span>
              {stats.pending > 0 && (
                <span className="text-xs px-2 py-1 rounded-md bg-success/10 text-success border border-success/25 font-mono">
                  +{fmtUSD(stats.pending)} pendiente
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> {fmtUSD(stats.paid)} pagado</span>
              {stats.pending > 0 && <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-warning" /> {fmtUSD(stats.pending)} en cola</span>}
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-info" /> {stats.clicks} clics en tu enlace</span>
            </div>
          </div>
          <button onClick={() => setShowPayoutModal(true)}
            disabled={stats.pending < 20}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-glow inline-flex items-center gap-2 disabled:opacity-40">
            <Wallet className="h-4 w-4" />
            {stats.pending >= 20 ? `Retirar ${fmtUSD(stats.pending)}` : `Mínimo $20 (tienes ${fmtUSD(stats.pending)})`}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Referidos activos", value: String(stats.active),               sub: `${stats.total} totales`,     Icon: Users2,    tone: "text-success" },
          { label: "En prueba",         value: String(stats.trial),                sub: "Convirtiendo…",              Icon: Sparkles,  tone: "text-info" },
          { label: "Tasa conversión",   value: `${stats.conv.toFixed(0)}%`,        sub: "Trial → activo",             Icon: TrendingUp,tone: "text-primary" },
          { label: "Comisión actual",   value: `${stats.commission}%`,             sub: `Nivel ${tierInfo.current.label}`,Icon: Gift,  tone: tierInfo.current.color },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${k.tone}`}>{k.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
              </div>
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <k.Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral link + tier */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Link */}
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Share2 className="h-4 w-4 text-primary" /> Tu enlace de afiliado
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Código</div>
              <div className="flex gap-2">
                <input readOnly value={code}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface-2/60 border border-border text-sm font-mono font-semibold text-primary focus:outline-none" />
                <button onClick={() => copy(code, "code")}
                  className="h-10 px-3 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium inline-flex items-center gap-1.5">
                  {copied === "code" ? <><Check className="h-3.5 w-3.5 text-success" />Copiado</> : <><Copy className="h-3.5 w-3.5" />Copiar</>}
                </button>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Enlace directo</div>
              <div className="flex gap-2">
                <input readOnly value={url}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface-2/60 border border-border text-sm font-mono focus:outline-none" />
                <button onClick={() => copy(url, "url")}
                  className="h-10 px-3 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium inline-flex items-center gap-1.5">
                  {copied === "url" ? <><Check className="h-3.5 w-3.5 text-success" />Copiado</> : <><Copy className="h-3.5 w-3.5" />Copiar</>}
                </button>
              </div>
            </div>
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Compartir en</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { net: "twitter"  as const, Icon: Twitter, label: "Twitter / X" },
                  { net: "telegram" as const, Icon: Send,    label: "Telegram" },
                  { net: "email"    as const, Icon: Mail,    label: "Email" },
                ].map(s => (
                  <button key={s.label} onClick={() => share(s.net)}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border bg-surface-2/40 hover:border-primary/40 hover:text-primary transition text-xs">
                    <s.Icon className="h-4 w-4" /> {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tier */}
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 flex flex-col">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-warning" /> Tu nivel de afiliado
          </div>
          <div className="text-center py-2">
            <Crown className={`h-10 w-10 mx-auto mb-2 ${tierInfo.current.color}`} />
            <div className={`text-sm uppercase tracking-wider font-bold ${tierInfo.current.color}`}>
              {tierInfo.current.label} · {tierInfo.current.pct}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{stats.active} referidos activos</div>
          </div>
          {tierInfo.next && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-warning to-primary transition-all"
                  style={{ width: `${tierInfo.progress}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Próximo: <span className="text-foreground font-medium">{tierInfo.next.label} ({tierInfo.next.pct}%) — {tierInfo.next.min - stats.active} más</span>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-[11px]">
            {tierInfo.tiers.map(t => (
              <div key={t.label} className={`flex items-center justify-between ${t.pct === commission ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                <span className="flex items-center gap-1">
                  {t.pct === commission && <ChevronRight className="h-3 w-3 text-primary" />}
                  {t.label} {t.min > 0 ? `(${t.min}+ ref.)` : "(base)"}
                </span>
                <span className={`font-mono ${t.pct === commission ? "text-primary" : ""}`}>{t.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversions table */}
      <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Users2 className="h-4 w-4 text-primary" /> Mis referidos
          </div>
          <span className="text-[11px] text-muted-foreground">{aff.conversions.length} en total</span>
        </div>
        {aff.conversions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-3xl">🔗</div>
            <div className="text-sm font-semibold">Aún no tienes referidos</div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Comparte tu código <span className="font-mono text-primary">{code}</span> y empieza a ganar comisiones recurrentes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                  {["Usuario", "Plan", "Estado", "Desde", "Generado"].map(h => (
                    <th key={h} className="text-left font-medium py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aff.conversions.map(c => {
                  const meta = STATUS_META[convStatus(c)] ?? STATUS_META.trial;
                  const initials = (c.referred_email ?? "??").slice(0, 2).toUpperCase();
                  return (
                    <tr key={c.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 grid place-items-center text-[11px] font-bold text-primary shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{c.referred_email ?? "Usuario referido"}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">{c.mes ?? c.created_at.slice(0,7)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-mono">{c.plan ?? "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                        {new Date(c.created_at).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                        {c.mes && <span className="ml-1 text-muted-foreground/60">({c.mes})</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">{fmtUSD(c.comision ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade CTA for free/basic users */}
      {!tierInfo.isPro && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-surface/40 p-5">
          <div className="flex items-start gap-4">
            <div className="text-2xl shrink-0">🚀</div>
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">
                {tierInfo.isBasic
                  ? "Pásate a Pro y empieza desde el 30% — no el 20%"
                  : "Activa Basic o Pro para ganar comisiones reales"}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {tierInfo.isBasic
                  ? `Con Pro empezarías ganando un 30% desde el primer referido (ahora ganas 20%). Con 10 referidos llegarías al 50%.`
                  : `Con el plan Free estás limitado al 15%. Basic te da 20% base, Pro te da 30% base con opción de llegar al 50%.`}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <div className={`px-3 py-1.5 rounded-lg border font-semibold ${tierInfo.isBasic ? "border-border text-muted-foreground" : "border-border text-muted-foreground"}`}>
                  Free: 15% fijo
                </div>
                <div className={`px-3 py-1.5 rounded-lg border font-semibold ${tierInfo.isBasic ? "border-primary/30 bg-primary/8 text-primary" : "border-border text-muted-foreground"}`}>
                  Basic: 20%→30%
                </div>
                <div className="px-3 py-1.5 rounded-lg border border-warning/30 bg-warning/8 text-warning font-semibold">
                  Pro: 30%→50% 🔥
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> ¿Cómo funciona?
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "1", icon: "🔗", title: "Comparte tu enlace", desc: "Copia tu código o enlace y compártelo en tus redes, comunidades o con traders que conozcas." },
            { step: "2", icon: "👤", title: "Se registran gratis", desc: "Tu referido se registra con tu código. Empieza el trial gratuito de 14 días sin tarjeta." },
            { step: "3", icon: "💳", title: "Se suscriben", desc: "Cuando tu referido activa un plan de pago, empieza a generar comisión para ti." },
            { step: "4", icon: "💰", title: "Cobras cada mes", desc: `Ganas el ${stats.commission}% de su suscripción mientras siga activo. Para siempre.` },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center gap-2">
              <div className="text-2xl">{s.icon}</div>
              <div className="text-xs font-bold text-foreground">{s.title}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Payout modal */}
    {showPayoutModal && (
      <PayoutModal
        amount={stats.pending}
        onClose={() => setShowPayoutModal(false)}
        onSubmit={handlePayoutSubmit}
      />
    )}

    {/* Success toast */}
    {payoutSuccess && (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-success text-white shadow-lg text-sm font-semibold">
        <Check className="h-4 w-4" /> Solicitud enviada — te avisamos cuando se procese
      </div>
    )}
    </>
  );
}
