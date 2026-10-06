/**
 * The storyboard.
 *
 * Seven scenes, exactly as briefed, each one owning:
 *   • how much scroll length it consumes (`height`, in vh) — which *defines* its
 *     normalised progress range, so the DOM and the 3D timeline can never drift
 *     apart: both are derived from these numbers,
 *   • where the camera sits and what it looks at (desktop and mobile separately),
 *   • how the laptop is posed, and how far its lid is open,
 *   • which interface the laptop screen shows,
 *   • how bright the studio lighting is, and how the text overlay is anchored.
 *
 * Camera values are anchor-relative — `anchor` is where the camera sits relative
 * to, `offset` is added in scene units, and `look` is the point it aims at. The
 * anchors are measured from the loaded laptop (see `lib/anchors.js`), so these
 * numbers read like direction and survive a model swap:
 *
 *     { anchor: 'screen', offset: [0.15, 0.22, 1.55], look: { anchor: 'screen' } }
 *     → "one and a half metres in front of the display, slightly above it,
 *        looking straight at the screen"
 *
 * The machine is ~2.04 units wide and ~1.45 tall with its lid open, standing on
 * a ground plane at y = 0.
 */

/** Fraction of the hinge travel: 0 = shut, 1 = the authored open pose (~105°). */
const LID = { shut: 0, half: 0.5, open: 1, ajar: 0.93 }

