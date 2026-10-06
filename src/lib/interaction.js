/**
 * Direct manipulation of the machine.
 *
 * Scroll owns the story: where the camera sits, how far the lid is open, which
 * screen is painted. It must keep owning them, or scrolling back up would no
 * longer retrace the film. So everything in this file is an *offset* on top of
 * the storyboard — never a replacement for it:
 *
 *   • drag        — the visitor turns the machine with a pointer or a finger
 *   • idle drift  — when nothing is happening, the machine breathes instead of
 *                   sitting frozen, which is the difference between "a model" and
 *                   "a photograph of a model"
 *
 * Both decay. Release the drag and the machine eases back to the angle the
 * storyboard asked for, so scene five always frames the way scene five was
 * composed. Nothing here writes React state, and nothing here allocates per frame.
 *
 * Touch is deliberately careful: a vertical swipe is how you scroll the page, so a
 * finger only takes control once the gesture is clearly horizontal. Taking every
 * touch would break scrolling, which is the one thing this portfolio cannot do.
 */

/** Live interaction state, read by the director inside the frame loop. */
export const interaction = {
  /** Current damped orbit offset, radians. Added to the machine's rotation. */
  yaw: 0,
  pitch: 0,
  /** Where the offset is heading. While dragging this follows the pointer. */
  targetYaw: 0,
  targetPitch: 0,
  /** A small vertical bob, so the idle state has a little life in it. */
  bob: 0,
  /** Slow waves added while the visitor is idle. Declared up front so the shape
      of this object never changes and the frame loop allocates nothing. */
  driftYaw: 0,
  driftPitch: 0,

  dragging: false,
  /** True while the pointer is over the display and a demo could be opened. */
  hoveringScreen: false,

  /**
   * Seconds since the visitor last did anything, accumulated from frame deltas
   * rather than read off the wall clock. Wall-clock time since page load gave the
   * wrong answer for the first couple of seconds of a session, and it made the
   * behaviour depend on when the tab happened to be opened.
   */
  sinceInput: 0,
  /** 0…1 — how strongly drift is blended in. Ramped, never switched. */
  idleWeight: 0,

  reducedMotion: false,
}

/** How far a full-width drag turns the machine, in radians. */
const YAW_RANGE = 0.85
const PITCH_RANGE = 0.38
/** Drag sensitivity: fraction of the drag's travel that becomes rotation. */
const DRAG_GAIN = 2.6
/** How fast the offset follows the drag, and how fast it lets go afterwards. */
const FOLLOW_LAMBDA = 9
const RELEASE_LAMBDA = 1.1
/** Seconds of no scroll and no dragging before the machine starts to drift. */
const IDLE_AFTER = 2.2
const IDLE_RAMP = 1.6

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value)

const listeners = {
  element: null,
  onActivate: null,
  onHoverChange: null,
  cleanup: null,
}

/**
 * Attach DOM listeners. Called once, from inside the canvas, with the canvas
 * element itself.
 */
