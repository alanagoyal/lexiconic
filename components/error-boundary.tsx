"use client"

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return (
        <div className="p-8 text-center border border-red-200 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          <button
            onClick={this.retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
            type="button"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience component for search-specific errors
export function SearchErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-medium text-foreground mb-2">
        Search temporarily unavailable
      </h3>
      <p className="text-muted-foreground mb-4">
        We're having trouble processing your search. Please try again.
      </p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
        type="button"
      >
        Retry Search
      </button>
    </div>
  )
}