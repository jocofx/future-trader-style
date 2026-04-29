import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/afiliados")({
  component: () => <ComingSoon title="Afiliados" description="Tu enlace, comisiones y estadísticas en tiempo real." />,
});
