import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 grid place-items-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-bold mb-2">Error al cargar esta sección</h2>
          <p className="text-sm text-muted-foreground mb-1 max-w-sm">
            {this.state.error?.message ?? "Error inesperado"}
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            Si persiste, comprueba que todas las tablas de Supabase existen y tienen RLS configurado.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:brightness-110 transition"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
