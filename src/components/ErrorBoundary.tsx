"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if it's a Convex function error
      const isConvexError = this.state.error?.message?.includes("Could not find public function") ||
                           this.state.error?.message?.includes("getUserProfile");

      if (isConvexError) {
        // For Convex errors, show a warning but still render children
        // This allows the form to work even if functions aren't deployed
        return (
          <>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Some features may not be available. The Convex function &quot;getUserProfile&quot; is not deployed. 
                    Please run <code className="bg-yellow-100 px-1 rounded">npx convex dev</code> or <code className="bg-yellow-100 px-1 rounded">npx convex deploy</code> to deploy functions.
                    You can still use the form below.
                  </p>
                </div>
              </div>
            </div>
            {this.props.children}
          </>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow p-6 max-w-md border border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || "An error occurred while loading this page."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
