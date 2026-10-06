/**
 * Laptop rig configuration.
 *
 * Everything in this file was measured from `cyberpunk_laptop.glb` (glTF 2.0,
 * 37 meshes) rather than guessed:
 *
 *   • The model is a sketchfab-style sculpt: the base (keyboard + deck) and the
 *     lid (cover + display + status panel) are NOT separate parents — they are
 *     distinguished mesh-by-mesh. `parts.base` / `parts.lid` below list the node
 *     names that belong to each half.
 *
 *   • The lid's local origin sits ON the hinge line, at its hinge edge, so the
 *     lid is parented to the pivot and simply rotated about X. The model is
 *     authored with the lid lying flat, display facing +Y; a closed laptop
 *     therefore needs the lid rotated 180°, and opening rotates it back by
 *     `openAngle` degrees (a real hinge arc, never a fake whole-laptop spin).
 *
 *   • The hinge line is at z = 0.82 in model units (base is ~2.04 wide).
 *
 *   • Display panels are found by their emissive materials, so the list keeps
 *     working if the model is re-exported:
 *       main   → node Object_24 (Material.019, emissive strength 10)
 *       status → node Object_25 (Material.020, emissive strength 2.27)
 *     (Their *mesh* names are Object_19 / Object_20 — worth knowing, because
 *     GLTFLoader names the Object3D after the glTF node, not the mesh.)
 *     Both use a sub-window of their atlas UVs, so `normaliseScreenUv` stretches
 *     them to 0…1 and our own full-bleed screen texture fits exactly.
 *
 * Change a value here (or run the app with `?debug=1` to get sliders) — no
 * component needs to know anything about the model's internals.
 */

export const laptopModel = {
  /** Served from /public. The un-optimised master stays at the repo root. */
  url: '/models/cyberpunk_laptop.glb',

  /**
   * Optional secondary source: if `url` 404s (e.g. the optimised file was not
   * generated yet), the loader falls back to this before using the procedural
   * placeholder. Relative to the web root.
   */
  fallbackUrl: null,

  /** Uniform scale + centring applied to the imported scene, in scene units. */
  scale: 1,
  /** Model-space offsets applied before the hinge maths (keep at 0 unless re-exported). */
  offset: [0, 0, 0],
}

/** Node names (glTF `node.name`) that make up each half of the laptop. */
export const parts = {
  base: [
    'Object_4', 'Object_5', 'Object_6', 'Object_7', 'Object_8', 'Object_9', 'Object_10',
    'Object_11', 'Object_12', 'Object_13', 'Object_14', 'Object_15', 'Object_16', 'Object_17',
  ],
  lid: [
    'Object_19', 'Object_20', 'Object_21', 'Object_22', 'Object_23', 'Object_24', 'Object_25',
    'Object_26', 'Object_27', 'Object_28', 'Object_29', 'Object_30', 'Object_31', 'Object_32',
    'Object_33', 'Object_34', 'Object_35', 'Object_36', 'Object_37', 'Object_38', 'Object_39',
    'Object_40', 'Object_41',
  ],
}

/**
 * If a re-export renames nodes, the explicit lists above stop matching. Rather
 * than render nothing, the rig then splits meshes by this rule: anything whose
 * bounding-box centre is behind (`hinge.z` and beyond) and above `divideY`
 * belongs to the lid. `rig.autoSplit` toggles it.
 */
export const autoSplit = {
  enabled: true,
  /** Lid meshes sit at y >= this in model space once the lid is up. */
  divideY: 0.0,
}

/**
 * Hinge geometry, in model space (before `laptopModel.scale`).
 *
 * Worked out from the vertex data, then verified by re-rendering the assembled
 * model: the lid's local origin already sits on the hinge line, the model's
 * display faces -Z, and the user therefore sits at -Z. The rig renders the whole
 * machine rotated 180° about Y so the world's +Z is "in front of the screen" —
 * that keeps every camera value in `config/scenes.js` readable.
 *
 * Rotation about X interpolates between the two angles below:
 *   closed  → -180°  (lid laid over the deck, display down: a shut laptop)
 *   open    →  -75°  (display leaning back ~15° past vertical: a lifelike posture)
 * so a full opening is 105° of genuine hinge travel.
 */
