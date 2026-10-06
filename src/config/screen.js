/**
 * The scene's own configuration for the main display panel.
 *
 * All of this is derived from the model's vertex data, not guessed:
 *
 *   Panel quad (node Object_19), local coordinates:
 *     bottom edge  z = 0.16   ↔ UV v = -0.013
 *     top edge     z = 1.379  ↔ UV v =  0.996
 *
 *   The lid's hinge edge is local z = 0.16, so v = 0 is the BOTTOM of the
 *   display and v = 1 is the TOP. glTF textures are uploaded with flipY = false
 *   (UV v = 0 samples the image's top row), which means a canvas texture drawn
 *   the natural way would land upside down. Canvas textures here therefore keep
 *   three.js' default `flipY = true`.
 *
 *   UVs only cover a sub-window of the artist's atlas (u 0.188…0.814,
 *   v -0.057…0.996), so `normaliseScreenUv()` stretches them to 0…1 and our drawn
 *   interface fills the panel exactly.
 */
export const screenMapping = {
  /** Set on the CanvasTextures we generate for the display. */
  canvasFlipY: true,
  /** Remap the panel's UVs to cover 0…1 before assigning our texture. */
  normaliseUv: true,
  /** Keep a little padding so bezel edges never bleed. */
  uvPadding: 0.004,
}

/**
 * What each canvas texture shows. `screenTextures.js` renders these to an
 * offscreen canvas; the keys below are the section ids used by `config/scenes.js`.
 */
export const screenSections = [
  'boot',
  'hero',
  'about',
  'skills',
  'experience',
  'contact',
]

/** Palette used inside the screen interfaces (kept in sync with the site tokens). */
export const screenTheme = {
  background: '#080b12',
  backgroundAlt: '#0b0f18',
  panel: '#111722',
  line: '#1e2735',
  ink: '#e8eef9',
  inkSoft: '#98a5bb',
  inkFaint: '#5d6879',
  accent: '#4b8cff',
  accentSoft: '#2f6fe0',
  violet: '#7c5cff',
  positive: '#54e0a0',
  warn: '#ffb25e',
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSans: "'Inter', system-ui, sans-serif",
}

export default { screenMapping, screenSections, screenTheme }
