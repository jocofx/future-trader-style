import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode]       = useState<"login"|"register">("login");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/app";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Revisa tu email para confirmar la cuenta.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background bg-mesh flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="text-sm font-bold tracking-tight">TradyncApp</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow mb-4">
              <Logo className="h-8 w-8 brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Accede a tu journal de trading" : "Empieza a mejorar tu trading hoy"}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            {/* Google */}
            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm font-semibold hover:bg-surface transition disabled:opacity-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">o con email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com" autoComplete="email"
                  className="mt-1.5 w-full bg-surface/80 border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Contraseña</label>
                <input type="password" value={password} onChange={e => setPass(e.target.value)} required
                  placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="mt-1.5 w-full bg-surface/80 border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              </div>

              {error   && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
              {success && <div className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{success}</div>}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50 mt-1">
                {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground pt-1">
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
                className="text-primary hover:underline font-semibold">
                {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Al continuar aceptas los <a href="#" className="underline">Términos de Uso</a> y la <a href="#" className="underline">Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  );
}
