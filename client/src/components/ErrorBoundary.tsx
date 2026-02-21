import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertTriangle
                size={32}
                className="text-red-600"
              />
            </div>

            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-6 text-center">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            <div className="p-4 w-full rounded-lg bg-slate-100 overflow-auto mb-6 max-h-48">
              <pre className="text-sm text-slate-700 whitespace-break-spaces font-mono">
                {this.state.error?.message || "Unknown error"}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-slate-200 text-slate-800",
                  "hover:bg-slate-300 cursor-pointer transition-colors"
                )}
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-slate-200 text-slate-800",
                  "hover:bg-slate-300 cursor-pointer transition-colors"
                )}
              >
                <Home size={16} />
                Go Home
              </button>
              <button
                onClick={this.handleReload}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-blue-600 text-white",
                  "hover:bg-blue-700 cursor-pointer transition-colors"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="mt-6 w-full">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                  View component stack
                </summary>
                <div className="p-4 mt-2 w-full rounded-lg bg-slate-800 overflow-auto max-h-48">
                  <pre className="text-xs text-slate-300 whitespace-break-spaces font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
