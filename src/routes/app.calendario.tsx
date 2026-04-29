import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/calendario")({
  component: () => <ComingSoon title="Calendario" description="Visualización mensual de operaciones con heatmap de P&L diario." />,
});
