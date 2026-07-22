import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'
import './ErrorBoundary.css'

type Props = {
  children: ReactNode
  label?: string
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__card">
          <p className="error-boundary__eyebrow">Temporary issue</p>
          <h1 className="error-boundary__title">This section couldn’t load</h1>
          <p className="error-boundary__text">
            The page hit an unexpected error. Your data is safe — reload to continue.
          </p>
          {this.state.message ? <p className="error-boundary__detail">{this.state.message}</p> : null}
          <div className="error-boundary__actions">
            <Button type="button" size="lg" onClick={this.handleReload}>
              Reload page
            </Button>
            <Button type="button" size="lg" variant="secondary" onClick={this.handleReset}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
