import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

export function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full ${SIZES[size]} max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl shadow-[0_20px_80px_-20px_color-mix(in_oklab,var(--primary)_30%,transparent)] overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none opacity-60"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)" }}
        />
        <div className="relative flex items-start justify-between gap-4 p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-primary/40 hover:text-primary transition text-muted-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="relative flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-2/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: {
  label: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5 font-medium">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

export const inputCls =
  "w-full h-10 px-3 rounded-lg bg-surface-2/60 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition font-mono";

export const selectCls = inputCls + " appearance-none cursor-pointer pr-8";

export const textareaCls =
  "w-full px-3 py-2 rounded-lg bg-surface-2/60 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none";

export function ModalButton({
  variant = "ghost", children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const v =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
      : variant === "danger"
      ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
      : "bg-surface-2/60 text-foreground border border-border hover:border-primary/40 hover:text-primary";
  return (
    <button
      {...rest}
      className={`h-9 px-4 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${v} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}
