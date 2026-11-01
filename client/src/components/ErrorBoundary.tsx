import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="layout">
          <h1>Something went wrong</h1>
          <p className="error">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>Try again</button>
        </main>
      )
    }
    return this.props.children
  }
}
