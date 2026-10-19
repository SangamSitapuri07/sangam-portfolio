/**
 * Atmosphere settings.
 *
 * Every effect is restrained on purpose: the brief's rule is that the machine is
 * the hero, so dust, grid and circuit filaments are lighting and depth cues, not
 * decoration. Each one reads its intensity from `film.fx` (published by the
 * director per scene), so a scene can bring the room up without a React render.
 */

export const atmosphere = {
  dust: {
    /** Points in the volume, per quality tier. */
    high: 420,
    medium: 260,
    low: 120,
    /** Scene units. */
    spread: 14,
    height: 5.2,
    size: 0.022,
    /** Peak opacity at fx.particles = 1. */
    opacity: 0.55,
    /** Radians per second of the slow whole-cloud rotation. */
    drift: 0.014,
  },

  grid: {
    y: -0.002,
    size: 26,
    /** Peak opacity at fx.grid = 1. */
    opacity: 0.5,
    /** UV units per second — the floor drifts toward the camera. */
    scroll: 0.012,
  },

  circuits: {
    color: '#35e7ff',
    /** Peak opacity at fx.circuits = 1. */
    opacity: 0.5,
    /** How far the trace's elbow rises above the two endpoints. */
    bend: 0.12,
    /**
     * Endpoints, in machine-local units. The circuits are only visible while the
     * machine is opened up (Scenes 03–06), so these are positions in the *exploded*
     * composition: the lid's display, the keyboard floating above the deck, the
     * deck plate and the chassis. They connect real parts — they are not a
     * diagram of internals the model does not have.
     */
    links: [
      [[0.3, 1.62, -1.15], [0.05, 1.02, 0.12]],
      [[-0.6, 1.5, -1.12], [-0.05, 0.98, 0.1]],
      [[-0.05, 0.98, 0.1], [-0.1, 0.55, 0.05]],
      [[-0.1, 0.55, 0.05], [0.02, 0.12, 0.0]],
      [[0.75, 0.3, 0.1], [0.02, 0.12, 0.0]],
      [[-0.85, 0.24, 0.05], [0.02, 0.12, 0.0]],
      [[0.3, 1.62, -1.15], [0.9, 0.6, 0.0]],
    ],
  },
}

/** Cinematic camera treatment. */
export const camera = {
  /** Slight roll used when the machine is thrown into the breakdown. */
  rollScale: 0.06,
  /** How much wider the lens gets during the widest shots (not used yet). */
  maxFov: 46,
}

export default { atmosphere, camera }
