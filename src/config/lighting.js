/**
 * The studio.
 *
 * Positions are in world space around the machine (which stands at the origin,
 * ~2 units wide). Colours and intensities are the *base* values; the director
 * multiplies them by the scene's light key (`light.glow / rim / ambient`), so the
 * storyboard can dim the room for the opening and the closing without any of these
 * numbers changing.
 */

export const studio = {
  ambient: { color: '#8ea6d8' },

  key: {
    /** Front-left, a little above the deck. */
    position: [-3.2, 3.4, 3.6],
    color: '#cfe0ff',
  },

  rimA: {
    /** Cyan, behind-left: traces the lid's edge against the dark. */
    position: [-3.6, 2.4, -3.2],
    color: '#35e7ff',
    angle: 0.9,
  },

  rimB: {
    /** Violet, behind-right, used sparingly for separation. */
    position: [3.8, 1.9, -2.8],
    color: '#7c5cff',
    angle: 0.95,
  },

  screenFill: {
    position: [0, 1.0, -0.4],
    color: '#8fb8ff',
  },

  underglow: {
    position: [0, 0.05, 0.2],
    color: '#1fc9ff',
  },

  /** The floor pool the machine stands in. */
  ground: {
    warm: 'rgba(120,170,230,0.26)',
    mid: 'rgba(60,110,170,0.1)',
    far: 'rgba(20,30,50,0.02)',
  },
}

export default studio
