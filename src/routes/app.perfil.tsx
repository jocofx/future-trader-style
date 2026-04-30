import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  User, Mail, Camera, Crown, Shield, Bell, Globe, Moon, Sun, Monitor, KeyRound,
  CreditCard, Download, LogOut, Trash2, Edit3, Check, X, Sparkles, Zap, Trophy,
  Calendar, BarChart3, ShieldCheck, ChevronRight, ExternalLink, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/theme-provider";
import { Modal, Field, inputCls, ModalButton } from "@/components/Modal";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Tradync" },
      { name: "description", content: "Gestiona tu cuenta, plan, notificaciones y preferencias." },
    ],
  }),
  component: PerfilPage,
});

type Tab = "general" | "seguridad" | "notificaciones" | "facturacion" | "preferencias";

function PerfilPage() {
  const { user, plan, trades: { trades } } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("general");
  const [editing, setEditing] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "Trader";
  const [displayName, setDisplayName] = useState(name);
  const [bio, setBio] = useState("Day trader. Disciplina > genio.");

  const initials = useMemo(() => {
    return (displayName || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  }, [displayName]);

  const memberSince = useMemo(() => {
    if (!user?.created_at) return "—";
    return new Date(user.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
  }, [user]);

  const totalTrades = trades.length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleSaveProfile = async () => {
    if (user) {
      await supabase.auth.updateUser({ data: { full_name: displayName } });
    }
    setEditing(false);
  };

  const planMeta = {
    free:  { label: "Free",  color: "var(--muted-foreground)", desc: "Funciones básicas", price: "$0" },
    pro:   { label: "Pro",   color: "var(--primary)",          desc: "Para traders activos", price: "$19/mes" },
    elite: { label: "Elite", color: "oklch(0.74 0.22 305)",    desc: "Acceso completo + Coach IA", price: "$49/mes" },
  }[plan];

  const TABS: { id: Tab; label: string; Icon: any }[] = [
    { id: "general",        label: "General",        Icon: User },
    { id: "seguridad",      label: "Seguridad",      Icon: Shield },
    { id: "notificaciones", label: "Notificaciones", Icon: Bell },
    { id: "facturacion",    label: "Facturación",    Icon: CreditCard },
    { id: "preferencias",   label: "Preferencias",   Icon: Globe },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <User className="h-3.5 w-3.5 text-primary" />
            Perfil de usuario
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tu información, plan y preferencias.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-border bg-surface-2/60 hover:border-destructive/40 hover:text-destructive text-xs font-semibold transition"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </button>
      </div>

      {/* Hero card — avatar + plan */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface/60 to-surface/40 backdrop-blur-xl p-6 relative overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)" }}
        />
        <div className="relative grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
          {/* Avatar */}
          <div className="relative mx-auto lg:mx-0">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center text-3xl font-bold shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 h-8 w-8 grid place-items-center rounded-full bg-surface border border-border hover:border-primary/40 hover:text-primary transition shadow">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Info */}
          <div className="text-center lg:text-left min-w-0">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <h2 className="text-2xl font-bold truncate">{displayName}</h2>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{
                  color: planMeta.color,
                  borderColor: `color-mix(in oklab, ${planMeta.color} 40%, transparent)`,
                  background: `color-mix(in oklab, ${planMeta.color} 12%, transparent)`,
                }}
              >
                <Crown className="h-2.5 w-2.5 inline -mt-0.5 mr-0.5" /> {planMeta.label}
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5 justify-center lg:justify-start">
              <Mail className="h-3 w-3" /> {user?.email ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">"{bio}"</p>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap justify-center lg:justify-start">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Miembro desde {memberSince}</span>
              <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {totalTrades} operaciones</span>
              <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-warning" /> Nivel 4</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setTab("facturacion")}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)] inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" /> Mejorar plan
            </button>
            <button
              onClick={() => { setEditing(true); setTab("general"); }}
              className="h-9 px-4 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Edit3 className="h-3.5 w-3.5" /> Editar perfil
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              tab === t.id
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.Icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "general" && (
        <Section title="Información personal" subtitle="Cómo te ven otros traders y aparece en tu journal">
          <div className="space-y-4">
            <Field label="Nombre completo">
              <div className="flex gap-2">
                <input
                  className={inputCls + " " + (editing ? "" : "opacity-70 pointer-events-none")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!editing}
                  maxLength={60}
                />
                {editing && (
                  <>
                    <button onClick={handleSaveProfile} className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Guardar
                    </button>
                    <button onClick={() => { setDisplayName(name); setEditing(false); }} className="h-10 px-3 rounded-lg border border-border bg-surface-2/60 hover:border-border text-xs font-medium inline-flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </Field>

            <Field label="Email" hint="Para cambiarlo, contacta soporte">
              <input className={inputCls + " opacity-70"} value={user?.email ?? ""} disabled />
            </Field>

            <Field label="Bio">
              <textarea
                className={inputCls + " py-2 h-auto resize-none " + (editing ? "" : "opacity-70 pointer-events-none")}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!editing}
                maxLength={140}
              />
            </Field>

            {!editing && (
              <button onClick={() => setEditing(true)} className="h-9 px-4 rounded-lg border border-border bg-surface-2/60 hover:border-primary/40 hover:text-primary transition text-xs font-medium inline-flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5" /> Editar
              </button>
            )}
          </div>
        </Section>
      )}

      {tab === "seguridad" && (
        <>
          <Section title="Contraseña" subtitle="Mantén tu cuenta segura con una contraseña fuerte">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2/40">
              <div>
                <div className="text-sm font-semibold">Contraseña</div>
                <div className="text-[11px] text-muted-foreground">Última actualización: hace 3 meses</div>
              </div>
              <button onClick={() => setPwModal(true)} className="h-9 px-4 rounded-lg border border-border bg-surface/60 hover:border-primary/40 hover:text-primary transition text-xs font-semibold inline-flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Cambiar
              </button>
            </div>
          </Section>

          <Section title="Autenticación de dos factores" subtitle="Añade una capa extra de protección">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2/40">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-warning" />
                <div>
                  <div className="text-sm font-semibold">2FA con app autenticadora</div>
                  <div className="text-[11px] text-muted-foreground">No configurado</div>
                </div>
              </div>
              <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition">
                Activar
              </button>
            </div>
          </Section>

          <Section title="Sesiones activas" subtitle="Dispositivos donde estás conectado">
            <div className="space-y-2">
              {[
                { device: "Chrome · macOS", location: "Madrid, ES", current: true,  lastActive: "ahora" },
                { device: "Safari · iPhone", location: "Madrid, ES", current: false, lastActive: "hace 2 h" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/40">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {s.device}
                        {s.current && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/25">Esta sesión</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">{s.location} · {s.lastActive}</div>
                    </div>
                  </div>
                  {!s.current && (
                    <button className="text-xs text-muted-foreground hover:text-destructive transition px-2">
                      Cerrar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Zona peligrosa" subtitle="Acciones irreversibles" tone="danger">
            <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <div>
                <div className="text-sm font-semibold text-destructive">Eliminar cuenta</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Se borrarán todas tus operaciones, journal y configuraciones</div>
              </div>
              <button onClick={() => setDeleteModal(true)} className="h-9 px-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25 transition text-xs font-semibold inline-flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          </Section>
        </>
      )}

      {tab === "notificaciones" && (
        <Section title="Notificaciones" subtitle="Elige qué quieres recibir y por dónde">
          <div className="space-y-2">
            {[
              { id: "n1", label: "Resumen diario", desc: "Tu rendimiento del día a las 22:00", email: true,  push: true },
              { id: "n2", label: "Alerta de regla rota", desc: "Cuando se incumpla una regla de riesgo", email: true,  push: true },
              { id: "n3", label: "Logros desbloqueados", desc: "Cada vez que ganes una medalla", email: false, push: true },
              { id: "n4", label: "Pre-Market diario", desc: "Eventos del calendario económico", email: true,  push: false },
              { id: "n5", label: "Newsletter Tradync", desc: "Tips y novedades semanales", email: true,  push: false },
            ].map((n) => <NotificationRow key={n.id} item={n} />)}
          </div>
        </Section>
      )}

      {tab === "facturacion" && (
        <>
          <Section title="Plan actual" subtitle="Cambia o cancela tu suscripción cuando quieras">
            <div
              className="rounded-2xl border p-5 relative overflow-hidden"
              style={{
                borderColor: `color-mix(in oklab, ${planMeta.color} 35%, transparent)`,
                background: `color-mix(in oklab, ${planMeta.color} 6%, var(--surface))`,
              }}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5" style={{ color: planMeta.color }} />
                    <span className="text-lg font-bold">{planMeta.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{planMeta.desc}</div>
                  <div className="mt-3 text-2xl font-bold font-mono">{planMeta.price}</div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition">
                    Mejorar plan
                  </button>
                  {plan !== "free" && (
                    <button className="h-9 px-4 rounded-lg border border-border bg-surface-2/60 hover:border-destructive/40 hover:text-destructive text-xs font-medium transition">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Método de pago" subtitle="Tarjeta usada para tu suscripción">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 grid place-items-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold font-mono">•••• •••• •••• 4242</div>
                  <div className="text-[11px] text-muted-foreground">Vence 12/27 · Visa</div>
                </div>
              </div>
              <button className="text-xs text-muted-foreground hover:text-primary transition">Actualizar</button>
            </div>
          </Section>

          <Section title="Historial de facturas" subtitle="Descarga tus recibos para contabilidad">
            <div className="space-y-1.5">
              {[
                { date: "01 Abr 2026", amount: "$19.00", id: "INV-2026-04" },
                { date: "01 Mar 2026", amount: "$19.00", id: "INV-2026-03" },
                { date: "01 Feb 2026", amount: "$19.00", id: "INV-2026-02" },
              ].map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2/40 hover:border-primary/30 transition">
                  <div>
                    <div className="text-sm font-mono font-semibold">{inv.amount}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{inv.date} · {inv.id}</div>
                  </div>
                  <button className="text-muted-foreground hover:text-primary transition p-1.5">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {tab === "preferencias" && (
        <>
          <Section title="Apariencia" subtitle="Elige cómo se ve Tradync">
            <ThemeSelector />
          </Section>

          <Section title="Idioma y región" subtitle="Configuración de localización">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Idioma">
                <select className={inputCls}>
                  <option>Español</option>
                  <option>English</option>
                  <option>Português</option>
                </select>
              </Field>
              <Field label="Zona horaria">
                <select className={inputCls}>
                  <option>Europa/Madrid (UTC+2)</option>
                  <option>America/New_York (UTC-4)</option>
                  <option>Asia/Tokyo (UTC+9)</option>
                </select>
              </Field>
              <Field label="Moneda principal">
                <select className={inputCls}>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </Field>
              <Field label="Formato de fecha">
                <select className={inputCls}>
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Datos" subtitle="Exporta o limpia tu información">
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to="/app"
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2/40 hover:border-primary/40 hover:text-primary transition group"
              >
                <div className="flex items-center gap-3">
                  <Download className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-semibold">Exportar todo</div>
                    <div className="text-[11px] text-muted-foreground">CSV · JSON · PDF</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition" />
              </Link>
              <Link
                to="/app"
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2/40 hover:border-primary/40 hover:text-primary transition group"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-semibold">API & Webhooks</div>
                    <div className="text-[11px] text-muted-foreground">Para desarrolladores</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition" />
              </Link>
            </div>
          </Section>
        </>
      )}

      {/* Modals */}
      <ChangePasswordModal open={pwModal} onClose={() => setPwModal(false)} />
      <DeleteAccountModal open={deleteModal} onClose={() => setDeleteModal(false)} email={user?.email ?? ""} />
    </div>
  );
}

/* ── Subcomponents ────────────────────────────────────────── */

function Section({ title, subtitle, children, tone }: {
  title: string; subtitle?: string; children: React.ReactNode; tone?: "danger";
}) {
  return (
    <div className={`rounded-2xl border backdrop-blur-xl p-5 ${tone === "danger" ? "border-destructive/30 bg-destructive/5" : "border-border bg-surface/60"}`}>
      <div className="mb-4">
        <h3 className={`text-sm font-semibold ${tone === "danger" ? "text-destructive" : ""}`}>{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={`relative h-5 w-9 rounded-full transition shrink-0 ${checked ? "bg-primary" : "bg-surface-3"}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

function NotificationRow({ item }: { item: { id: string; label: string; desc: string; email: boolean; push: boolean } }) {
  const [email, setEmail] = useState(item.email);
  const [push, setPush] = useState(item.push);
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border bg-surface-2/40 hover:border-primary/30 transition flex-wrap">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{item.label}</div>
        <div className="text-[11px] text-muted-foreground">{item.desc}</div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <Mail className="h-3 w-3" /> Email <Toggle checked={email} onChange={setEmail} />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <Bell className="h-3 w-3" /> Push <Toggle checked={push} onChange={setPush} />
        </label>
      </div>
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const opts = [
    { v: "light"  as const, label: "Claro",     Icon: Sun },
    { v: "dark"   as const, label: "Oscuro",    Icon: Moon },
    { v: "system" as const, label: "Sistema",   Icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setTheme(o.v)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
            theme === o.v
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_16px_color-mix(in_oklab,var(--primary)_20%,transparent)]"
              : "border-border bg-surface-2/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          <o.Icon className="h-5 w-5" />
          <span className="text-xs font-semibold">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setErr(null); setSaving(false); };
  const close = () => { onClose(); reset(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (next.length < 8) return setErr("La nueva contraseña debe tener al menos 8 caracteres");
    if (next !== confirm) return setErr("Las contraseñas no coinciden");
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      close();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al actualizar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Cambiar contraseña"
      subtitle="Mínimo 8 caracteres con números y símbolos"
      size="sm"
      footer={
        <>
          <ModalButton type="button" onClick={close}>Cancelar</ModalButton>
          <ModalButton type="submit" form="pw-form" variant="primary" disabled={saving}>
            <KeyRound className="h-3.5 w-3.5 inline mr-1" /> {saving ? "Guardando…" : "Actualizar"}
          </ModalButton>
        </>
      }
    >
      <form id="pw-form" onSubmit={submit} className="space-y-4">
        <Field label="Contraseña actual">
          <input className={inputCls} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="Nueva contraseña">
          <input className={inputCls} type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <input className={inputCls} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        </Field>
        {err && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/25 rounded-lg p-2.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}

function DeleteAccountModal({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const [confirm, setConfirm] = useState("");
  const ok = confirm === email && email.length > 0;

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setConfirm(""); }}
      title="Eliminar cuenta permanentemente"
      subtitle="Esta acción no se puede deshacer"
      size="sm"
      footer={
        <>
          <ModalButton type="button" onClick={() => { onClose(); setConfirm(""); }}>Cancelar</ModalButton>
          <ModalButton variant="danger" disabled={!ok} onClick={() => { alert("Solicitud de eliminación enviada. Soporte se pondrá en contacto."); onClose(); setConfirm(""); }}>
            <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Eliminar para siempre
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/90">
            Se eliminarán <strong>todas tus operaciones</strong>, journal, hábitos, configuración y suscripción.
            <span className="block mt-1 text-muted-foreground">Tendrás 30 días para recuperar la cuenta antes del borrado definitivo.</span>
          </div>
        </div>
        <Field label={`Escribe tu email para confirmar`} hint={email}>
          <input className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={email} />
        </Field>
      </div>
    </Modal>
  );
}
