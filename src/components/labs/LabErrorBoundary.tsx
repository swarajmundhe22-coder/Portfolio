import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportRuntimeIssue } from '../../labs/shared/runtimeTelemetry';

interface LabErrorBoundaryProps {
  children: ReactNode;
  lab:
    | 'magnetic-blobs'
    | 'animated-list'
    | 'galaxy-field';
}

interface LabErrorBoundaryState {
  hasError: boolean;
}

class LabErrorBoundary extends Component<LabErrorBoundaryProps, LabErrorBoundaryState> {
  state: LabErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): LabErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    void reportRuntimeIssue({
      lab: this.props.lab,
      category: 'runtime',
      level: 'error',
      message: error.message,
      extra: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="lab-runtime-failure" role="alert" aria-live="assertive">
          <h3>Simulation unavailable</h3>
          <p>
            The runtime encountered an unexpected error. Reload the page or disable advanced rendering.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}

export default LabErrorBoundary;
