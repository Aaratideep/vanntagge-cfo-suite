'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled runtime error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-white border border-rose-200 shadow-xl rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-outfit mb-2">
              {this.props.fallbackTitle || 'Workspace View Temporarily Unavailable'}
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              An unexpected display issue occurred in this workspace view. Your data and session are secure. You can reload this view or return to the main dashboard.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono text-left mb-6 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw size={16} />
                Reload View
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 flex items-center gap-2 border border-slate-200 cursor-pointer"
              >
                <Home size={16} />
                Main Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

