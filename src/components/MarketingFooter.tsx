import { Logo } from "./Logo";

export function MarketingFooter() {
  const cols = [
    {
      title: "Producto",
      links: ["Features", "Coach IA", "Control de riesgo", "Estadísticas", "Precios"],
    },
    {
      title: "Recursos",
      links: ["Documentación", "Blog", "Guía de trading", "Plantillas", "Changelog"],
    },
    {
      title: "Compañía",
      links: ["Sobre nosotros", "Afiliados", "Contacto", "Privacidad", "Términos"],
    },
  ];
  return (
    <footer className="relative border-t border-border bg-surface/40 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <div>
              <div className="font-bold tracking-tight">TradyncApp</div>
              <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} TradyncApp. All rights reserved.</div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            El journal de trading premium hecho en español. Convierte cada operación en disciplina, datos y mejora continua.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.title}</div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l}><a href="#" className="text-foreground/80 hover:text-primary transition">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
