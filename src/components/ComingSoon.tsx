import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur p-12 md:p-16 text-center">
        <div className="absolute inset-0 bg-mesh opacity-50" aria-hidden />
        <div className="relative">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="mt-6 text-xs uppercase tracking-[0.2em] text-primary">Próximamente</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-xl mx-auto text-muted-foreground">{description}</p>
          <div className="mt-8 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground glass rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            En desarrollo
          </div>
        </div>
      </div>
    </div>
  );
}
