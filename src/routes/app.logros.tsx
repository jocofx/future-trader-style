import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/logros")({
  component: () => <ComingSoon title="Logros" description="Sistema de niveles y badges por disciplina y consistencia." />,
});
