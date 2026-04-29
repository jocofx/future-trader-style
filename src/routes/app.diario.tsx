import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/diario")({
  component: () => <ComingSoon title="Diario" description="Notas, screenshots y lecciones por sesión." />,
});
