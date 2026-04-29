import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/premarket")({
  component: () => <ComingSoon title="Pre-Market" description="Plan diario, niveles clave y noticias antes de operar." />,
});