export function initInteraction({ element, onActivate, onHoverChange, reducedMotion = false } = {}) {
  destroyInteraction()
  if (!element) return () => {}

  listeners.element = element
  listeners.onActivate = onActivate ?? null
  listeners.onHoverChange = onHoverChange ?? null
  interaction.reducedMotion = reducedMotion

  let pointerId = null
  let startX = 0
  let startY = 0
  let baseYaw = 0
  let basePitch = 0
  let axis = null // 'x' once a touch gesture has committed to turning the machine

  const touch = (event) => event.pointerType === 'touch'

  const begin = (event) => {
    if (interaction.reducedMotion) return
    if (event.button !== 0 && event.pointerType === 'mouse') return
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    baseYaw = interaction.targetYaw
    basePitch = interaction.targetPitch
    axis = touch(event) ? null : 'x'
    interaction.sinceInput = 0
    if (axis === 'x') {
      interaction.dragging = true
      element.setPointerCapture?.(pointerId)
      element.style.cursor = 'grabbing'
    }
  }

  const move = (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    interaction.sinceInput = 0

    if (axis === null) {
      /* A finger decides what the gesture is: horizontal turns the machine,
         vertical belongs to the page. Below the threshold, wait. */
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        axis = 'x'
        interaction.dragging = true
        element.style.cursor = 'grabbing'
      } else {
        axis = 'scroll'
        pointerId = null
        return
      }
    }
    if (axis !== 'x') return

    /* Only a committed horizontal gesture is allowed to eat the browser's scroll. */
    if (touch(event) && event.cancelable) event.preventDefault()

    const width = element.clientWidth || 1
    interaction.targetYaw = clamp(
      baseYaw + (dx / width) * YAW_RANGE * DRAG_GAIN,
      -YAW_RANGE,
      YAW_RANGE
    )
    interaction.targetPitch = clamp(
      basePitch + (dy / (element.clientHeight || 1)) * PITCH_RANGE * DRAG_GAIN,
      -PITCH_RANGE,
      PITCH_RANGE
    )
  }

  const end = (event) => {
    if (pointerId === null || (event && event.pointerId !== pointerId)) return
    pointerId = null
    axis = null
    interaction.dragging = false
    element.style.cursor = interaction.hoveringScreen ? 'pointer' : 'grab'
  }

  /* A click that was not a drag opens the demo for whatever is on screen. */
  const click = () => {
    if (!interaction.hoveringScreen || interaction.reducedMotion) return
    listeners.onActivate?.()
  }

  element.addEventListener('pointerdown', begin)
  element.addEventListener('pointermove', move, { passive: false })
  element.addEventListener('pointerup', end)
  element.addEventListener('pointercancel', end)
  element.addEventListener('click', click)

  listeners.cleanup = () => {
    element.removeEventListener('pointerdown', begin)
    element.removeEventListener('pointermove', move)
    element.removeEventListener('pointerup', end)
    element.removeEventListener('pointercancel', end)
    element.removeEventListener('click', click)
    element.style.cursor = ''
  }

  /* The machine is draggable, so say so before anyone touches it. */
  element.style.cursor = 'grab'

  return listeners.cleanup
}

export function destroyInteraction() {
  listeners.cleanup?.()
  listeners.cleanup = null
  interaction.dragging = false
  interaction.hoveringScreen = false
  interaction.targetYaw = 0
  interaction.targetPitch = 0
  interaction.yaw = 0
  interaction.pitch = 0
  interaction.idleWeight = 0
}

/** Report the visitor's scroll so the idle timer knows the film is being driven. */
export function noteScrollActivity() {
  interaction.sinceInput = 0
}

/**
 * Advance the offsets. Called once per frame, before the director reads them.
 *
 * `dt` is seconds, `time` is the film clock in seconds.
 */
export function updateInteraction(dt, time) {
  if (interaction.reducedMotion) {
    interaction.yaw = 0
    interaction.pitch = 0
    interaction.bob = 0
    return
  }

  /* A drag is activity by definition. */
  if (interaction.dragging) interaction.sinceInput = 0
  else interaction.sinceInput += dt

  /* Idle drifts in, and drifts back out the instant anything happens. */
  const wantIdle = !interaction.dragging && interaction.sinceInput > IDLE_AFTER ? 1 : 0
  const ramp = wantIdle ? dt / IDLE_RAMP : -dt / (IDLE_RAMP * 0.4)
  interaction.idleWeight = clamp(interaction.idleWeight + ramp, 0, 1)

  /* Not dragging and not drifting: ease the manual angle back to the storyboard. */
  if (!interaction.dragging && interaction.idleWeight <= 0) {
    const settle = 1 - Math.exp(-RELEASE_LAMBDA * dt)
    interaction.targetYaw += (0 - interaction.targetYaw) * settle
    interaction.targetPitch += (0 - interaction.targetPitch) * settle
  }

  const lambda = interaction.dragging ? FOLLOW_LAMBDA : FOLLOW_LAMBDA * 0.55
  const follow = 1 - Math.exp(-lambda * dt)
  interaction.yaw += (interaction.targetYaw - interaction.yaw) * follow
  interaction.pitch += (interaction.targetPitch - interaction.pitch) * follow

  /* Two slow waves at incommensurate periods, so the motion never looks looped. */
  const w = interaction.idleWeight
  interaction.bob = (Math.sin(time * 0.62) * 0.014 + Math.sin(time * 0.41 + 1.7) * 0.008) * w
  interaction.driftYaw = Math.sin(time * 0.31) * 0.045 * w
  interaction.driftPitch = Math.sin(time * 0.23 + 0.6) * 0.022 * w
}

export default {
  interaction,
  initInteraction,
  destroyInteraction,
  updateInteraction,
  noteScrollActivity,
}
