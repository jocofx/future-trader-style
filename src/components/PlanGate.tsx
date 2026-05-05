import React, { useState } from "react";
import { Lock } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import { usePlan } from "@/hooks/usePlan";

export function PlanGate({ feature, plan, children }: { 
  feature: string; 
  plan: "basic" | "pro"; 
  children: React.ReactNode 
}) {
  const { can } = usePlan();
  const [show, setShow] = useState(false);
  
  if (can(feature)) return <>{children}</>;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <div>
        <div className="text-lg font-bold mb-1">
          Función {plan === "pro" ? "Pro" : "Basic"}
        </div>
        <div className="text-sm text-muted-foreground max-w-xs">
          Actualiza tu plan para acceder a esta sección.
        </div>
      </div>
      <button
        onClick={() => setShow(true)}
        className="h-10 px-6 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition shadow-glow"
      >
        Ver planes →
      </button>
      <UpgradeModal open={show} feature={feature} onClose={() => setShow(false)} />
    </div>
  );
}
