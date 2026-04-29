import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/habitos")({
  component: () => <ComingSoon title="Hábitos" description="Streaks de disciplina, checklist diario y rutinas pre/post sesión." />,
});
