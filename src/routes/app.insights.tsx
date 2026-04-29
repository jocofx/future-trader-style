import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/insights")({
  component: () => <ComingSoon title="Insights" description="Tu perfil de trader, fortalezas, sesgos y áreas de mejora." />,
});
