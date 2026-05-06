import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, TrendingUp, BarChart3, Brain, Cpu } from "lucide-react";

// Admin user ID — only this user bypasses coming soon
const ADMIN_ID = "7b14f1e1-4e5a-41e9-a3cc-48161ca41adb";

// Target launch date — change this to your real launch date
// Update this date before launching
const LAUNCH_DATE = new Date("2026-05-08T00:00:00Z");

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function ComingSoon() {
  const navigate   = useNavigate();
  const countdown  = useCountdown(LAUNCH_DATE);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [waitEmail,setWaitEmail]= useState("");
  const [waitDone, setWaitDone] = useState(false);
  const [err,      setErr]      = useState("");

  // Check if already logged in as admin → redirect directly
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      const session = data?.session;
      if (session?.user?.id === ADMIN_ID) {
        navigate({ to: "/app" });
      }
    });
  }, []);

  // Admin login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user?.id === ADMIN_ID) {
        navigate({ to: "/app" });
      } else {
        await supabase.auth.signOut();
        setErr("Acceso restringido durante el período de prueba.");
      }
    } catch (e: any) {
      setErr(e.message ?? "Error al iniciar sesión");
    } finally { setLoading(false); }
  };

  // Waitlist signup
  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitEmail.includes("@")) return;
    await supabase.from("configuracion").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      clave:   "waitlist_" + Date.now(),
      valor:   { email: waitEmail, signed_at: new Date().toISOString() },
    }).then(() => setWaitDone(true));
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  const FEATURES = [
    { icon: BarChart3, label: "Journal de trading" },
    { icon: TrendingUp, label: "Estadísticas avanzadas" },
    { icon: Cpu,        label: "Gestor EA MT4/MT5" },
    { icon: Brain,      label: "Coach IA personalizado" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 60%, transparent), transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center space-y-8">
        {/* Logo */}
        <div>
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">TradyncApp</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Algo grande<br />
            <span className="text-transparent bg-clip-text bg-gradient-primary">está llegando</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            La plataforma definitiva para traders serios. Journal inteligente, gestión de riesgo real y coach IA personalizado.
          </p>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Días",     value: countdown.days },
            { label: "Horas",    value: countdown.hours },
            { label: "Minutos",  value: countdown.minutes },
            { label: "Segundos", value: countdown.seconds },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur p-3">
              <div className="text-3xl font-bold font-mono text-primary">{pad(value)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-border bg-surface/40 px-3 py-2 text-sm">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Waitlist */}
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur p-5 text-left">
          <div className="font-semibold text-sm mb-1">Únete a la lista de espera</div>
          <div className="text-xs text-muted-foreground mb-3">Sé el primero en acceder y obtén acceso anticipado gratuito.</div>
          {waitDone ? (
            <div className="text-center py-3 text-success text-sm font-semibold">
              ✅ ¡Apuntado! Te avisaremos cuando lancemos.
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-2">
              <input type="email" value={waitEmail} onChange={e => setWaitEmail(e.target.value)}
                placeholder="tu@email.com" required
                className="flex-1 h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit"
                className="h-10 px-4 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition">
                <Mail className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Admin login — subtle, no title */}
        <details className="text-left">
          <summary className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground cursor-pointer select-none text-center transition">
            Acceso interno
          </summary>
          <form onSubmit={handleLogin} className="mt-3 space-y-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña" required
                className="w-full h-10 px-3 pr-10 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err && <div className="text-destructive text-xs px-1">{err}</div>}
            <button type="submit" disabled={loading}
              className="w-full h-10 rounded-xl bg-surface border border-border text-sm font-semibold hover:bg-surface-2 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              {loading ? "Verificando…" : "Entrar"}
            </button>
          </form>
        </details>

        <div className="text-[10px] text-muted-foreground/40">
          © 2025 TradyncApp · Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}
