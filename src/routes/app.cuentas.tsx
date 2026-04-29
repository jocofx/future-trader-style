import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/cuentas")({
  component: () => <ComingSoon title="Cuentas" description="Multi-broker, multi-divisa y consolidación de equity." />,
});
