import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/capital")({
  component: () => <ComingSoon title="Capital Tracker" description="Trackea growth de cuenta, retiros, depósitos y compounding." />,
});