export const scenes = [
  {
    id: 'intro',
    name: 'Intro',
    height: 105,
    nav: null,
    /** Closed machine on a dark stage, low and off-centre. */
    camera: {
      anchor: 'base',
      offset: [0.4, 0.44, 3.0],
      look: { anchor: 'base', offset: [-0.06, 0.08, 0] },
      fov: 30,
    },
    cameraMobile: {
      anchor: 'base',
      offset: [0.34, 0.56, 2.95],
      look: { anchor: 'base', offset: [-0.04, 0.04, 0] },
      fov: 42,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.16, 0] },
    lid: LID.shut,
    screen: { section: 'boot' },
    light: { glow: 0.82, rim: 0.9, ambient: 0.55 },
    overlay: { anchor: 'center', variant: 'intro' },
  },

  {
    id: 'hero',
    name: 'Hero',
    height: 150,
    nav: { label: 'Home', id: 'home' },
    /**
     * The lid is open. The machine is framed to the right by aiming left of the
     * deck, which hands the left half of the viewport to the hero copy.
     */
    camera: {
      anchor: 'deck',
      offset: [1.32, 1.0, 2.58],
      look: { anchor: 'deck', offset: [-0.72, 0.42, -0.08] },
      fov: 32,
    },
    cameraMobile: {
      anchor: 'deck',
      offset: [0.95, 0.95, 2.7],
      look: { anchor: 'deck', offset: [-0.26, 0.24, -0.05] },
      fov: 44,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.42, 0] },
    lid: LID.open,
    screen: { section: 'hero' },
    light: { glow: 1.16, rim: 1.0, ambient: 0.7 },
    overlay: { anchor: 'left', variant: 'hero' },
  },

  {
    id: 'about',
    name: 'About',
    height: 150,
    nav: { label: 'About', id: 'about' },
    /** Pushed in until the display itself is the subject. */
    camera: {
      anchor: 'screen',
      offset: [0.16, 0.2, 1.52],
      look: { anchor: 'screen', offset: [0, -0.02, 0] },
      fov: 30,
    },
    cameraMobile: {
      anchor: 'screen',
      offset: [0.16, 0.24, 1.78],
      look: { anchor: 'screen', offset: [0, 0, 0] },
      fov: 42,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.1, 0] },
    lid: LID.open,
    screen: { section: 'about' },
    light: { glow: 1.0, rim: 0.95, ambient: 0.62 },
    overlay: { anchor: 'right', variant: 'about' },
  },

  {
    id: 'skills',
    name: 'Skills',
    height: 150,
    nav: { label: 'Skills', id: 'skills' },
    /** Pull back and swing around: the machine becomes an object again. */
    camera: {
      anchor: 'base',
      offset: [2.2, 1.62, 2.32],
      look: { anchor: 'base', offset: [-0.06, 0.4, -0.06] },
      fov: 33,
    },
    cameraMobile: {
      anchor: 'base',
      offset: [1.92, 1.68, 2.3],
      look: { anchor: 'base', offset: [0, 0.28, -0.06] },
      fov: 43,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.62, 0.02] },
    lid: LID.ajar,
    screen: { section: 'skills' },
    light: { glow: 1.05, rim: 1.0, ambient: 0.66 },
    overlay: { anchor: 'left', variant: 'skills' },
  },

  {
    id: 'projects',
    name: 'Projects',
    /* The strongest section, and the longest in scroll: one beat per project. */
    height: 265,
    nav: { label: 'Projects', id: 'projects' },
    camera: {
      anchor: 'screen',
      offset: [0.5, 0.4, 2.0],
      look: { anchor: 'screen', offset: [0, 0.02, 0] },
      fov: 30,
    },
    cameraMobile: {
      anchor: 'screen',
      offset: [0.44, 0.46, 2.18],
      look: { anchor: 'screen', offset: [0, 0, 0] },
      fov: 42,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.34, 0] },
    lid: LID.open,
    screen: { section: 'projects' },
    light: { glow: 1.1, rim: 1.0, ambient: 0.66 },
    overlay: { anchor: 'left', variant: 'projects' },
    /**
     * Each project beat nudges the base camera: azimuth in radians (negative
     * swings around the other way), a distance multiplier and a height offset.
     * The list cycles if there are more projects than entries.
     */
    beats: [
      { azimuth: 0.3, distance: 1.0, height: 0.0 },
      { azimuth: -0.22, distance: 0.94, height: 0.08 },
      { azimuth: 0.14, distance: 1.06, height: -0.05 },
      { azimuth: -0.32, distance: 0.98, height: 0.06 },
      { azimuth: 0.04, distance: 0.92, height: 0.02 },
    ],
  },

  {
    id: 'experience',
    name: 'Experience',
    height: 150,
    nav: { label: 'Experience', id: 'experience' },
    /** Elevated, looking down over the machine. */
    camera: {
      anchor: 'machine',
      offset: [1.45, 1.75, 2.05],
      look: { anchor: 'deck', offset: [0, 0.02, -0.12] },
      fov: 34,
    },
    cameraMobile: {
      anchor: 'machine',
      offset: [1.3, 1.72, 2.06],
      look: { anchor: 'deck', offset: [0, -0.04, -0.12] },
      fov: 43,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.72, 0.03] },
    lid: LID.ajar,
    screen: { section: 'experience' },
    light: { glow: 0.95, rim: 0.9, ambient: 0.6 },
    overlay: { anchor: 'right', variant: 'experience' },
  },

  {
    id: 'contact',
    name: 'Contact',
    height: 155,
    nav: { label: 'Contact', id: 'contact' },
    /** The film breathes out: the camera withdraws, the lid comes down. */
    camera: {
      anchor: 'machine',
      offset: [0, 1.18, 4.05],
      look: { anchor: 'machine', offset: [0, -0.16, 0] },
      fov: 31,
    },
    cameraMobile: {
      anchor: 'machine',
      offset: [0.2, 1.34, 3.96],
      look: { anchor: 'machine', offset: [0, -0.18, 0] },
      fov: 41,
    },
    laptop: { position: [0, 0, 0], rotation: [0, -0.1, 0] },
    lid: LID.half,
    screen: { section: 'contact' },
    light: { glow: 0.62, rim: 0.72, ambient: 0.48 },
    overlay: { anchor: 'center', variant: 'contact' },
  },
]

/**
 * The closing keyframe: the camera drifts a little further back and the lid
 * settles nearly shut, mirroring the opening frame of the film.
 */
export const endKeyframe = {
  camera: {
    anchor: 'machine',
    offset: [0, 1.42, 4.8],
    look: { anchor: 'machine', offset: [0, -0.22, 0] },
    fov: 31,
  },
  cameraMobile: {
    anchor: 'machine',
    offset: [0.24, 1.6, 4.6],
    look: { anchor: 'machine', offset: [0, -0.24, 0] },
    fov: 41,
  },
  laptop: { position: [0, 0, 0], rotation: [0, -0.06, 0] },
  lid: 0.12,
  light: { glow: 0.52, rim: 0.62, ambient: 0.44 },
}

/** Time budget shared with the DOM overlay: how each scene's window is used. */
export const overlayTiming = {
  enterFraction: 0.3,
  holdFraction: 0.45,
  exitFraction: 0.25,
}

/** Nav order — the intro scene is not a nav item; it lives inside "Home". */
export const navSections = scenes.filter((scene) => scene.nav).map((scene) => scene.nav)

export const sceneById = Object.fromEntries(scenes.map((scene) => [scene.id, scene]))

export default scenes
