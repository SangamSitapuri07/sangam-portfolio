/**
 * The storyboard.
 *
 * Ten scenes, in order, each owning:
 *   • how much scroll it consumes (`height`, in vh) — which *defines* its
 *     normalised range, so the DOM sections and the 3D timeline can never drift
 *     apart: both are derived from these numbers,
 *   • a list of camera keys (`keys`), scrub-driven, with an optional mobile
 *     camera, hinge value, exploded-view amount, pose, lighting and atmosphere,
 *   • optionally a `story`: the parts of the machine that speak, one at a time,
 *   • the interface the laptop's display shows, and which navigation item the
 *     scene belongs to.
 *
 * ## The frame
 *
 * The machine is the film, not an illustration beside the text: every scene is
 * framed `stage: 'full'`, so the laptop fills the viewport and the copy floats over
 * it on the shield in `config/scrim.js`. If a shot needs space beside the machine
 * there is `split`, but nothing in the film currently does.
 *
 * A camera is described by intent (see `lib/framing.js`), not coordinates:
 *
 *     frame({ azimuth: -20, elevation: 12, stage: 'full', fill: 0.96, dolly: 2.45 })
 *
 * `fit` decides *what* fills the frame:
 *   `core` — the assembled machine. The chassis fills the screen and a teardown's
 *            parts fly out past the edges, instead of the whole machine shrinking
 *            to keep every flying component in shot.
 *   `all`  — the machine as posed, parts included. For the wide "everything is
 *            apart" beats, and the first, shut-lid shot.
 *   `focus: '<part>'` — one component, for the story beats.
 *
 * ## The story beats
 *
 * Scene 03 stops on each layer of the machine and says what it is for; Scene 07
 * puts it back. A beat is `{ part, from, to }` in the scene's own 0…1 progress, and
 * the timeline turns it into a single weight that the camera, the component's
 * extra travel and the DOM caption all read — one number, three places, so they
 * cannot drift apart. The copy for every beat lives in `config/parts.js`.
 *
 * ## Continuity
 *
 * One continuous take, not ten clips: each scene opens on the pose (hinge, exploded
 * amount, yaw) the previous scene ended on, and the last sixth of every scene is
 * the travel to the next shot. `tools/verify-film.mjs` checks the camera never
 * steps any harder across a scene boundary than it does inside one.
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

/** The last key of every scene but the final one; see "Continuity" above. */
const HANDOVER = 0.86

/* ---------------------------------------------------------------------------
 * Shared pose spine.
 *
 * Yaw is the machine's turn on the spot (`rotation[1]`, radians). Scenes on either
 * side of a boundary quote the same value, so the object never snaps round between
 * shots.
 * ------------------------------------------------------------------------- */

const YAW = {
  awake: -0.26,
  awakeSettle: -0.12,
  engineOpen: 0.02,
  breakdownOrbit: -0.58,
  breakdownSettle: -0.66,
  coreSwing: -0.34,
  deepDive: -0.12,
  rebuildSettle: -0.02,
  beyond: 0.2,
  transmission: 0.34,
  afterglow: 0.4,
}

/* ---------------------------------------------------------------------------
 * 03 — The Breakdown Protocol.
 *
 * Declared before the array because Scene 07 is built *from* these keys: the
 * reassembly is the same explosion, replayed. That is a shared definition, not a
 * guessed inverse — `explode` is a pure input to `lib/explodedView.js`, so the
 * same numbers in reverse order are, exactly, the same part transforms backwards.
 * ------------------------------------------------------------------------- */

