# Sangam Sitapuri — portfolio

A developer portfolio that behaves like a short film. One scroll position drives
everything: where the camera sits, how far the laptop lid is open, what is painted
on the two displays, and which block of copy is reading. Scrolling up plays the
whole thing backwards, exactly.

React · Vite · Three.js · React Three Fiber · Drei · GSAP ScrollTrigger · Lenis ·
postprocessing · Tailwind CSS v4

**Live:** https://sangam-portfolio-roan.vercel.app

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
npm run preview    # serve the production build
```

## The film

`#05060A`, one electric-blue accent with a violet rim light, bloom and film grain
over the top. The machine is a scan of a cyberpunk laptop, and its hinge is a real
hinge: the lid pivots on its own axis and lifts so the closed lid never cuts
through the deck.

| | Scene | What the camera does |
| --- | --- | --- |
| 01 | Intro | Holds a wide shot while the scene loads |
| 02 | Hero | Rises past the keyboard, lid opening |
| 03 | About | Pushes in until the display is the subject |
| 04 | Skills | Swings around the base |
| 05 | Projects | Five push-ins, one per project, each on its own beat |
| 06 | Experience | Looks down over the whole machine |
| 07 | Contact | Pulls back to a wide, lid settling shut |

### Architecture

```
src/
  config/      laptop geometry · scenes + camera keyframes · quality tiers · tokens
  data/        profile · projects · skills · timeline   (the only source of copy)
  lib/         store · device · scrollEngine · timeline · director ·
               screenTextures · modelParts · proceduralLaptop
  components/  Laptop · CameraRig · Effects · Studio · Navbar · Loader ·
               SectionOverlay · UI primitives
  sections/    one React section per scene, plus the no-WebGL fallback page
```

- **One timeline.** `src/lib/timeline.js` maps normalised scroll progress to camera
  keyframes for every scene; GSAP ScrollTrigger owns the scroll, Lenis smooths it,
  and nothing else touches either.
- **No per-frame React state.** The frame loop writes directly to refs and to the
  three.js scene graph. React renders the DOM layer, the loader, and the nav.
- **Parallax never fights the scroll.** Pointer parallax is applied inside the same
  frame as the camera lerp, damped, and is disabled under reduced motion.

### Displays

Both panels are canvas textures painted per scene (`src/lib/screenTextures.js`):
a three-pane cockpit for the main display, a slim status panel on the side. Each
scene gets its own interface — a code editor, a project card with a diagram, a
timeline of rails, a contact card. They animate at roughly 7 fps so the texture
upload stays cheap.

### Quality and fallbacks

`high` / `medium` / `low` tiers are picked from the device on first paint, with one
automatic step down if the first ninety frames are slow. Mobile never exceeds
DPR 1.5. If WebGL is unavailable, a scene crashes, or the visitor chooses **Lite**,
the page becomes an ordinary one-column document: same content, same links, no
canvas.

## Checks

```bash
npm run verify     # everything below, ~12s
npm run lint       # eslint, no errors
```

| Command | What it proves |
| --- | --- |
| `verify:content` | 490 assertions: every data shape, and no dead references in copy |
| `verify:rig` | Loads the real GLB and asserts the hinge, the anchor points, the display's facing, and that no wide shot parks the machine under the copy column |
| `verify:dom` | Boots the app in jsdom: zero console errors, one `h1`, working fallback links |
| `verify:screens` | Paints every screen at every quality tier: correct copy, not blank, no overlapping text, no text off the panel, no glyph outside the font |

`verify:screens` writes previews to `.qa/screens/` (git-ignored) so the panels can
be looked at without a browser.

## Assets

- `public/models/cyberpunk_laptop.glb` — 3.07 MB, down from 8.33 MB via
  `npm run model:optimize` (quantisation, WebP textures, unused nodes dropped).
- `public/fonts/inter-latin.woff2` — self-hosted Inter; no third-party round-trip.
- `public/SangamCV.pdf` — the résumé the site links to.

## Deploy

Vercel and Netlify both build straight from the repo; `vercel.json` and
`netlify.toml` set the SPA fallback, immutable caching for hashed assets, and a
conservative set of security headers.

## Layout of the repository

`legacy-nextjs/` holds the previous Next.js portfolio, kept for reference. It is
not part of the build.
