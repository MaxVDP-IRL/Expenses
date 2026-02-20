import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {
    hasError: false,
    message: ''
  };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown runtime error'
    };
  }

  componentDidCatch(error: unknown) {
    console.error('App render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto min-h-screen max-w-xl p-4">
          <div className="card space-y-3">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-slate-300">The app hit a runtime error.</p>
            <p className="rounded-md border border-rose-900/60 bg-rose-950/40 p-2 text-xs text-rose-200">
              {this.state.message}
            </p>
            <button className="btn" type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
