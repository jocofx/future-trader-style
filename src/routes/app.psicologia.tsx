import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/psicologia")({
  component: () => <ComingSoon title="Psicología" description="Estado emocional, confianza y FOMO trackeados con IA." />,
});
