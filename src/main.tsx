import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

interface RootErrorBoundaryProps {
  children: ReactNode
}

interface RootErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  public constructor(props: RootErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  public static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown runtime error',
    }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Root render crash:', error, info)
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          background: '#05070d',
          color: '#f5f8ff',
          fontFamily: "'Satoshi', 'Inter', sans-serif",
        }}
      >
        <div
          style={{
            width: 'min(44rem, 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            background: 'rgba(15, 20, 33, 0.92)',
            boxShadow: '0 14px 40px rgba(0, 0, 0, 0.45)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>App failed to render</h1>
          <p style={{ margin: '0.7rem 0 0', opacity: 0.88 }}>
            A runtime error occurred in this browser. Reload the page or open DevTools Console for details.
          </p>
          <pre
            style={{
              marginTop: '0.95rem',
              padding: '0.7rem',
              borderRadius: '0.6rem',
              background: 'rgba(0,0,0,0.36)',
              color: '#bcd3ff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.errorMessage}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.8rem',
              border: '1px solid rgba(255,255,255,0.32)',
              borderRadius: '999px',
              background: 'transparent',
              color: '#f5f8ff',
              padding: '0.5rem 1rem',
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </StrictMode>,
)
