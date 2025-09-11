import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    // Update state with error details
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Store error in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      
      const existingLogs = JSON.parse(
        localStorage.getItem("errorLogs") || "[]"
      );
      existingLogs.push(errorLog);
      
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      
      localStorage.setItem("errorLogs", JSON.stringify(existingLogs));
    } catch (e) {
      console.error("Failed to store error log:", e);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  Oops! Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {/* Error details in development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="w-full mt-4 p-4 bg-muted rounded-lg text-left">
                  <p className="font-mono text-sm text-destructive">
                    {this.state.error.toString()}
                  </p>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="w-full sm:w-auto"
                  data-testid="button-try-again"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-reload-page"
                >
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-go-home"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Support information */}
              <div className="text-sm text-muted-foreground">
                <p>If the problem persists, please contact support.</p>
                {this.state.errorCount > 2 && (
                  <p className="mt-2 text-destructive">
                    Multiple errors detected. Please refresh the page.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}