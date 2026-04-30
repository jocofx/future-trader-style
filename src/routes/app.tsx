import { Outlet, Link, useRouterState, createFileRoute, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard, ListOrdered, CalendarDays, BarChart3, ShieldAlert, Wallet, Sunrise,
  CheckCircle2, LineChart, Sparkles, Brain, BookText, Settings2, PlugZap, Trophy, Users2,
  Bot, ChevronsLeft, ChevronsRight, Search, Bell, LogOut,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { computeStats } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppShell,
});

const SECTIONS = [
  {
    label: "Principal",
    items: [
      { to: "/app",             icon: LayoutDashboard, name: "Dashboard",       exact: true },
      { to: "/app/operaciones", icon: ListOrdered,     name: "Operaciones" },
      { to: "/app/calendario",  icon: CalendarDays,    name: "Calendario" },
      { to: "/app/estadisticas",icon: BarChart3,       name: "Estadísticas" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { to: "/app/riesgo",    icon: ShieldAlert,  name: "Control Riesgo" },
      { to: "/app/cuentas",   icon: Wallet,       name: "Cuentas" },
      { to: "/app/premarket", icon: Sunrise,      name: "Pre-Market" },
      { to: "/app/habitos",   icon: CheckCircle2, name: "Hábitos" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { to: "/app/capital",    icon: LineChart, name: "Capital Tracker", badge: "NEW" },
      { to: "/app/insights",   icon: Sparkles,  name: "Insights" },
      { to: "/app/coach",      icon: Bot,       name: "Coach IA" },
      { to: "/app/diario",     icon: BookText,  name: "Diario" },
      { to: "/app/psicologia", icon: Brain,     name: "Psicología" },
      { to: "/app/gestor-ea",  icon: Settings2, name: "Gestor EA" },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { to: "/app/broker",    icon: PlugZap, name: "Conectar Broker" },
      { to: "/app/logros",    icon: Trophy,  name: "Logros" },
      { to: "/app/afiliados", icon: Users2,  name: "Afiliados" },
    ],
  },
] as const;

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  const { user, trades: { trades } } = useApp();

  // Trader score from real data
  const score = useMemo(() => {
    const closed = trades.filter(t => t.resultado != null);
    if (closed.length < 3) return 0;
    const stats = computeStats(closed);
    let s = 0;
    s += Math.min(30, stats.winRate * 100 * 0.5);
    s += Math.min(25, stats.profitFactor * 10);
    s += Math.min(30, (1 - Math.min(1, stats.losses / Math.max(1, closed.length) * 2)) * 30);
    s += Math.min(15, 15);
    return Math.min(99, Math.round(s));
  }, [trades]);

  const traderType = score >= 70 ? "Disciplinado" : score >= 50 ? "En Desarrollo" : score >= 30 ? "Impulsivo" : "Iniciando";
  const C = 2 * Math.PI * 15;
  const dashArr = `${(score / 100) * C} ${C}`;

  // User initials
  const initials = useMemo(() => {
    if (!user) return "?";
    const name = user.user_metadata?.full_name ?? user.email ?? "";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-200 ${collapsed ? "w-[68px]" : "w-[248px]"}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
          <Logo className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="text-[14px] font-bold tracking-tight truncate">Tradync</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Trading Journal</div>
            </div>
          )}
        </div>

        {/* Trader profile widget — real score */}
        {!collapsed && (
          <Link to="/app/insights" className="mx-3 mt-3 group flex items-center gap-3 rounded-xl border border-sidebar-border bg-surface/60 p-2.5 hover:border-primary/40 transition">
            <div className="relative h-10 w-10 grid place-items-center flex-shrink-0">
              <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full">
                <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(0.78 0.18 158)" strokeWidth="3"
                  strokeDasharray={dashArr} strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <span className="font-mono text-[11px] font-bold relative z-10">{trades.length >= 3 ? score : "—"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate">{trades.length >= 3 ? traderType : "Sin datos aún"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{trades.length} ops · Ver Insights →</div>
            </div>
          </Link>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {section.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.to, (item as { exact?: boolean }).exact);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link to={item.to}
                        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                          active
                            ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                            : "text-foreground/75 hover:text-foreground hover:bg-sidebar-accent"
                        }`}
                        title={collapsed ? item.name : undefined}>
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                        {!collapsed && (item as { badge?: string }).badge && (
                          <span className="ml-auto rounded-md bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 tracking-wider">
                            {(item as { badge?: string }).badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface/60 border border-sidebar-border p-2 hover:border-primary/30 transition cursor-pointer group"
            onClick={handleLogout} title="Cerrar sesión">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold truncate">
                    {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Usuario"}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="text-warning">★</span> Plan Pro
                  </div>
                </div>
                <LogOut className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive transition" />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/70 backdrop-blur-xl flex items-center gap-2 px-4">
          <Button variant="glass" size="icon" onClick={() => setCollapsed(v => !v)} className="h-9 w-9">
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
          <div className="hidden md:flex items-center gap-2 ml-1 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Buscar trades, estrategias, símbolos…"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface/70 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-success/10 text-success border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              En vivo
            </span>
            <Button variant="glass" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <button onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-destructive transition px-2 flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
