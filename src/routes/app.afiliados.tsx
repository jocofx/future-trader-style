import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users2, Copy, Check, DollarSign, Share2, TrendingUp, Gift, Crown,
  Twitter, Instagram, Send, Mail, Sparkles, Zap, ArrowUpRight, Trophy,
  Wallet, Clock, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/app/afiliados")({
  head: () => ({
    meta: [
      { title: "Afiliados · Tradync" },
      { name: "description", content: "Gana 30% recurrente refiriendo traders disciplinados a Tradync." },
    ],
  }),
  component: AfiliadosPage,
});

const fmtUSD = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Referral = {
  id: string;
  name: string;
  email: string;
  status: "trial" | "active" | "churned";
  plan: "Pro" | "Elite" | "—";
  joined: string;
  earned: number;
};

type Payout = {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "processing";
  method: string;
};

const REFERRALS: Referral[] = [
  { id: "r1", name: "Carlos M.",  email: "carlos.m@gmail.com",  status: "active", plan: "Elite", joined: "12 Mar 2026", earned: 89.70 },
  { id: "r2", name: "Lucía P.",   email: "lucia.p@outlook.com", status: "active", plan: "Pro",   joined: "28 Feb 2026", earned: 47.40 },
  { id: "r3", name: "Diego R.",   email: "d.rodriguez@me.com",  status: "active", plan: "Pro",   joined: "15 Feb 2026", earned: 71.10 },
  { id: "r4", name: "Sofía V.",   email: "sofia.v@gmail.com",   status: "trial",  plan: "—",     joined: "25 Abr 2026", earned: 0 },
  { id: "r5", name: "Andrés G.",  email: "andres@yahoo.es",     status: "active", plan: "Elite", joined: "08 Ene 2026", earned: 134.55 },
  { id: "r6", name: "María T.",   email: "maria.t@gmail.com",   status: "churned",plan: "—",     joined: "20 Dic 2025", earned: 23.70 },
];

const PAYOUTS: Payout[] = [
  { id: "p1", date: "01 Abr 2026", amount: 142.30, status: "paid",       method: "PayPal" },
  { id: "p2", date: "01 Mar 2026", amount: 98.50,  status: "paid",       method: "PayPal" },
  { id: "p3", date: "01 Feb 2026", amount: 76.20,  status: "paid",       method: "Wise" },
  { id: "p4", date: "01 May 2026", amount: 124.85, status: "pending",    method: "PayPal" },
];

const STATUS_META = {
  active:  { label: "Activo",   cls: "text-success bg-success/10 border-success/25" },
  trial:   { label: "Prueba",   cls: "text-info bg-info/10 border-info/25" },
  churned: { label: "Cancelado",cls: "text-muted-foreground bg-surface-3 border-border" },
} as const;

const PAYOUT_META = {
  paid:       { label: "Pagado",     cls: "text-success bg-success/10 border-success/25" },
  pending:    { label: "Pendiente",  cls: "text-warning bg-warning/10 border-warning/25" },
  processing: { label: "Procesando", cls: "text-info bg-info/10 border-info/25" },
} as const;

