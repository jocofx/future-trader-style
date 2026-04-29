import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/riesgo")({
  component: () => <ComingSoon title="Control de Riesgo" description="Reglas en tiempo real, límites diarios, circuit-breakers." />,
});