const breakdownKeys = [
  key(0, frame({ azimuth: -4, elevation: 10, stage: 'full', fill: 0.94, dolly: 2.66, fit: 'all' }), {
    cameraMobile: frame({ azimuth: -4, elevation: 10, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'all' }),
    lid: LID.open,
    explode: 0,
    rotation: [0, 0.02, 0],
    light: { glow: 1.0, rim: 0.95, ambient: 0.58 },
    fx: { particles: 0.4, grid: 0.5, circuits: 0.2, bloom: 0.9 },
  }),
  key(0.16, frame({ azimuth: -18, elevation: 15, stage: 'full', fill: 0.94, dolly: 2.52, fit: 'core' }), {
    cameraMobile: frame({ azimuth: -12, elevation: 13, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
    explode: 0.5,
    rotation: [0, YAW.breakdownOrbit, 0],
  }),
  /* --- the layers speak, in the order they come away --- */
  key(0.32, frame({ azimuth: -24, elevation: 12, stage: 'full', fill: 0.9, dolly: 2.3, focus: 'display' }), {
    cameraMobile: frame({ azimuth: -16, elevation: 11, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'display' }),
    explode: 0.66,
  }),
  key(0.46, frame({ azimuth: -34, elevation: 21, stage: 'full', fill: 0.9, dolly: 2.16, focus: 'keyboard' }), {
    cameraMobile: frame({ azimuth: -20, elevation: 18, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'keyboard' }),
    explode: 0.78,
  }),
  key(0.6, frame({ azimuth: -14, elevation: 30, stage: 'full', fill: 0.9, dolly: 2.16, focus: 'deck' }), {
    cameraMobile: frame({ azimuth: -8, elevation: 25, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'deck' }),
    explode: 0.88,
  }),
  key(0.74, frame({ azimuth: -4, elevation: 26, stage: 'full', fill: 0.9, dolly: 2.16, focus: 'bottom' }), {
    cameraMobile: frame({ azimuth: -2, elevation: 22, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'bottom' }),
    explode: 0.95,
  }),
  /* Back out for the handover: the whole machine, apart, ready for Scene 04. */
  key(HANDOVER, frame({ azimuth: -8, elevation: 18, stage: 'full', fill: 0.94, dolly: 2.59, fit: 'core' }), {
    cameraMobile: frame({ azimuth: -4, elevation: 15, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
    explode: 1,
    rotation: [0, YAW.breakdownSettle, 0],
    light: { glow: 1.15, rim: 1.05, ambient: 0.68 },
    fx: { particles: 0.3, grid: 0.7, circuits: 1, bloom: 1 },
  }),
]

/**
 * Scene 03's story: four layers, four claims.
 *
 * Windows are scene-local and do not overlap; the timeline turns them into one
 * weight that peaks on the beat's keyframe.
 */
const breakdownStory = [
  { part: 'display', from: 0.24, to: 0.4 },
  { part: 'keyboard', from: 0.4, to: 0.53 },
  { part: 'deck', from: 0.53, to: 0.67 },
  { part: 'bottom', from: 0.67, to: 0.82 },
]

const breakdownScene = {
  id: 'breakdown',
  chapter: 'breakdown',
  anchorId: 'skills',
  height: 250,
  nav: { label: 'Skills', id: 'skills' },
  screen: { section: 'breakdown' },
  keys: breakdownKeys,
  story: breakdownStory,
}

/**
 * Scene 07's explosion timeline: Scene 03's own `at`/`explode` pairs, reversed in
 * the same 0…`HANDOVER` window. Scene 03 opens at 0 (assembled) and hands over at
 * 0.86 (fully apart), so the mirror opens fully apart and is whole again by 0.86.
 */
const reassembly = breakdownKeys
  .map((entry) => ({ at: Math.round((HANDOVER - entry.at) * 1000) / 1000, explode: entry.explode }))
  .reverse()

/**
 * Scene 07's own shots.
 *
 * `at`/`explode` pairs come from `reassembly` — Scene 03's list reversed — so the
 * parts travel back along exactly the paths they left on. The camera does not
 * simply replay Scene 03: the teardown narrated the structural layers (interface,
 * input, foundation, base), so the rebuild narrates the other four (finish,
 * integrations, quality, the whole). Every shot is centred on its beat's window in
 * `rebuildStory` below, so the caption, the emphasis and the lens agree.
 */
const rebuildShots = [
  {
    explode: 1,
    camera: frame({ azimuth: -8, elevation: 18, stage: 'full', fill: 0.94, dolly: 2.59, fit: 'all' }),
    cameraMobile: frame({ azimuth: -6, elevation: 15, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'all' }),
  },
  {
    explode: 0.95,
    camera: frame({ azimuth: -1, elevation: 20, stage: 'full', fill: 0.9, dolly: 2.3, focus: 'accent' }),
    cameraMobile: frame({ azimuth: -1, elevation: 17, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'accent' }),
  },
  {
    explode: 0.88,
    camera: frame({ azimuth: 5, elevation: 24, stage: 'full', fill: 0.9, dolly: 2.3, focus: 'hardware' }),
    cameraMobile: frame({ azimuth: 3, elevation: 20, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'hardware' }),
  },
  {
    explode: 0.78,
    camera: frame({ azimuth: 11, elevation: 26, stage: 'full', fill: 0.9, dolly: 2.3, focus: 'details' }),
    cameraMobile: frame({ azimuth: 7, elevation: 22, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'details' }),
  },
  {
    explode: 0.66,
    camera: frame({ azimuth: 5, elevation: 20, stage: 'full', fill: 0.9, dolly: 2.3, focus: 'lid' }),
    cameraMobile: frame({ azimuth: 3, elevation: 17, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'lid' }),
  },
  {
    explode: 0.5,
    camera: frame({ azimuth: -9, elevation: 15, stage: 'full', fill: 0.93, dolly: 2.45, fit: 'core' }),
    cameraMobile: frame({ azimuth: -7, elevation: 13, stage: 'full', fill: 0.97, dolly: 2.35, fit: 'core' }),
  },
]

const rebuildScene = {
  id: 'rebuild',
  chapter: 'rebuild',
  anchorId: 'about',
  height: 225,
  nav: { label: 'About', id: 'about' },
  screen: { section: 'rebuild' },
  keys: [
    ...rebuildShots.map((shot, index) =>
      key(reassembly[index].at, shot.camera, {
        cameraMobile: shot.cameraMobile,
        /* Not re-authored: the same numbers Scene 03 used, read in reverse. */
        explode: reassembly[index].explode,
        ...(index === 0 ? { lid: LID.open, rotation: [0, YAW.breakdownSettle, 0] } : {}),
      })
    ),
    /* Whole again: hold it, let the light settle, hand over to Scene 08. */
    key(HANDOVER, frame({ azimuth: -12, elevation: 11, stage: 'full', fill: 0.94, dolly: 2.52, fit: 'core' }), {
      cameraMobile: frame({ azimuth: -9, elevation: 10, stage: 'full', fill: 0.98, dolly: 2.35, fit: 'core' }),
      explode: 0,
      rotation: [0, YAW.rebuildSettle, 0],
      light: { glow: 0.9, rim: 0.92, ambient: 0.56 },
      fx: { particles: 0.3, grid: 0.4, circuits: 0.1, bloom: 0.85 },
    }),
  ],
  story: [
    { part: 'accent', from: 0.05, to: 0.19 },
    { part: 'hardware', from: 0.19, to: 0.33 },
    { part: 'details', from: 0.33, to: 0.47 },
    { part: 'lid', from: 0.47, to: 0.62 },
  ],
}

export const scenes = [
  /* ------------------------------------------------------------------ 01
   * The Awakening. A closed machine, low in a nearly black room, lid parting as the
   * name arrives. The slab fills the width of the frame; the seam glows. */
  {
    id: 'awakening',
    chapter: 'awakening',
    anchorId: 'home',
    height: 115,
    nav: { label: 'Home', id: 'home' },
    screen: { section: 'awakening' },
    keys: [
      key(0, frame({ azimuth: -40, elevation: 9, stage: 'full', fill: 0.96, dolly: 2.16, fit: 'all' }), {
        cameraMobile: frame({ azimuth: -28, elevation: 10, stage: 'full', fill: 1.0, dolly: 2.2, fit: 'all' }),
        lid: 0.06,
        explode: 0,
        rotation: [0, YAW.awake, 0],
        light: { glow: 0.45, rim: 0.55, ambient: 0.36 },
        fx: { particles: 0.55, grid: 0.2, circuits: 0, bloom: 0.85 },
      }),
      key(0.55, frame({ azimuth: -32, elevation: 11, stage: 'full', fill: 0.97, dolly: 2.3, fit: 'all' }), {
        cameraMobile: frame({ azimuth: -22, elevation: 12, stage: 'full', fill: 1.0, dolly: 2.25, fit: 'all' }),
        lid: 0.2,
        rotation: [0, -0.2, 0],
        light: { glow: 0.62, rim: 0.68, ambient: 0.44 },
      }),
      key(HANDOVER, frame({ azimuth: -22, elevation: 12, stage: 'full', fill: 0.97, dolly: 2.38, fit: 'all' }), {
        cameraMobile: frame({ azimuth: -18, elevation: 13, stage: 'full', fill: 1.0, dolly: 2.3, fit: 'all' }),
        lid: 0.32,
        rotation: [0, YAW.awakeSettle, 0],
      }),
    ],
  },

  /* ------------------------------------------------------------------ 02
   * Into the Machine. The lid finishes opening while the camera rises past the
   * keyboard, then settles in front of the display. */
  {
    id: 'engine',
    chapter: 'engine',
    anchorId: 'home',
    height: 145,
    nav: { label: 'Home', id: 'home' },
    screen: { section: 'engine' },
    keys: [
      key(0, frame({ azimuth: -22, elevation: 12, stage: 'full', fill: 0.97, dolly: 2.38, fit: 'all' }), {
        cameraMobile: frame({ azimuth: -18, elevation: 13, stage: 'full', fill: 1.0, dolly: 2.3, fit: 'all' }),
        lid: 0.32,
        explode: 0,
        rotation: [0, YAW.awakeSettle, 0],
        light: { glow: 1.0, rim: 1.0, ambient: 0.62 },
        fx: { particles: 0.42, grid: 0.5, circuits: 0.1, bloom: 0.9 },
      }),
      key(0.5, frame({ azimuth: -14, elevation: 14, stage: 'full', fill: 0.96, dolly: 2.45, fit: 'core' }), {
        cameraMobile: frame({ azimuth: -10, elevation: 13, stage: 'full', fill: 0.99, dolly: 2.35, fit: 'core' }),
        lid: 0.85,
        rotation: [0, -0.05, 0],
      }),
      key(HANDOVER, frame({ azimuth: -6, elevation: 10, stage: 'full', fill: 0.95, dolly: 2.52, fit: 'core' }), {
        cameraMobile: frame({ azimuth: -5, elevation: 10, stage: 'full', fill: 0.99, dolly: 2.4, fit: 'core' }),
        lid: LID.open,
        rotation: [0, YAW.engineOpen, 0],
        light: { glow: 1.1, rim: 1.0, ambient: 0.66 },
      }),
    ],
  },

  breakdownScene,

  /* ------------------------------------------------------------------ 04
   * The Engineering Core. The machine stays open — the film only puts it back
   * together in Scene 07 — and the camera cranes round it while the skills read. */
  {
    id: 'core',
    chapter: 'core',
    anchorId: 'skills',
    height: 155,
    nav: { label: 'Skills', id: 'skills' },
    screen: { section: 'core' },
    keys: [
      key(0, frame({ azimuth: -8, elevation: 18, stage: 'full', fill: 0.94, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: -4, elevation: 15, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
        lid: LID.open,
        explode: 1,
        rotation: [0, YAW.breakdownSettle, 0],
        light: { glow: 1.2, rim: 1.05, ambient: 0.7 },
        fx: { particles: 0.3, grid: 0.7, circuits: 1, bloom: 0.95 },
      }),
      key(0.55, frame({ azimuth: 18, elevation: 24, stage: 'full', fill: 0.92, dolly: 2.52, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 11, elevation: 20, stage: 'full', fill: 0.97, dolly: 2.4, fit: 'core' }),
        rotation: [0, YAW.coreSwing, 0],
      }),
      key(HANDOVER, frame({ azimuth: 6, elevation: 16, stage: 'full', fill: 0.94, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 4, elevation: 14, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
        rotation: [0, -0.2, 0],
        light: { glow: 1.05, rim: 0.98, ambient: 0.64 },
      }),
    ],
  },

  /* ------------------------------------------------------------------ 05
   * Project Universe. The opened machine drifts behind the cards, one camera beat
   * per project. The scene generator adds a closing key at HANDOVER. */
  {
    id: 'universe',
    chapter: 'universe',
    anchorId: 'projects',
    height: 185,
    nav: { label: 'Projects', id: 'projects' },
    screen: { section: 'universe' },
    keys: [
      key(0, frame({ azimuth: 2, elevation: 14, stage: 'full', fill: 0.92, dolly: 2.66, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 2, elevation: 12, stage: 'full', fill: 0.97, dolly: 2.4, fit: 'core' }),
        lid: LID.open,
        explode: 1,
        rotation: [0, -0.2, 0],
        light: { glow: 1.0, rim: 0.95, ambient: 0.62 },
        fx: { particles: 0.5, grid: 0.55, circuits: 0.5, bloom: 0.9 },
      }),
    ],
    /** One camera beat per project card: degrees of orbit, size multiplier, lift. */
    beats: [
      { azimuth: 7, distance: 1.0, height: 0.02 },
      { azimuth: -6, distance: 0.96, height: 0.05 },
      { azimuth: 4, distance: 1.04, height: -0.01 },
    ],
  },

  /* ------------------------------------------------------------------ 06
   * The Deep Dive. Into the display: the case study is what the screen is showing,
   * so the camera goes to the screen. */
  {
    id: 'deep-dive',
    chapter: 'deep-dive',
    anchorId: 'projects',
    height: 175,
    nav: { label: 'Projects', id: 'projects' },
    screen: { section: 'deep-dive' },
    keys: [
      key(0, frame({ azimuth: 4, elevation: 12, stage: 'full', fill: 0.94, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 3, elevation: 11, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
        lid: LID.open,
        explode: 1,
        rotation: [0, -0.2, 0],
        light: { glow: 1.0, rim: 0.95, ambient: 0.6 },
        fx: { particles: 0.3, grid: 0.5, circuits: 0.4, bloom: 0.95 },
      }),
      key(0.5, frame({ azimuth: -4, elevation: 9, stage: 'full', fill: 0.9, dolly: 2.3, focus: 'display' }), {
        cameraMobile: frame({ azimuth: -2, elevation: 9, stage: 'full', fill: 0.96, dolly: 2.3, focus: 'display' }),
        rotation: [0, YAW.deepDive, 0],
      }),
      key(HANDOVER, frame({ azimuth: 0, elevation: 11, stage: 'full', fill: 0.94, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 0, elevation: 10, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
        rotation: [0, -0.08, 0],
      }),
    ],
  },

  rebuildScene,

  /* ------------------------------------------------------------------ 08
   * Beyond the Code. Whole again, calmer light, the person behind the work. */
  {
    id: 'beyond',
    chapter: 'beyond',
    anchorId: 'about',
    height: 155,
    nav: { label: 'About', id: 'about' },
    screen: { section: 'beyond' },
    keys: [
      key(0, frame({ azimuth: -10, elevation: 11, stage: 'full', fill: 0.94, dolly: 2.52, fit: 'core' }), {
        cameraMobile: frame({ azimuth: -7, elevation: 10, stage: 'full', fill: 0.98, dolly: 2.35, fit: 'core' }),
        lid: LID.open,
        explode: 0,
        rotation: [0, YAW.rebuildSettle, 0],
        light: { glow: 0.72, rim: 0.82, ambient: 0.5 },
        fx: { particles: 0.25, grid: 0.3, circuits: 0.08, bloom: 0.7 },
      }),
      key(0.55, frame({ azimuth: 12, elevation: 13, stage: 'full', fill: 0.93, dolly: 2.52, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 8, elevation: 11, stage: 'full', fill: 0.98, dolly: 2.35, fit: 'core' }),
        rotation: [0, 0.1, 0],
      }),
      key(HANDOVER, frame({ azimuth: 4, elevation: 12, stage: 'full', fill: 0.94, dolly: 2.52, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 3, elevation: 11, stage: 'full', fill: 0.98, dolly: 2.35, fit: 'core' }),
        rotation: [0, YAW.beyond, 0],
      }),
    ],
  },

  /* ------------------------------------------------------------------ 09
   * The Final Transmission. Wide and still; the contact copy owns the lower left. */
  {
    id: 'transmission',
    chapter: 'transmission',
    anchorId: 'contact',
    height: 155,
    nav: { label: 'Contact', id: 'contact' },
    screen: { section: 'transmission' },
    keys: [
      key(0, frame({ azimuth: 2, elevation: 12, stage: 'full', fill: 0.92, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 2, elevation: 11, stage: 'full', fill: 0.97, dolly: 2.4, fit: 'core' }),
        lid: LID.open,
        explode: 0,
        rotation: [0, YAW.beyond, 0],
        light: { glow: 0.9, rim: 0.9, ambient: 0.55 },
        fx: { particles: 0.35, grid: 0.3, circuits: 0.12, bloom: 0.85 },
      }),
      key(0.6, frame({ azimuth: 10, elevation: 13, stage: 'full', fill: 0.92, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 7, elevation: 12, stage: 'full', fill: 0.97, dolly: 2.4, fit: 'core' }),
        rotation: [0, 0.27, 0],
      }),
      key(HANDOVER, frame({ azimuth: 6, elevation: 14, stage: 'full', fill: 0.92, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 5, elevation: 12, stage: 'full', fill: 0.97, dolly: 2.4, fit: 'core' }),
        rotation: [0, YAW.transmission, 0],
      }),
    ],
  },

  /* ------------------------------------------------------------------ 10
   * The Afterglow. The lid comes down over the whole last scene; the room dims. */
  {
    id: 'afterglow',
    chapter: 'afterglow',
    anchorId: 'contact',
    height: 130,
    nav: { label: 'Contact', id: 'contact' },
    screen: { section: 'afterglow' },
    keys: [
      key(0, frame({ azimuth: 6, elevation: 12, stage: 'full', fill: 0.94, dolly: 2.52, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 5, elevation: 11, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
        lid: LID.open,
        explode: 0,
        rotation: [0, YAW.transmission, 0],
        light: { glow: 0.5, rim: 0.6, ambient: 0.4 },
        fx: { particles: 0.5, grid: 0.25, circuits: 0.04, bloom: 0.7 },
      }),
      key(1, frame({ azimuth: 10, elevation: 13, stage: 'full', fill: 0.95, dolly: 2.59, fit: 'core' }), {
        cameraMobile: frame({ azimuth: 7, elevation: 12, stage: 'full', fill: 0.98, dolly: 2.4, fit: 'core' }),
        /* The final beat: the lid comes down, slowly, over the whole last scene. */
        lid: 0.5,
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
