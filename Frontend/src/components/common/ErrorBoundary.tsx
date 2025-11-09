/**
 * ErrorBoundary Component
 * 
 * React error boundary to catch and handle errors gracefully.
 * Provides fallback UI and error reporting capabilities.
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Show detailed error info (dev mode) */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors and displays fallback UI.
 * 
 * @example
 * ```tsx
 * // Wrap app or routes
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary 
 *   fallback={<CustomErrorUI />}
 *   onError={(error) => logToService(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error reporting service (e.g., Sentry)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full">
            <Result
              status="error"
              title="Oops! Something went wrong"
              subTitle="We're sorry for the inconvenience. The application encountered an unexpected error."
              extra={[
                <Button
                  type="primary"
                  key="reload"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>,
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>,
              ]}
            />

            {/* Show error details in development */}
            {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error Details (Development Mode)
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-red-700">Error Message:</p>
                    <pre className="text-xs text-red-600 bg-white p-2 rounded mt-1 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-sm font-medium text-red-700">Stack Trace:</p>
                      <pre className="text-xs text-red-600 bg-white p-2 rounded mt-1 overflow-auto max-h-60">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-sm font-medium text-red-700">Component Stack:</p>
                      <pre className="text-xs text-red-600 bg-white p-2 rounded mt-1 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap component with ErrorBoundary
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   onError: (error) => console.error(error)
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
