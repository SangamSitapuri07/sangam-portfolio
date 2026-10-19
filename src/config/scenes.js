/**
 * The storyboard.
 *
 * Ten scenes, in order, each owning:
 *   • how much scroll it consumes (`height`, in vh) — which *defines* its
 *     normalised range, so the DOM sections and the 3D timeline can never drift
 *     apart: both are derived from these numbers,
 *   • a list of camera keys (`keys`), scrub-driven, with an optional mobile
 *     camera, hinge value, exploded-view amount, pose, lighting and atmosphere,
 *   • the interface the laptop's display shows, and which navigation item the
 *     scene belongs to.
 *
 * A camera is described by intent (see `lib/framing.js`), not coordinates:
 *
 *     frame({ azimuth: -20, elevation: 12, stage: 'split', fill: 0.94, dolly: 3.5 })
 *     → "from twenty degrees to the machine's left and twelve degrees above it,
 *        fitted into the copy-free part of the viewport, filling 94% of it, with
 *        the lens three and a half subject-radii away"
 *
 * `dolly` is perspective, not size: the lens is solved to fit the stage, so the
 * machine always fills the same part of the frame; the dolly decides how far away
 * the camera stands and therefore how dramatic the foreshortening is. That is
 * what keeps the composition readable on an ultrawide monitor and on a phone.
 *
 * Layout rule for the whole film: copy lives on the left, the machine lives in the
 * right-hand stage. On phones the copy moves under the machine, so every
 * `cameraMobile` fits the machine into the top half of the viewport. The stages
 * (and the copy rectangles they imply) are defined once, in `lib/framing.js`, and
 * checked against the real geometry by `tools/preview-composition.mjs`.
 *
 * Continuity rule: this is one continuous take, not ten clips. A scene boundary
 * is a *scroll* boundary, so the pose must not teleport across it — the fine art
 * of a cut has no place in something the visitor scrubs by thumb. Every scene
 * therefore opens on the pose (hinge, exploded view, yaw) the previous scene
 * ended on, and `tools/preview-film.mjs` stages both sides of every boundary to
 * prove the camera steps by the same small amount as anywhere else in the film.
 *
 * Timing rule: a scene's last key lands at 0.86, not 1, except for the final
 * scene. That leaves the last sixth of every scene for the film to travel to the
 * next scene's opening shot, rather than arriving and waiting.
 *
 * The machine is ~2.04 wide, ~1.7 tall with the lid open, standing on y = 0 and
 * facing +Z (the visitor).
 */

/* Relative, not aliased: this module is also loaded by plain Node in the content
   and composition checks, which do not run through Vite's resolver. */
import { frame } from '../lib/framing.js'

/** Hinge travel: 0 = shut, 1 = the authored open pose (leaning back ~9.5°). */
const LID = { shut: 0, ajar: 0.8, open: 1 }

/** A key: a camera at `at` (fraction of the scene's own range) plus what changes. */
const key = (at, camera, extra = {}) => ({ at, camera, ...extra })

/** The last key of every scene but the final one; see "Timing rule" above. */
const HANDOVER = 0.86

/* ---------------------------------------------------------------------------
 * Shared pose spine.
 *
 * Read down this list: yaw is the machine's turn on the spot (`rotation[1]`),
 * in radians, and it starts turned away from the visitor and ends facing them
 * again. Both scenes on either side of every boundary quote the same value, so
 * the object never snaps round between shots.
 * ------------------------------------------------------------------------- */

const YAW = {
  awake: -0.30,
  awakeSettle: -0.18,
  engineOpen: 0.04,
  breakdownOrbit: -0.55,
  breakdownSettle: -0.62,
  coreSwing: -0.85,
  deepDiveSettle: -0.66,
  rebuildSettle: -0.05,
  beyond: 0.22,
  transmission: 0.36,
  afterglow: 0.42,
}

/* ---------------------------------------------------------------------------
 * 03 — The Breakdown Protocol.
 *
 * Declared before the array because Scene 07 is built *from* these keys: the
 * reassembly is the same explosion, replayed. That is a shared definition, not a
 * guessed inverse — `explode` is a pure input to `lib/explodedView.js`, so the
 * same numbers in reverse order are, exactly, the same part transforms backwards.
 * ------------------------------------------------------------------------- */

