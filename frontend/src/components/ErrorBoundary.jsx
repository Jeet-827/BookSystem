import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, send to error monitoring service like Sentry
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg text-center space-y-5">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-gray-900 font-display">
                Something went wrong
              </h1>
              <p className="text-xs text-gray-500">
                An unexpected application error occurred. We've been notified and are looking into it.
              </p>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="bg-red-50 p-3 rounded-lg text-left overflow-auto max-h-32 text-[11px] font-mono text-red-800 border border-red-200">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all shadow"
              >
                <Home size={15} />
                <span>Return Home</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all"
              >
                <RotateCcw size={15} />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
