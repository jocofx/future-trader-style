import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "py-3" : "py-5"}`}>
      <div className="mx-auto max-w-6xl px-4">
        <nav className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all ${scrolled ? "glass-strong shadow-elegant" : ""}`}>
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo className="h-8 w-8" />
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight">TradyncApp</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Trading Journal</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-sm">
            <Link to="/" hash="features" className="px-3 py-2 text-muted-foreground hover:text-foreground transition">Features</Link>
            <Link to="/" hash="pricing" className="px-3 py-2 text-muted-foreground hover:text-foreground transition">Precios</Link>
            <Link to="/" hash="testimonials" className="px-3 py-2 text-muted-foreground hover:text-foreground transition">Testimonios</Link>
            <Link to="/app" className="px-3 py-2 text-muted-foreground hover:text-foreground transition">App demo</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="glass" size="sm" className="hidden sm:inline-flex">
              <Link to="/app">Iniciar sesión</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/app">Empezar gratis</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
