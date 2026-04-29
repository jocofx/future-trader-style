import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/estadisticas")({
  component: () => <ComingSoon title="Estadísticas" description="Métricas avanzadas: expectancy, Sharpe, MAE/MFE, distribución de R." />,
});
