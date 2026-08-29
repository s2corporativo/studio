import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  reference: string | null;
}

function createErrorReference() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, reference: null };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, reference: createErrorReference() };
  }

  componentDidCatch(error: Error) {
    console.error(JSON.stringify({
      event: "ui.error_boundary",
      reference: this.state.reference,
      errorName: error.name,
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="flex w-full max-w-xl flex-col items-center rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <AlertTriangle size={44} className="mb-5 shrink-0 text-destructive" />
            <h1 className="text-2xl font-semibold">Não foi possível concluir esta tela</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              A interface encontrou uma falha inesperada. Nenhum detalhe técnico foi exibido por segurança. Recarregue a página para tentar novamente.
            </p>
            {this.state.reference && (
              <p className="mt-4 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                Referência: {this.state.reference}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={cn(
                "mt-6 flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2",
                "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              <RotateCcw size={16} />
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
