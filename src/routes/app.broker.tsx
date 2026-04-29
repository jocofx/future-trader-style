import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/app/broker")({
  component: () => <ComingSoon title="Conectar Broker" description="Sincroniza MT4, MT5, cTrader, Binance y más con un click." />,
});
