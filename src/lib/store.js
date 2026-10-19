/**
 * Tiny reactive store — used for the handful of values that genuinely need to
 * re-render React (loading %, active section, quality tier, fallback flags).
 *
 * Per-frame animation values deliberately do NOT live here: they live in the
 * mutable `sceneState` object in `lib/scrollEngine.js`, which components read
 * inside `useFrame` without ever triggering a render.
 */

export function createStore(initialState) {
  let state = initialState
  const listeners = new Set()

  const getState = () => state

  const setState = (patch) => {
    const next = typeof patch === 'function' ? patch(state) : patch
    let changed = false
    for (const key of Object.keys(next)) {
      if (!Object.is(state[key], next[key])) {
        changed = true
        break
      }
    }
    if (!changed) return state
    state = { ...state, ...next }
    for (const listener of listeners) listener(state)
    return state
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { getState, setState, subscribe }
}

export default createStore
