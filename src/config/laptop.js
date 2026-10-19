/**
 * Laptop rig configuration.
 *
 * Every number here was measured from `public/models/cyberpunk_laptop.glb`
 * (37 meshes, 42 nodes, 8 textures, no animations) by loading the real asset and
 * raycasting it — not by eye, and not by assumption. The measurements that matter:
 *
 *   base group  (`Cube_0`)       x −1.02…1.02   y −0.05…0.12   z −0.75…0.82
 *   lid group   (`Cube001_3`)    x −1.02…1.22   y  0.07…1.69   z −1.09…−0.68
 *   main display (`Object_24`)   x −0.32…0.93   y  0.20…1.46   z −0.96…−0.75
 *   status panel (`Object_25`)   x −0.88…−0.40   y  0.27…1.00   z −0.88…−0.75
 *   keyboard     (`Object_5`)    x −0.93…0.95   y  0.01…0.05   z −0.39…0.57
 *
 * From those:
 *   • the monitor stands at the −Z end of the base, so the visitor sits at **+Z**;
 *     a ray from +Z lands on the display before the lid shell, so the panel faces
 *     the visitor. (Its quads are wound the other way, which is why the screen
 *     material is double-sided: the silhouette is right, only the winding is not.)
 *   • the hinge axis is the base's −Z edge: **z ≈ −0.71**, at deck height
 *     (y ≈ 0.12). The lid's own bottom edge sits just above it, y ≈ 0.19.
 *   • the authored pose is already "open, leaning back ~9.5°", so the rig opens to
 *     rotation 0 and closes by rotating the lid forward over the deck by ~99°.
 *
 * The old config had the hinge on the *front* lip with a 180° whole-machine flip
 * to compensate, which is why every preview showed the lid's back cover where the
 * screen should have been. Nothing needs a flip: the model is authored the right
 * way round.
 */

export const laptopModel = {
  /** Served from /public. The un-optimised master stays at the repo root. */
  url: '/models/cyberpunk_laptop.glb',
  /** Kept for re-exports that need a second location before the procedural one. */
  fallbackUrl: null,
  scale: 1,
}

/**
 * The two halves, as they are authored: two sibling groups under the glTF scene
 * root. Using the groups (rather than 37 hand-written mesh names) is the most
 * robust split available in this asset, and it is also the truth of the file.
 *
 * three.js sanitises node names, so `Cube.001_3` arrives as `Cube001_3`; both
 * spellings are accepted. `parts.base` / `parts.lid` remain as the geometric
 * fallback if a re-export flattens the hierarchy.
 */
export const parts = {
  groups: { base: ['Cube_0'], lid: ['Cube.001_3', 'Cube001_3'] },
  base: [
    'Object_4', 'Object_5', 'Object_6', 'Object_7', 'Object_8', 'Object_9',
    'Object_10', 'Object_11', 'Object_12', 'Object_13', 'Object_14', 'Object_15',
    'Object_16', 'Object_17',
  ],
  lid: [
    'Object_19', 'Object_20', 'Object_21', 'Object_22', 'Object_23', 'Object_24',
    'Object_25', 'Object_26', 'Object_27', 'Object_28', 'Object_29', 'Object_30',
    'Object_31', 'Object_32', 'Object_33', 'Object_34', 'Object_35', 'Object_36',
    'Object_37', 'Object_38', 'Object_39', 'Object_40', 'Object_41',
  ],
}

/** Used only when neither the group names nor the mesh lists match. */
export const autoSplit = {
  enabled: true,
  /** Model-space z past which a mesh cannot belong to the base (the hinge line). */
  baseLimitZ: -0.66,
}

/**
 * Hinge geometry, in machine-local space (the machine is centred on X/Z and stands
 * on y = 0; see `assembleLaptop`).
 *
 * Rotation about X: 0 = the authored open pose, `closedAngle` = the lid folded
 * forward onto the deck. The 99.5° is the authored lean (9.5°) plus the 90° the
 * lid has to travel to lie flat, so the shut machine is a shut machine, not a
 * lid floating above the keys.
 */
export const hinge = {
  x: 0,
  /** At deck height; the lid's own bottom edge hangs ~6 cm above it. */
  y: 0.14,
  /** The base's back edge. */
  z: -0.715,
  axis: 'x',
  closedAngle: 99.5,
  openAngle: 0,
  /**
   * Closing swings the lid down; because its bottom edge sits above the axis the
   * shut lid would clip the deck. `assembleLaptop` measures the overlap with the
   * lid shut and lifts the pivot by exactly that much, then settles the lift away
   * over the first part of the opening arc. `null` = measure it.
   */
  closedLift: null,
  liftSettle: 0.5,
}

/**
 * The two display panels.
 *
 * Both are single meshes of a few quads whose UVs cover a sub-window of the
 * artist's atlas, so `normaliseScreenUv()` stretches them to 0…1 and a full-bleed
 * canvas texture fits exactly.
 */
export const screens = {
  main: {
    /** Node name (GLTFLoader names the Object3D after the node). */
    node: 'Object_24',
    /** The mesh's own name in the glTF, kept for diagnostics. */
    meshName: 'Object_19',
    /** Panel aspect from the measured bounds: 1.25 × 1.26. */
    width: 1.253,
    height: 1.26,
    aspect: 1.253 / 1.26,
    resolution: 1024,
    /** Emissive intensity while the screen is awake (the model ships with 10). */
    intensity: 1.35,
  },
  status: {
    node: 'Object_25',
    meshName: 'Object_20',
    width: 0.485,
    height: 0.73,
    aspect: 0.485 / 0.73,
    resolution: 512,
    intensity: 1.0,
    enabledOnMobile: false,
  },
}

/** A hairline glass sheet in front of the display: the panel reads as glass. */
export const glass = {
  enabled: true,
  roughness: 0.08,
  opacity: 0.055,
  /** Pushed out from the panel along its own outward normal. */
  offset: 0.006,
}

/** The dark studio floor the machine stands on. */
export const ground = {
  enabled: true,
  y: 0,
  shadowScale: 1.35,
  shadowOpacity: 0.85,
}

/**
 * Pointer parallax. Deliberately tiny and ADDITIVE: applied after the scroll
 * timeline resolves, so it can never fight the scroll animation.
 */
export const parallax = {
  enabled: true,
  rotationX: 0.05,
  rotationY: 0.075,
  positionX: 0.04,
  positionY: 0.03,
  damping: 3.4,
}

export const modelAttribution = {
  title: 'CyberPunk Laptop',
  author: 'Vivien Deroche',
  license: 'CC-BY-4.0',
  source: 'https://sketchfab.com/3d-models/cyberpunk-laptop-8330c89e8431451db3aa9d15c5836ddf',
}

export default {
  laptopModel,
  parts,
  autoSplit,
  hinge,
  screens,
  glass,
  ground,
  parallax,
  modelAttribution,
}
