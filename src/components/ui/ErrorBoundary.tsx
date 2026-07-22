import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#020203',
          color: '#F8FAFC',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#BFFF00' }}>
            Elite 72 Studio Recovery
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', maxWidth: '480px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {this.state.error?.message || "An unexpected render event occurred. You can reset local storage or retry."}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#BFFF00',
                color: '#000000',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              onClick={() => {
                try {
                  localStorage.clear();
                } catch (e) {
                  console.error(e);
                }
                window.location.reload();
              }}
            >
              Reset Storage & Reload
            </button>
            <button
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                border: '1px solid #334155',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Recovering
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
