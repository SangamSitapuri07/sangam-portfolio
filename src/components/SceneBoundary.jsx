import { Component } from 'react'

/**
 * SceneBoundary — keeps a WebGL failure from taking the page down with it.
 *
 * Context loss, a driver quirk or a shader that will not compile should degrade to
 * the static portfolio, not a blank rectangle. `App` swaps in the fallback layout
 * when this fires.
 */
export default class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env?.DEV) {
      console.warn('[scene] WebGL scene failed, showing the static portfolio:', error)
    }
    this.props.onError?.(error)
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
