/**
 * @file index.tsx
 * @description
 * This is the main entry point for the React application. Its primary responsibility
 * is to find the root HTML element in `index.html` and render the main `App` component
 * into it. This file bootstraps the entire client-side application.
 */


// Import the React library, which is the core of the application's UI.
import * as React from 'react';
// Import the ReactDOM library, which provides methods for interacting with the DOM (Document Object Model).
import ReactDOM from 'react-dom/client';
// Import the main App component, which serves as the root of the React component tree and contains all other components.
import App from './App';

/**
 * React ErrorBoundary - catches any render error in the entire component tree
 * and displays it visually instead of showing a blank screen.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#0f172a', color: '#f87171',
          fontFamily: 'monospace', padding: '40px', zIndex: 99999, overflow: 'auto'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#fca5a5' }}>
            ⚠️ REACT RENDER ERROR
          </h1>
          <div style={{ color: '#fecaca', marginBottom: '10px', fontSize: '16px' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <pre style={{ color: '#fb923c', marginTop: '20px', fontSize: '11px', maxHeight: '40vh', overflow: 'auto', background: '#1e293b', padding: '16px', borderRadius: '8px' }}>
            {this.state.error?.stack}
          </pre>
          {this.state.errorInfo && (
            <pre style={{ color: '#94a3b8', marginTop: '10px', fontSize: '11px', maxHeight: '20vh', overflow: 'auto', background: '#1e293b', padding: '16px', borderRadius: '8px' }}>
              Component Stack:{this.state.errorInfo.componentStack}
            </pre>
          )}
          <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px', borderRadius: '6px' }}
            >
              RELOAD PAGE
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ padding: '12px 24px', background: '#334155', color: '#94a3b8', border: '1px solid #475569', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', borderRadius: '6px' }}
            >
              FACTORY RESET
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Find the root HTML element where the React application will be mounted.
// This element is defined in `index.html` with the id 'root'.
// It acts as the container for the entire single-page application.
const rootElement = document.getElementById('root');

// A crucial safety check. If the root element isn't found in the HTML document,
// the application cannot render. This is a critical error, so we throw an exception to stop execution immediately.
if (!rootElement) {
  throw new Error("Could not find root element with id 'root' to mount the application.");
}

// Create a React root for the specified HTML element. This is the modern
// API for rendering a React app, introduced in React 18. It enables concurrent features,
// which can improve performance and user experience in complex applications.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component into the root.
// `React.StrictMode` is a wrapper component that helps with highlighting potential problems
// in an application during development. It activates additional checks and warnings
// for its descendants, such as identifying components with unsafe lifecycles,
// legacy API usage, and unexpected side effects. It does not affect the production build.
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