export const hinge = {
  /** Position of the hinge AXIS: x is centred, y is the barrel height, z is the fold line. */
  x: 0,
  y: 0.057,
  z: 0.82,
  /** Axis the lid rotates around. The model hinges along X. */
  axis: 'x',
  /** Lid rotation (degrees) when the machine is shut. */
  closedAngle: -180,
  /** Lid rotation (degrees) at the fully open pose used by the storyboard. */
  openAngle: -75,
  /**
   * A real barrel hinge lifts the lid clear of the keyboard as it closes. The rig
   * measures the deck height and the lid's own thickness at load time and drops
   * this lift back to ~0 as the lid opens — so the shut laptop rests on the deck
   * instead of sinking through it.
   *
   * `null` = compute from the model's bounding boxes (recommended).
   */
  closedLift: null,
  openLift: 0,
  /** Fraction of the opening travel over which the lift settles. */
  liftSettle: 0.55,
}

/** The two display panels, addressed by node name and located by material. */
export const screens = {
  /**
   * Main display — five quads in one mesh (`Object_19`) forming a three-pane
   * cockpit: panes at x -0.325…0.093, 0.133…0.471 and 0.511…0.928 with two
   * recessed seams between them. The whole arrangement measures 1.253 × 1.273
   * model units (essentially square), which is the aspect used below — the drawn
   * interface is designed as three columns so the seams fall on real divisions.
   */
  main: {
    /* Node name — glTF node 24, whose mesh is also called "Object_19". GLTFLoader
       names the Object3D after the NODE, so this is the string that matters. */
    node: 'Object_24',
    /** Fallback identifier: the mesh's own name in the glTF. */
    meshName: 'Object_19',
    width: 1.253,
    height: 1.273,
    aspect: 1.253 / 1.273,
    /** Long edge of the canvas texture, in pixels, before quality scaling. */
    resolution: 1024,
    /** Emissive intensity while the screen is awake (the model ships with 10). */
    intensity: 1.55,
    /** The model's own emissive art, kept as a standby wallpaper. */
    keepOriginalAsStandby: true,
  },
  /**
   * Secondary panel — two stacked quads (`Object_20`), 0.485 × 0.744, sitting on
   * the left of the lid. Reads as a slim side monitor next to the keyboard.
   */
  status: {
    /* glTF node 25 (mesh "Object_20") — the slim side panel. */
    node: 'Object_25',
    meshName: 'Object_20',
    width: 0.485,
    height: 0.744,
    aspect: 0.485 / 0.744,
    resolution: 512,
    intensity: 1.1,
    /** Hidden on small screens: it is a detail, and detail costs performance. */
    enabledOnMobile: false,
  },
}

/**
 * Fresnel-ish glass overlay drawn in front of the display so the panel reads as
 * a physical screen with reflections instead of a glowing texture.
 */
export const glass = {
  enabled: true,
  roughness: 0.08,
  opacity: 0.06,
  /** Distance pushed out along the panel normal, as a fraction of panel height. */
  offset: 0.012,
}

/** Plane used for the cinematic contact shadow under the laptop. */
export const ground = {
  enabled: true,
  /** Slight lift avoids z-fighting with the shadow plane. */
  y: -0.056,
  /** Radius of the soft radial shadow, relative to the model width. */
  shadowScale: 1.35,
  shadowOpacity: 0.85,
}

/**
 * Subtle mouse-parallax response. Deliberately tiny and ADDITIVE: it is applied
 * after the scroll timeline resolves, with a lower weight, so it can never fight
 * the scroll animation.
 */
export const parallax = {
  enabled: true,
  /** Radians of extra tilt at the extremes of the pointer range. */
  rotationX: 0.055,
  rotationY: 0.085,
  /** Scene units the laptop may drift. */
  positionX: 0.05,
  positionY: 0.035,
  /** How fast the response follows the pointer (higher = snappier). */
  damping: 3.4,
}

export default { laptopModel, parts, autoSplit, hinge, screens, glass, ground, parallax }
