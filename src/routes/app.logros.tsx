import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/logros")({
  component: () => (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-16 text-center">
      <div className="text-5xl mb-6">🚧</div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Logros</h1>
      <p className="text-muted-foreground">Esta sección está en desarrollo. Próximamente disponible.</p>
    </div>
  ),
});
