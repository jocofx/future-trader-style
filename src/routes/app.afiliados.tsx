import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { useAfiliados } from "@/hooks/useAfiliados";
import { useEffect, useMemo, useState } from "react";
import {
  Users2, Copy, Check, DollarSign, Share2, TrendingUp, Gift, Crown,
  Twitter, Send, Mail, Sparkles, Zap, ArrowUpRight, Trophy,
  Wallet, Clock, ExternalLink, AlertCircle, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app/afiliados")({ component: AfiliadosPage });

const fmtUSD = (n: number) => `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:  { label: "Activo",    cls: "text-success bg-success/10 border-success/25" },
  trial:   { label: "Prueba",    cls: "text-info bg-info/10 border-info/25" },
  churned: { label: "Cancelado", cls: "text-muted-foreground bg-surface-3 border-border" },
};

function AfiliadosPage() {
  const { user } = useApp();
  const aff = useAfiliados(user?.id ?? null);

  useEffect(() => { if (user) aff.load(); }, [user?.id]);

  const [copied, setCopied] = useState<"code" | "url" | null>(null);
  const [payoutRequested, setPayoutRequested] = useState(false);

  // Fallback code from user id if no profile yet
  const code = aff.profile?.code ?? ("TRADYNCAPP-" + (user?.id ?? "XXXX").slice(0, 6).toUpperCase());
  const url  = `https://tradyncapp.com/r/${code.toLowerCase()}`;

  const stats = useMemo(() => {
    const active  = aff.conversions.filter(c => c.status === "active").length;
    const trial   = aff.conversions.filter(c => c.status === "trial").length;
    const earned  = aff.profile?.total_earned ?? aff.conversions.reduce((s, c) => s + (c.earned ?? 0), 0);
    const pending = aff.profile?.pending ?? 0;
    const paid    = aff.profile?.total_paid ?? 0;
    const clicks  = aff.profile?.clicks ?? 0;
    const conv    = aff.conversions.length ? (active / aff.conversions.length) * 100 : 0;
    const commission = aff.profile?.commission ?? 30;
    return { active, trial, earned, pending, paid, clicks, conv, commission, total: aff.conversions.length };
  }, [aff.profile, aff.conversions]);

  const tierInfo = useMemo(() => {
    const tiers = [
      { label: "Bronce", min: 0,  max: 4,  pct: 30,  color: "text-orange-400" },
      { label: "Plata",  min: 5,  max: 9,  pct: 35,  color: "text-slate-400" },
      { label: "Oro",    min: 10, max: 24, pct: 40,  color: "text-warning" },
      { label: "Platino",min: 25, max: Infinity, pct: 50, color: "text-primary" },
    ];
    const current = [...tiers].reverse().find(t => stats.active >= t.min) ?? tiers[0];
    const next    = tiers[tiers.indexOf(current) + 1];
    const progress = next
      ? Math.min(100, ((stats.active - current.min) / (next.min - current.min)) * 100)
      : 100;
    return { current, next, progress };
  }, [stats.active]);

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

  const handlePayout = async () => {
    await aff.requestPayout();
    setPayoutRequested(true);
    setTimeout(() => setPayoutRequested(false), 3000);
  };

  if (aff.loading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Cargando datos de afiliado…</div>
  );

  return (
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
          {stats.pending > 0 && (
            <button onClick={handlePayout}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-glow inline-flex items-center gap-2">
              {payoutRequested ? <><Check className="h-4 w-4" />Solicitud enviada</> : <><Wallet className="h-4 w-4" />Solicitar pago</>}
            </button>
          )}
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
            {[
              { label: "Bronce (1–4 ref.)",  pct: 30 },
              { label: "Plata (5–9 ref.)",   pct: 35 },
              { label: "Oro (10–24 ref.)",   pct: 40 },
              { label: "Platino (25+ ref.)", pct: 50 },
            ].map(t => (
              <div key={t.label} className={`flex items-center justify-between ${t.pct === stats.commission ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                <span className="flex items-center gap-1">
                  {t.pct === stats.commission && <ChevronRight className="h-3 w-3 text-primary" />}
                  {t.label}
                </span>
                <span className="font-mono">{t.pct}%</span>
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
                  const meta = STATUS_META[c.status] ?? STATUS_META.trial;
                  const initials = (c.referred_name ?? c.referred_email ?? "??").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
                  return (
                    <tr key={c.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 grid place-items-center text-[11px] font-bold text-primary shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{c.referred_name ?? "Usuario"}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">{c.referred_email ?? "—"}</div>
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
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">{fmtUSD(c.earned ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
  );
}
