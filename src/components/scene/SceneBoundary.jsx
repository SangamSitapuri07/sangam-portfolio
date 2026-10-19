import { Component } from 'react'
import LaptopPoster from './LaptopPoster.jsx'

export default class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFailure?.()
  }

  render() {
    return this.state.failed ? <LaptopPoster /> : this.props.children
  }
}