const breakdownScene = {
  id: 'breakdown',
  chapter: 'breakdown',
  anchorId: 'skills',
  height: 235,
  nav: { label: 'Skills', id: 'skills' },
  screen: { section: 'breakdown' },
  keys: [
    key(0, frame({ azimuth: -8, elevation: 7, stage: 'split', fill: 0.94, dolly: 3.8 }), {
      cameraMobile: frame({ azimuth: -6, elevation: 8, stage: 'split', fill: 1, dolly: 2.35 }),
      lid: LID.open,
      explode: 0,
      rotation: [0, 0.04, 0],
      light: { glow: 1.0, rim: 0.95, ambient: 0.6 },
      fx: { particles: 0.35, grid: 0.6, circuits: 0.3, bloom: 0.9 },
    }),
    key(0.26, frame({ azimuth: -40, elevation: 14, stage: 'split', fill: 0.94, dolly: 3.2 }), {
      cameraMobile: frame({ azimuth: -24, elevation: 13, stage: 'split', fill: 1, dolly: 2.35 }),
      explode: 0.34,
      rotation: [0, -0.3, 0],
    }),
    key(0.58, frame({ azimuth: -58, elevation: 18, stage: 'split', fill: 0.94, dolly: 3 }), {
      cameraMobile: frame({ azimuth: -34, elevation: 16, stage: 'split', fill: 1, dolly: 2.35 }),
      explode: 0.74,
      rotation: [0, YAW.breakdownOrbit, 0],
    }),
    key(HANDOVER, frame({ azimuth: -30, elevation: 24, stage: 'split', fill: 0.94, dolly: 3.2 }), {
      cameraMobile: frame({ azimuth: -20, elevation: 18, stage: 'split', fill: 1, dolly: 2.35 }),
      explode: 1,
      rotation: [0, YAW.breakdownSettle, 0],
      light: { glow: 1.15, rim: 1.05, ambient: 0.68 },
      fx: { particles: 0.3, grid: 0.75, circuits: 1, bloom: 1 },
    }),
  ],
}

/**
 * Scene 07's keys: Scene 03's own ``at`/`explode` pairs, reversed inside the same
 * 0…`HANDOVER` window. Scene 03 opens at 0 and hands over at 0.86, so the mirror
 * opens at 0 with amount 1 and reaches amount 0 exactly where Scene 03 began.
 */
const reassemblyKeys = breakdownScene.keys
  .map((entry) => ({ at: Math.round((HANDOVER - entry.at) * 1000) / 1000, explode: entry.explode }))
  .reverse()

const reassemblyScene = {
  id: 'rebuild',
  chapter: 'rebuild',
  anchorId: 'about',
  height: 215,
  nav: { label: 'About', id: 'about' },
  screen: { section: 'rebuild' },
  /* The camera is the film's, not a mirror image: it keeps travelling round the
     machine as the parts come home. What is mirrored is the explosion itself. */
  keys: [
    key(reassemblyKeys[0].at, frame({ azimuth: 0, elevation: 11, stage: 'split', fill: 0.94, dolly: 3.3 }), {
      cameraMobile: frame({ azimuth: 0, elevation: 11, stage: 'split', fill: 0.98, dolly: 2.35 }),
      lid: LID.open,
      explode: reassemblyKeys[0].explode,
      rotation: [0, YAW.breakdownSettle, 0],
      light: { glow: 1.12, rim: 1.05, ambient: 0.66 },
      fx: { particles: 0.45, grid: 0.65, circuits: 0.9, bloom: 0.95 },
    }),
    key(reassemblyKeys[1].at, frame({ azimuth: -20, elevation: 15, stage: 'split', fill: 0.94, dolly: 3.2 }), {
      cameraMobile: frame({ azimuth: -12, elevation: 13, stage: 'split', fill: 1, dolly: 2.35 }),
      explode: reassemblyKeys[1].explode,
      rotation: [0, -0.44, 0],
    }),
    key(reassemblyKeys[2].at, frame({ azimuth: -8, elevation: 12, stage: 'split', fill: 0.94, dolly: 3.5 }), {
      cameraMobile: frame({ azimuth: -5, elevation: 10, stage: 'split', fill: 1, dolly: 2.35 }),
      explode: reassemblyKeys[2].explode,
      rotation: [0, -0.26, 0],
    }),
    key(reassemblyKeys[3].at, frame({ azimuth: 4, elevation: 11, stage: 'split', fill: 0.94, dolly: 3.5 }), {
      cameraMobile: frame({ azimuth: 3, elevation: 9, stage: 'split', fill: 1, dolly: 2.35 }),
      explode: reassemblyKeys[3].explode,
      rotation: [0, YAW.rebuildSettle, 0],
      light: { glow: 0.9, rim: 0.92, ambient: 0.56 },
      fx: { particles: 0.3, grid: 0.4, circuits: 0.3, bloom: 0.85 },
    }),
  ],
}

