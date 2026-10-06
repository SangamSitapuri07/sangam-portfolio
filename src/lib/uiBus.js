/**
 * A one-line event bus for the handful of interactions that start inside the
 * three.js scene and have to end up in React.
 *
 * The frame loop must never set React state, so when the visitor clicks the
 * laptop's display the scene emits here and `App` — which is not on the hot path —
 * picks it up. Callbacks, not a store: nothing is retained, nothing re-renders
 * unless a real interaction happened.
 */

const listeners = new Set()

/** Subscribe. Returns an unsubscribe function. */
export const onDemoRequest = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Ask the UI to open the demo environment for a project. */
export const requestDemo = (projectId) => {
  for (const listener of listeners) listener(projectId)
}

export default { onDemoRequest, requestDemo }