function AfiliadosPage() {
  const referralCode = "TRADYNC-NEXUS42";
  const referralUrl = `https://tradync.app/r/${referralCode.toLowerCase()}`;
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  const stats = useMemo(() => {
    const active = REFERRALS.filter((r) => r.status === "active").length;
    const trial  = REFERRALS.filter((r) => r.status === "trial").length;
    const totalEarned = REFERRALS.reduce((s, r) => s + r.earned, 0);
    const pending = PAYOUTS.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const paid    = PAYOUTS.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const conversionRate = REFERRALS.length ? (active / REFERRALS.length) * 100 : 0;
    return { active, trial, totalEarned, pending, paid, conversionRate, total: REFERRALS.length };
  }, []);

  const copy = async (value: string, kind: "code" | "url") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const share = (network: "twitter" | "telegram" | "email") => {
    const text = encodeURIComponent("Llevo meses usando Tradync para mi journal de trading y mi disciplina ha cambiado por completo. Pruébalo gratis:");
    const url = encodeURIComponent(referralUrl);
    const links = {
      twitter:  `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      email:    `mailto:?subject=${encodeURIComponent("Te recomiendo Tradync")}&body=${text}%20${url}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer");
  };

  const tierProgress = Math.min(100, (stats.active / 10) * 100);
  const nextTier = stats.active < 5 ? "Plata (5 referidos · 35%)" : stats.active < 10 ? "Oro (10 referidos · 40%)" : "Platino (alcanzado)";

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Users2 className="h-3.5 w-3.5 text-primary" />
            Programa de Afiliados
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gana 30% recurrente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Refiere traders, gana cada mes mientras sigan suscritos. Sin límites.
          </p>
        </div>
      </div>

      {/* Hero — Earnings */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface/60 to-surface/40 backdrop-blur-xl p-6 relative overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)" }}
        />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
              <Wallet className="h-3 w-3 text-primary" /> Total ganado
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl md:text-5xl font-bold font-mono">{fmtUSD(stats.totalEarned)}</span>
              <span className="text-xs px-2 py-1 rounded-md bg-success/10 text-success border border-success/25 font-mono">
                +{fmtUSD(stats.pending)} pendiente
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> {fmtUSD(stats.paid)} pagado</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-warning" /> {fmtUSD(stats.pending)} en cola</span>
            </div>
          </div>
          <button className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[0_0_30px_color-mix(in_oklab,var(--primary)_45%,transparent)] inline-flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Solicitar pago
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Referidos activos", value: String(stats.active),        sub: `${stats.total} totales`,         Icon: Users2,    tone: "text-success" },
          { label: "En prueba",          value: String(stats.trial),         sub: "Convirtiendo…",                 Icon: Sparkles,  tone: "text-info" },
          { label: "Tasa conversión",    value: `${stats.conversionRate.toFixed(0)}%`, sub: "Trial → activo",     Icon: TrendingUp,tone: "text-primary" },
          { label: "Comisión",           value: "30%",                       sub: "Recurrente de por vida",        Icon: Gift,      tone: "text-warning" },
        ].map((k) => (
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

      {/* Referral link + share */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-4">
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Share2 className="h-4 w-4 text-primary" /> Tu enlace de afiliado
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Código</div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralCode}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface-2/60 border border-border text-sm font-mono font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => copy(referralCode, "code")}
                  className="h-10 px-3 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {copied === "code" ? <><Check className="h-3.5 w-3.5 text-success" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Enlace directo</div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralUrl}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface-2/60 border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => copy(referralUrl, "url")}
                  className="h-10 px-3 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {copied === "url" ? <><Check className="h-3.5 w-3.5 text-success" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Compartir en</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { net: "twitter"  as const, Icon: Twitter,   label: "Twitter" },
                  { net: "telegram" as const, Icon: Send,      label: "Telegram" },
                  { net: "email"    as const, Icon: Mail,      label: "Email" },
                  { net: null,                Icon: Instagram, label: "Instagram" },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => s.net && share(s.net)}
                    disabled={!s.net}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-surface-2/40 hover:border-primary/40 hover:text-primary transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <s.Icon className="h-4 w-4" /> {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tier progress */}
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5 lg:w-80 flex flex-col">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-warning" /> Tu nivel de afiliado
          </div>
          <div className="text-center py-3">
            <Crown className="h-10 w-10 text-warning mx-auto mb-2" />
            <div className="text-xs uppercase tracking-wider text-warning font-semibold">Bronce · 30%</div>
            <div className="text-[11px] text-muted-foreground mt-1">{stats.active} de 10 referidos</div>
          </div>
          <div className="mt-2">
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-warning to-primary"
                style={{ width: `${tierProgress}%`, boxShadow: "0 0 10px color-mix(in oklab, var(--warning) 50%, transparent)" }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 text-center">
              Próximo: <span className="text-foreground font-medium">{nextTier}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Bronce (1-4)</span><span className="font-mono font-semibold">30%</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Plata (5-9)</span><span className="font-mono font-semibold">35%</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Oro (10-24)</span><span className="font-mono font-semibold">40%</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Platino (25+)</span><span className="font-mono font-semibold text-primary">50%</span></div>
          </div>
        </div>
      </div>

      {/* Referrals + Payouts */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        {/* Referrals */}
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Users2 className="h-4 w-4 text-primary" /> Mis referidos
            </div>
            <span className="text-[11px] text-muted-foreground">{REFERRALS.length} en total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                  <th className="text-left font-medium py-3 px-4">Usuario</th>
                  <th className="text-left font-medium py-3 px-4 hidden sm:table-cell">Plan</th>
                  <th className="text-left font-medium py-3 px-4">Estado</th>
                  <th className="text-left font-medium py-3 px-4 hidden md:table-cell">Desde</th>
                  <th className="text-right font-medium py-3 px-4">Generado</th>
                </tr>
              </thead>
              <tbody>
                {REFERRALS.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 grid place-items-center text-[11px] font-bold text-primary shrink-0">
                            {r.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{r.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-[11px] font-mono">{r.plan}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-[11px] text-muted-foreground font-mono">{r.joined}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-primary">{fmtUSD(r.earned)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payouts */}
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" /> Pagos
            </div>
            <button className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5">
              Ver todo <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {PAYOUTS.map((p) => {
              const meta = PAYOUT_META[p.status];
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2/40 hover:border-primary/30 transition">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold">{fmtUSD(p.amount)}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.date} · {p.method}</div>
                  </div>
                  <span className={`shrink-0 inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA materials */}
      <div className="rounded-2xl border border-border bg-surface/40 backdrop-blur p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">¿Necesitas materiales?</div>
            <div className="text-xs text-muted-foreground mt-0.5">Banners, vídeos y plantillas listos para usar en tus redes.</div>
          </div>
        </div>
        <button className="h-9 px-4 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-semibold inline-flex items-center gap-1.5">
          Centro de recursos <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