export const scenes = [
  /* ------------------------------------------------------------------ 01
   * The Awakening. A shut machine, low and to the right, in a nearly black room.
   * The lid lifts as the name arrives. */
  {
    id: 'awakening',
    chapter: 'awakening',
    anchorId: 'home',
    height: 105,
    nav: { label: 'Home', id: 'home' },
    screen: { section: 'awakening' },
    keys: [
      key(0, frame({ azimuth: -30, elevation: 9, stage: 'split', fill: 0.92, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -24, elevation: 12, stage: 'split', fill: 0.98, dolly: 2.35 }),
        lid: LID.shut,
        explode: 0,
        rotation: [0, YAW.awake, 0],
        light: { glow: 0.45, rim: 0.55, ambient: 0.36 },
        fx: { particles: 0.55, grid: 0.2, circuits: 0, bloom: 0.85 },
      }),
      key(0.6, frame({ azimuth: -24, elevation: 10, stage: 'split', fill: 0.92, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -20, elevation: 13, stage: 'split', fill: 0.98, dolly: 2.35 }),
        lid: 0.08,
        rotation: [0, -0.24, 0],
        light: { glow: 0.62, rim: 0.68, ambient: 0.44 },
      }),
      key(HANDOVER, frame({ azimuth: -18, elevation: 12, stage: 'split', fill: 0.92, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -16, elevation: 14, stage: 'split', fill: 0.98, dolly: 2.35 }),
        lid: 0.2,
        rotation: [0, YAW.awakeSettle, 0],
      }),
    ],
  },

  /* ------------------------------------------------------------------ 02
   * Into the Machine. The lid finishes opening while the camera rises past the
   * keyboard, then settles in front of the display. Copy on the left. */
  {
    id: 'engine',
    chapter: 'engine',
    anchorId: 'home',
    height: 140,
    nav: { label: 'Home', id: 'home' },
    screen: { section: 'engine' },
    keys: [
      key(0, frame({ azimuth: -18, elevation: 12, stage: 'split', fill: 0.94, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -16, elevation: 14, stage: 'split', fill: 1, dolly: 2.35 }),
        /* Opens from here, not between scenes: the hinge keeps travelling, so the
           framing never has to jump to catch it. */
        lid: 0.2,
        explode: 0,
        rotation: [0, YAW.awakeSettle, 0],
        light: { glow: 1.0, rim: 1.0, ambient: 0.62 },
        fx: { particles: 0.42, grid: 0.5, circuits: 0.1, bloom: 0.9 },
      }),
      key(0.5, frame({ azimuth: -22, elevation: 15, stage: 'split', fill: 0.94, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -17, elevation: 14, stage: 'split', fill: 1, dolly: 2.35 }),
        lid: 0.9,
        rotation: [0, -0.08, 0],
      }),
      key(HANDOVER, frame({ azimuth: -14, elevation: 8, stage: 'split', fill: 0.94, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -10, elevation: 9, stage: 'split', fill: 1, dolly: 2.35 }),
        lid: LID.open,
        rotation: [0, YAW.engineOpen, 0],
        light: { glow: 1.1, rim: 1.0, ambient: 0.66 },
      }),
    ],
  },

  breakdownScene,

  /* ------------------------------------------------------------------ 04
   * The Engineering Core. Inside the opened chassis, which stays open: the film
   * only puts the machine back together in Scene 07, on purpose. */
  {
    id: 'core',
    chapter: 'core',
    anchorId: 'skills',
    height: 145,
    nav: { label: 'Skills', id: 'skills' },
    screen: { section: 'core' },
    keys: [
      key(0, frame({ azimuth: -22, elevation: 26, stage: 'split', fill: 0.92, dolly: 3.5 }), {
        cameraMobile: frame({ azimuth: -16, elevation: 22, stage: 'split', fill: 0.99, dolly: 2.35 }),
        lid: LID.open,
        explode: 1,
        rotation: [0, YAW.breakdownSettle, 0],
        light: { glow: 1.2, rim: 1.05, ambient: 0.7 },
        fx: { particles: 0.3, grid: 0.7, circuits: 1, bloom: 0.95 },
      }),
      key(0.55, frame({ azimuth: -38, elevation: 24, stage: 'split', fill: 0.92, dolly: 3.5 }), {
        cameraMobile: frame({ azimuth: -24, elevation: 20, stage: 'split', fill: 0.99, dolly: 2.35 }),
        rotation: [0, -0.72, 0],
      }),
      key(HANDOVER, frame({ azimuth: -28, elevation: 16, stage: 'split', fill: 0.92, dolly: 3.2 }), {
        cameraMobile: frame({ azimuth: -18, elevation: 14, stage: 'split', fill: 0.99, dolly: 2.35 }),
        rotation: [0, YAW.coreSwing, 0],
        light: { glow: 1.05, rim: 0.98, ambient: 0.64 },
      }),
    ],
  },

  /* ------------------------------------------------------------------ 05
   * Project Universe. Wide, with the machine behind the cards; one camera beat
   * per project. The exploded machine stays open behind them. */
  {
    id: 'universe',
    chapter: 'universe',
    anchorId: 'projects',
    height: 175,
    nav: { label: 'Projects', id: 'projects' },
    screen: { section: 'universe' },
    keys: [
      key(0, frame({ azimuth: -22, elevation: 14, stage: 'split', fill: 0.88, dolly: 3.5 }), {
        cameraMobile: frame({ azimuth: -14, elevation: 12, stage: 'split', fill: 0.94, dolly: 2.35 }),
        lid: LID.open,
        explode: 1,
        rotation: [0, YAW.coreSwing, 0],
        light: { glow: 1.0, rim: 0.95, ambient: 0.62 },
        fx: { particles: 0.5, grid: 0.55, circuits: 0.5, bloom: 0.9 },
      }),
    ],
    /** One camera beat per project card: degrees of orbit, size multiplier, lift. */
    beats: [
      { azimuth: 8, distance: 1.0, height: 0.03 },
      { azimuth: -7, distance: 0.96, height: 0.06 },
      { azimuth: 4, distance: 1.04, height: -0.01 },
    ],
  },

  /* ------------------------------------------------------------------ 06
   * The Deep Dive. Close on the display, copy on the left. */
  {
    id: 'deep-dive',
    chapter: 'deep-dive',
    anchorId: 'projects',
    height: 160,
    nav: { label: 'Projects', id: 'projects' },
    screen: { section: 'deep-dive' },
    keys: [
      key(0, frame({ azimuth: -12, elevation: 6, stage: 'split', fill: 1.0, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -8, elevation: 7, stage: 'split', fill: 1.0, dolly: 2.35 }),
        lid: LID.open,
        explode: 1,
        rotation: [0, YAW.coreSwing, 0],
        light: { glow: 1.0, rim: 0.95, ambient: 0.6 },
        fx: { particles: 0.3, grid: 0.5, circuits: 0.4, bloom: 0.95 },
      }),
      key(0.6, frame({ azimuth: -5, elevation: 5, stage: 'split', fill: 1.0, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: -3, elevation: 6, stage: 'split', fill: 1.0, dolly: 2.35 }),
        rotation: [0, -0.74, 0],
      }),
      key(HANDOVER, frame({ azimuth: 0, elevation: 11, stage: 'split', fill: 0.94, dolly: 3.3 }), {
        cameraMobile: frame({ azimuth: 0, elevation: 11, stage: 'split', fill: 0.98, dolly: 2.35 }),
        rotation: [0, YAW.deepDiveSettle, 0],
      }),
    ],
  },

  reassemblyScene,

  /* ------------------------------------------------------------------ 08
   * Beyond the Code. Calmer; machine to the right, copy on the left. */
  {
    id: 'beyond',
    chapter: 'beyond',
    anchorId: 'about',
    height: 145,
    nav: { label: 'About', id: 'about' },
    screen: { section: 'beyond' },
    keys: [
      key(0, frame({ azimuth: 4, elevation: 11, stage: 'split', fill: 0.9, dolly: 3.5 }), {
        cameraMobile: frame({ azimuth: 2, elevation: 10, stage: 'split', fill: 0.97, dolly: 2.35 }),
        lid: LID.open,
        explode: 0,
        rotation: [0, YAW.rebuildSettle, 0],
        light: { glow: 0.72, rim: 0.82, ambient: 0.5 },
        fx: { particles: 0.25, grid: 0.3, circuits: 0.08, bloom: 0.7 },
      }),
      key(0.55, frame({ azimuth: 16, elevation: 12, stage: 'split', fill: 0.9, dolly: 3.5 }), {
        cameraMobile: frame({ azimuth: 10, elevation: 11, stage: 'split', fill: 0.97, dolly: 2.35 }),
        rotation: [0, 0.1, 0],
      }),
      key(HANDOVER, frame({ azimuth: 10, elevation: 13, stage: 'split', fill: 0.9, dolly: 3.5 }), {
        cameraMobile: frame({ azimuth: 7, elevation: 11, stage: 'split', fill: 0.97, dolly: 2.35 }),
        rotation: [0, YAW.beyond, 0],
      }),
    ],
  },

  /* ------------------------------------------------------------------ 09
   * The Final Transmission. Wide; the contact copy owns the left of the frame. */
  {
    id: 'transmission',
    chapter: 'transmission',
    anchorId: 'contact',
    height: 150,
    nav: { label: 'Contact', id: 'contact' },
    screen: { section: 'transmission' },
    keys: [
      key(0, frame({ azimuth: 8, elevation: 13, stage: 'split', fill: 0.86, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: 5, elevation: 11, stage: 'split', fill: 0.93, dolly: 2.35 }),
        lid: LID.open,
        explode: 0,
        rotation: [0, YAW.beyond, 0],
        light: { glow: 0.9, rim: 0.9, ambient: 0.55 },
        fx: { particles: 0.35, grid: 0.3, circuits: 0.12, bloom: 0.85 },
      }),
      key(0.6, frame({ azimuth: 5, elevation: 14, stage: 'split', fill: 0.86, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: 4, elevation: 12, stage: 'split', fill: 0.93, dolly: 2.35 }),
        rotation: [0, 0.3, 0],
      }),
      key(HANDOVER, frame({ azimuth: 3, elevation: 15, stage: 'split', fill: 0.86, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: 3, elevation: 13, stage: 'split', fill: 0.93, dolly: 2.35 }),
        rotation: [0, YAW.transmission, 0],
      }),
    ],
  },

  /* ------------------------------------------------------------------ 10
   * The Afterglow. The lid comes down, the room dims, the film settles. The copy
   * is a single line under a centred machine, so this is the one scene framed
   * centrally rather than to the right. */
  {
    id: 'afterglow',
    chapter: 'afterglow',
    anchorId: 'contact',
    height: 120,
    nav: { label: 'Contact', id: 'contact' },
    screen: { section: 'afterglow' },
    keys: [
      key(0, frame({ azimuth: 8, elevation: 12, stage: 'banner', fill: 0.9, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: 5, elevation: 11, stage: 'banner', fill: 0.92, dolly: 2.35 }),
        lid: LID.open,
        explode: 0,
        rotation: [0, YAW.transmission, 0],
        light: { glow: 0.5, rim: 0.6, ambient: 0.4 },
        fx: { particles: 0.5, grid: 0.25, circuits: 0.04, bloom: 0.7 },
      }),
      key(1, frame({ azimuth: 10, elevation: 13, stage: 'banner', fill: 0.9, dolly: 3.8 }), {
        cameraMobile: frame({ azimuth: 6, elevation: 12, stage: 'banner', fill: 0.92, dolly: 2.35 }),
        /* The final beat: the lid comes down, slowly, over the whole last scene. */
        lid: 0.55,
        rotation: [0, YAW.afterglow, 0],
        light: { glow: 0.42, rim: 0.55, ambient: 0.38 },
      }),
    ],
  },
]

/** Time budget shared with the DOM overlay: how each scene's window is used. */
export const overlayTiming = {
  enterFraction: 0.3,
  holdFraction: 0.44,
  exitFraction: 0.26,
}

/** The five navigation items, in order. Several scenes share one item. */
export const navSections = [
  { id: 'home', label: 'Home' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export const sceneById = Object.fromEntries(scenes.map((scene) => [scene.id, scene]))

export default scenes
