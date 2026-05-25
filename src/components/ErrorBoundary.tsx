import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console so logs panel + Lovable can see it
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
    if (typeof window !== "undefined") window.location.assign("/");
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-6 bg-background">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">/ error</div>
            <h1 className="font-display text-2xl mt-2 mb-3">Something broke on this screen</h1>
            <p className="text-sm text-muted-foreground mb-4 break-words">
              {this.state.error.message || "Unknown error"}
            </p>
            <div className="flex gap-2">
              <Button onClick={this.reset} className="bg-primary text-primary-foreground">Go home</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
