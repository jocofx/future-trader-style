import { Link } from "@tanstack/react-router";
import { Sparkles, X, ArrowRight, Lock } from "lucide-react";

import { UPGRADE_PROMPTS } from "@/hooks/usePlan";

interface UpgradeModalProps {
  // Either pass feature shorthand OR explicit title/desc/cta
  feature?: string;
  open?: boolean;
  onClose: () => void;
  title?: string;
  desc?: string;
  cta?: string;
}

export function UpgradeModal({ feature, open = true, onClose, title: titleProp, desc: descProp, cta: ctaProp }: UpgradeModalProps) {
  const prompt = feature ? UPGRADE_PROMPTS[feature] : null;
  const title = titleProp ?? prompt?.title ?? "Función Premium";
  const desc  = descProp  ?? prompt?.desc  ?? "Actualiza tu plan para acceder a esta función.";
  const cta   = ctaProp   ?? prompt?.cta   ?? "Ver planes";
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full shadow-elegant overflow-hidden" style={{ maxWidth: "420px" }}>
        {/* Glow header */}
        <div className="relative bg-gradient-primary p-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-40" />
          <div className="relative">
            <div className="mx-auto h-12 w-12 rounded-xl bg-white/20 grid place-items-center mb-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">Función Premium</div>
            <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">{desc}</p>

          <div className="mt-6 space-y-2">
            <Link to="/#pricing" onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition">
              <ArrowRight className="h-4 w-4" /> {cta}
            </Link>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition">
              Continuar con plan actual
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            14 días gratis · Sin tarjeta · Cancela cuando quieras
          </div>
        </div>
      </div>
    </div>
  );
}
