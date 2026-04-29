import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/gestor-ea")({
  component: () => <ComingSoon title="Gestor EA" description="Administra tus expert advisors y bots conectados." />,
});
