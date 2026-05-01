import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel  = "Cancelar",
  danger       = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full shadow-elegant overflow-hidden"
        style={{ maxWidth: "420px" }}
      >
        {/* Icon header */}
        <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
          <div className={`h-14 w-14 rounded-2xl grid place-items-center mb-4 ${
            danger
              ? "bg-destructive/10 border border-destructive/20"
              : "bg-warning/10 border border-warning/20"
          }`}>
            <AlertTriangle className={`h-7 w-7 ${danger ? "text-destructive" : "text-warning"}`} />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
            {message}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-6" />

        {/* Actions */}
        <div className="flex gap-3 p-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
              danger
                ? "bg-destructive text-white hover:brightness-110"
                : "bg-warning text-black hover:brightness-110"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
