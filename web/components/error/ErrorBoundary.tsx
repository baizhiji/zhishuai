<<<<<<< HEAD
'use client'

import { Component, ReactNode } from 'react'
import { Result, Button } from 'antd'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
=======
'use client';

import { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
<<<<<<< HEAD
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }
=======
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };
>>>>>>> 962968886be726cd434c792933b5515366d34518

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
<<<<<<< HEAD
        return this.props.fallback
=======
        return this.props.fallback;
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Result
            status="error"
            title="页面出错了"
            subTitle={this.state.error?.message || '抱歉，页面遇到了一些问题'}
            extra={
              <Button type="primary" onClick={this.handleReset}>
                重新加载
              </Button>
            }
          />
        </div>
<<<<<<< HEAD
      )
    }

    return this.props.children
=======
      );
    }

    return this.props.children;
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }
}
