# Cinematic 3D Portfolio — Architecture & Implementation Plan

**Project:** `sangam-portfolio`
**Branch:** `arena/b472ec98-sangam-portfolio`
**Target:** a scroll-controlled cinematic 3D developer portfolio (React + Vite + R3F + GSAP ScrollTrigger + Lenis + postprocessing + Tailwind).

---

## 0. Reconnaissance — what I verified before planning

I inspected the repository, the provided `.glb` (binary-level, not by assumption) and the CV before writing a single line of the app.

### 0.1 Repository audit

| Item | Finding |
|---|---|
| Stack in repo | **Next.js 14 App Router** — spec requires **Vite**. Migration required. |
| Real code present | ~29 of 117 source files contain code; **88 files are 0 bytes** (empty stubs in `src/components/...`) |
| Unused assets | `public/models/face.glb` = **39.3 MB**, `face-mobile.glb`, 4 `.webp` textures, 12 `.mp3` audio files, `og-image.jpg`, `favicon.ico` — **all 0 bytes except `face.glb`** |
| Security | `package.json`/`package-lock.json` pin old, unaudited versions of a 3D stack; a fresh Vite dependency set is safer and also required by the spec |
| Branch | working branch `arena/b472ec98-sangam-portfolio` exists, tree clean at `5b0d1a9` |

**Decision:** this branch becomes a **clean, from-scratch Vite + React project** (per spec §22–24). The old Next.js app is not usable as a base (it is a different, half-finished concept with 88 empty files) and leaving it in place would make `npm run dev` / `npm run build` ambiguous. Nothing is lost: the old content is preserved in git history at `5b0d1a9`.

### 0.2 `cyberpunk_laptop.glb` — verified internals

Read directly from the GLB's JSON chunk + binary chunk (custom parser + software rasterizer render, since the sandbox has no Node at first pass — outputs reviewed visually):

| Property | Value |
|---|---|
| Size / version | 8.33 MB, glTF 2.0 binary, `KHR_materials_emissive_strength` |
| Meshes / nodes | 37 meshes, 42 nodes, **no animations** (so the hinge must be driven by us — correct approach anyway) |
| Group **A** = `Cube_0` (nodes 4–17) | 14 meshes, 24,185 tris, bbox `x −1.02…1.02, y −0.05…0.12, z −0.75…0.82` |
| Group **B** = `Cube.001_3` (nodes 19–41) | 23 meshes, 75,329 tris, bbox `x −1.02…1.22, y −0.05…0.14, z −0.01…1.62` |
| **Lid hinge axis** | **Z = 0.74, Y = 0.05, axis = X**, opening direction **−105°** (verified by rasterising the model rotated about three candidate pivots — Z=0.74 is the only one that assembles into a real laptop: upright screen + flat base with keyboard facing up) |
| Lid ↔ base split | Screens, bezel and hinge covers live in the same group as the keyboard/deck meshes — the model is a "sketchfab-sculpt" rather than a rig-ready asset, so the split must be done **by mesh**, at runtime, from a config-declared mesh-name list |
| Screen panels (from emissive materials) | `Material.019` → node `Object_19`: **main display**, 512×256 emissive texture, `emissiveStrength 10`; `Material.020` → node `Object_25`: **secondary status panel**, 256×256, strength 2.27 |
| Screen UVs | panels use an **atlas sub-window** (u `0.188…0.814`, v `−0.057…0.996`) → UVs must be **normalised to 0…1** before our own screen texture can be mapped full-bleed |
| Textures | 8 images, 2.74 MB (1 unused 1024² PNG = 1.16 MB, 1 unused 1024² JPG = 0.88 MB) → ~2 MB of dead weight removable by pruning |
| Visual identity | dark grey/black anodised body, brushed metal deck, orange accent strip, thin emissive cyan HUD screen art |

**Consequence for the plan:** the "realistic materials + emission + reflections" requirement is *already satisfied by the asset*; our job is correct assembling (hinge), a full-bleed replaceable screen, and cinematic lighting. A procedural laptop fallback is still built (spec §5, §20) and is a first-class code path, not a stub.

### 0.3 CV content (`SangamCV.pdf`) — extracted

| Field | Value |
|---|---|
| Name | **Sangam Sitapuri** |
| Email / phone | sitapurisangampac@gmail.com / +91 9120461358 |
| GitHub / LinkedIn | github.com/SangamSitapuri07 / linkedin.com/in/sangam-sitapuri |
| Education | B.Tech CSE, Lovely Professional University, Phagwara (2024–present), **CGPA 8.52**; Intermediate 76 % (Kunwar Public School, Jaunpur) |
| Languages | C++, C, Java, JavaScript, Python, SQL |
| Tools | ReactJS, NodeJS, MongoDB, Express.js, Mongoose, VS Code, GitHub, Flutter, Kotlin |

**Projects (4 in CV, spec asks 3–5 → ship 4, all real):**

1. **Nuno — Real-Time Multiplayer Card Game** (Aug 2026) · Node.js, TypeScript, Express, PostgreSQL, Flutter, Render · rooms/matchmaking for 8 players, server-authoritative rules engine (turn order, card legality, 108-card deck integrity), 6 house-rule variants, ELO-style ranking.
2. **AI Debate Coach** (2026) · React, Three.js, R3F, Node.js, Express, Gemini + Groq · live 3D debate arena, argument/counter-argument generation, scorecard (clarity, logic, evidence, impact).
3. **News Pinch** (Mar 2026) · Kotlin, Android · article/poll/video content model, user + admin publishing, YouTube-linked video without a third-party news API.
4. **Portfolio** (this site) — used as the "live" 4th entry with honest framing ("this page": React, R3F, GSAP, Lenis, WebGL).

**Timeline:** Oracle Cloud Infrastructure AI Foundations Associate (2026), Programming in Java — IamNeo (2026), Programming Using C++ — Infosys (2025), Fundamentals of Software Testing + Effective Communication — SkillEra, Data Structures Fundamentals training — LPU (2026), 200+ LeetCode/GFG problems, 4★ Python badge on HackerRank.

> The old `src/data/*.js` in the Next app (News Pinch / Dot Connect / Café Billing / Polity Notes) is **not** the CV content and would be fabrication — it is discarded in favour of the verified CV data above.

### 0.4 Environment

Node 22.22.3, npm 10.9.8, npm registry reachable, 20 GB free disk, 3.9 GB RAM (measured — relevant to build strategy), no `public/`-shipping surprises.

---

## 1. Architecture

**One experience, three layers, one source of truth.**

```
        ┌──────────────────────────────────────────────────────────────┐
        │  lib/scrollEngine.js   (Lenis + GSAP ScrollTrigger)          │
        │  single normalized progress  p ∈ [0,1]  + pointer {x,y}      │
        │  mutable singleton — NEVER React state, updated in rAF       │
        └───────────────────────────────┬──────────────────────────────┘
                                        │ read, never write
        ┌───────────────────────────────▼──────────────────────────────┐
        │  config/scenes.js  — 7 scenes × { range, camera, laptop,     │
        │  lid, screen, overlay, nav }  +  buildMasterTimeline()       │
        └───────┬───────────────────────┬──────────────────────┬───────┘
                │                       │                      │
    ┌───────────▼─────────┐  ┌──────────▼──────────┐  ┌────────▼────────┐
    │ THREE LAYER         │  │ DOM OVERLAY LAYER   │  │ UI CHROME LAYER │
    │ <Canvas> pinned     │  │ semantic <section>s │  │ Navbar,         │
    │ CameraRig, Laptop,  │  │ one per scene,      │  │ ProgressBar,    │
    │ screen CanvasTexture│  │ opacity/transform   │  │ ScrollHint,     │
    │ Effects (tiered)    │  │ from the same tl    │  │ Loader          │
    └─────────────────────┘  └─────────────────────┘  └─────────────────┘
```

Rules that keep it coherent:

1. **The scroll timeline is the only writer** of camera/laptop/lid/overlay values. Mouse parallax is a *separate additive offset* with a much smaller weight — it can never fight scroll, because it is added after the scroll value is resolved (spec §12).
2. **No React re-render per frame.** `useFrame` reads/writes refs and the global `sceneState` object. React state changes only on *discrete* events: active section index (≤7 per full page scroll), loading %, quality tier, reduced-motion flag.
3. **Damping happens once**, in the rig, via `THREE.MathUtils.damp`/exponential smoothing on the resolved value — so scroll-scrub jitter, mouse, and reduced-motion all pass through the same smoothing.

## 2. Component hierarchy

```
App
├── Loader                      (preload gate + % + initials; waits for model + fonts)
├── <div class="reduced-motion-fallback">   (only if prefers-reduced-motion or no WebGL)
├── <Canvas>                    (fixed, aria-hidden, pointer-events-none)
│   └── Experience
│       ├── Environment         (ambient + 2 rim lights + env map + contact shadow plane)
│       ├── Laptop
│       │   ├── LaptopModel     (glTF, mesh-partitioned into base/lid groups)
│       │   └── ProceduralLaptop (fallback, same interface)
│       │       └── LaptopScreen → CanvasTexture(screen) + statusPanel
│       ├── CameraRig           (keyframe interpolation + damping + pointer parallax)
│       └── Effects             (Bloom + Vignette + Noise, tier-gated)
├── Navbar                      (initials · 6 links · active state · Resume)
├── ProgressBar                 (2px, top, accent, transform only)
├── ScrollHint                  ("Scroll to explore", fades at scene 2)
└── Overlay
    └── SectionOverlay          (scroll-length spacer; 7 sections)
        ├── Hero · About · Skills · Projects · Experience · Contact  (sections/)
        └── section primitives: SectionHeader, SkillCard, ProjectCard,
            TimelineItem, CTAButton, GlassCard
```

## 3. Folder structure (final)

```
src/
├── main.jsx                    App.jsx
├── index.css                   Tailwind entry + design tokens + focus/reduced-motion CSS
├── config/
│   ├── theme.js                colors, type scale, breakpoints
│   ├── scenes.js               7 scene definitions (ranges, camera, laptop, lid, screen IDs)
│   ├── animation.js            durations, easings, damping lambdas, reduced-motion variants
│   ├── laptop.js               ⚠ hinge axis/pivot, lid sign, scale, mesh part map, model paths
│   └── quality.js              quality tiers (high/medium/low) — dpr, shadows, postprocessing
├── data/
│   ├── profile.js              name, role, tagline, contacts, resume, SEO
│   ├── projects.js             4 CV projects: copy, tech, links, cover, screen spec
│   ├── skills.js               4 categories (Frontend / Backend / Programming / Development)
│   └── timeline.js             certifications, training, achievements, education
├── lib/
│   ├── scrollEngine.js         Lenis ⇄ ScrollTrigger, progress + pointer singleton, master tl
│   ├── screenTextures.js       offscreen-canvas UI renderer → THREE.CanvasTexture per section
│   ├── modelParts.js           glTF mesh partitioning + UV normalisation for screen panels
│   ├── webgl.js                WebGL capability probe
│   ├── motion.js               prefers-reduced-motion, device tier detection
│   └── store.js                tiny subscribe/emit store (no zustand needed — 0 deps)
├── components/
│   ├── Experience.jsx          scene root inside <Canvas>
│   ├── Laptop.jsx              model/procedural switch + hinge rig + mouse response mount
│   ├── CameraRig.jsx           keyframe interpolation + damping
│   ├── Effects.jsx             postprocessing (tiered)
│   ├── Environment.jsx         lights, env map, contact shadow
│   ├── Loader.jsx  Navbar.jsx  ProgressBar.jsx  ScrollHint.jsx  SectionOverlay.jsx
│   └── ui/                     CTAButton, GlassCard, SectionHeader, TagChip, IconLink
├── sections/
│   ├── Hero.jsx  About.jsx  Skills.jsx  Projects.jsx  Experience.jsx  Contact.jsx
│   └── FallbackPortfolio.jsx   full static HTML portfolio (no-WebGL / reduced-motion path)
└── hooks/
    ├── useScrollStore.js  useMediaQuery.js  useQuality.js  useReducedMotion.js  useKeyNav.js
public/
├── models/cyberpunk_laptop.glb  (optimised derivative — the deployed model)
├── images/  (og-image.jpg, favicon, project covers)
└── SangamCV.pdf
docs/PLAN.md  docs/DESIGN.md
tools/optimize-model.mjs         gltf-transform + sharp pipeline (documented, re-runnable)
cyberpunk_laptop.glb             (root) untouched design-source master, not shipped by Vite
vercel.json  netlify.toml  public/_headers
```

## 4. Animation & state strategy

**Master timeline.** One GSAP timeline built from `config/scenes.js`, driven by `ScrollTrigger({ scrub: 0.6..1, pin: false })` over a full-length spacer. The timeline animates one plain object:

```js
sceneState = { camX, camY, camZ, tgtX, tgtY, tgtZ,
               lapYaw, lapPitch, lapRoll, lidAngle, glow, focus }
```

**Scene = keyframe interpolation, not tween soup.** Each scene contributes entry/exit keyframes; a `interpolateScene(p)` step function resolves any `p` → target values, so:

* scrolling up reverses *exactly* (same function, no state),
* `ScrollTrigger.refresh()` on resize/layout change is enough,
* the values are inspectable/overridable from a dev panel.

**Scene table (all seven, per spec §7–10):**

| # | Scene | p range | Camera (pos → target) | Laptop | Lid | Screen shows | Overlay |
|---|---|---|---|---|---|---|---|
| 01 | Intro | 0 – .10 | far, low (0, 0.55, 3.4) → deck | closed, centred | 6° | standby glyph | name + "Scroll to explore" |
| 02 | Hero | .10 – .25 | side, (2.1, 1.15, 2.6) → deck | right of frame, yaw −24° | 6° → 104° | booting → hero UI | Who I am + what I build, View Projects, Download Resume |
| 03 | About | .25 – .40 | push-in to screen, (0.35, 1.35, 1.55) | small yaw −8° | 106° | "about" console | 3 short facts + interests |
| 04 | Skills | .40 – .55 | pull back + angle (2.6, 2.0, 2.3) | yaw −40° | 100° | skills matrix | 4 categories, minimal cards |
| 05 | Projects | .55 – .80 | 4–5 sub-beats, push to screen per project | yaw −30°±6° | 100° | project build/UI per beat | one project card at a time, cross-fading |
| 06 | Experience | .80 – .90 | elevated (0.9, 2.2, 2.4) | yaw −52° | 96° | résumé/CV view | vertical timeline, glass cards |
| 07 | Contact | .90 – 1.0 | slow pull back (0, 1.7, 4.6) | centred, level | 104° → 48° | "let's build" + contact | email/GitHub/LinkedIn/resume, footer |

**Screen content system.** `lib/screenTextures.js` draws each section's UI into an offscreen 2D canvas (1280×800, DPR-aware) → `THREE.CanvasTexture`, mapped full-bleed on the main panel; a second 512×512 canvas drives the secondary status panel. Textures are created **once** and swapped by `material.map = tex[i]` — no per-frame canvas work except a deliberately cheap animated detail (caret blink / live clock) at ~8 fps while the screen is visible. This gives per-section screen content, project screens, and graceful "static image" fallback (the same canvas is rasterised to a PNG at build time for the no-WebGL path — actually it is *re-rendered as DOM*, see §13 fallback).

**Projects beats.** Project index = `floor(map(p, .55, .80, 0, N))` clamped — index transitions are the only React state change; opacity/transform of each project card is driven by the timeline, so scrolling back re-enters the previous card correctly.

## 5. Data structures

Content lives in `src/data/*.js` as plain, typed-by-convention objects; **zero** rendering/animation knowledge — only *optional hints* (e.g. `screen.accent`, `cover.gradient`) that the renderer may consume.

```js
// data/projects.js
export const projects = [{
  id: 'nuno',
  name: 'Nuno — Real-Time Multiplayer Card Game',
  tagline: 'Server-authoritative card battles for up to 8 players.',
  summary: 'Rooms, rating-based matchmaking and a rules engine that refuses forged moves.',
  year: '2026',
  tech: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Flutter', 'Render'],
  highlights: ['8-player rooms + private invites', '108-card deck integrity checks',
               '6 house-rule variants', 'Level progression & ranking'],
  links: { github: '…', live: '…' },
  screen: { accent: '#4B8CFF', mode: 'terminal' },   // hint only
  cover: { from: '#0B1524', to: '#05060A' },          // fallback cover
}]
```

Same shape philosophy for `skills.js` (4 categories × items), `timeline.js` (kind: `certification | training | achievement | education`), `profile.js` (single source for name/role/links/SEO/resume path). Editing content never touches a component.

## 6. 3D laptop system

* **Assembly:** clone the glTF scene; split meshes into `base` and `lid` groups using `config/laptop.js` `partMap` (explicit node-name lists verified in §0.2, with a *heuristic fallback*: any mesh whose bbox centre is inside the lid volume goes to the lid).
* **Hinge:** `lidGroup` is re-parented to a `THREE.Group` placed at `(0, 0.05, 0.74)`; rotating that group about **X** performs the open/close. The whole laptop never rotates to fake it (spec §5).
* **Screen:** panels detected by emissive material → UVs normalised → our CanvasTexture assigned; the model's emissive map is retained as *standby wallpaper* and cross-faded with ours for a "boot" moment.
* **Materials:** keep the author's PBR set; bump `envMapIntensity`, dial `Material.019`'s `emissiveStrength: 10` down to ~1.6 (it is a strong bloom seed) and re-add bloom deliberately in post.
* **Procedural fallback (`ProceduralLaptop.jsx`):** rounded-box base, hinge barrel, lid with screen bezel, backlit key rows, trackpad — same exported interface (`lidAngle`, `screenTexture`), automatically used if the GLB fails to load, plus a runtime console-free warning in dev.
* **Dev tuning:** `?debug=1` shows a sliders panel (hinge Z, lid sign, yaw, scale, time-of-open) writing into `config/laptop.js` defaults, so assembling/tuning is empirical and fast.

## 7. Performance strategy

| Concern | Measure |
|---|---|
| Scroll & pointer | Lenis + ScrollTrigger, no React state; single rAF loop |
| Frame loop | one `useFrame` in `CameraRig`, one in `Laptop` — no prop-drilling of animated values |
| React renders | only on: load %, active section (≤7), quality tier, resize (debounced) |
| DPR | desktop `min(dpr, 2)`, mobile `min(dpr, 1.5)` (spec §15) |
| Shadows | one contact shadow (soft shadow plane / low-res shadow map), disabled on `low` |
| Post-processing | `high`: Bloom + Vignette + Noise; `medium`: Bloom + Vignette; `low`/mobile: **none** |
| Model | loaded **once** (module-level cache + Suspense), Draco/Meshopt-decoded, textures pruned, `tools/optimize-model.mjs` target ≤ 3.5 MB |
| Textures | geometry UV normalisation lets the screen use one 1024×640 canvas → tiny VRAM |
| Budget | **≤ 10 MB total**: model ≤ 3.5 MB + JS ≤ 700 KB (gzip ~200 KB) + fonts ~120 KB (Inter subset, self-hosted woff2) + covers ~300 KB + CV PDF 128 KB |
| Pause when hidden | `document.visibilityState` → stop rAF work; `Canvas` `frameloop="demand"` is *not* used (continuous cinematic motion is wanted) but idle scenes drop to `frameloop="never"`? → kept as a measured optimisation in phase 17 |

## 8. Responsive strategy

| Breakpoint | Behaviour |
|---|---|
| ≥ 1280 px | full experience, camera framing composed for 16:9, overlays split left/right |
| 768–1279 px | shorter camera distances, hero text centred, nav condensed |
| < 768 px (mobile) | camera FOV +24 %, distances ×0.8, laptop offset to lower third, **overlays below the laptop**, DPR ≤1.5, no post-processing, mobile model path (see §11), the secondary status panel hidden |
| Very small / landscape phone | overlay-only stacking, laptop scaled 0.85 |
| Any | page scroll height reduces from ~1000 vh (desktop) to ~700 vh (mobile) so pacing stays brisk |

Text is never placed over the laptop: overlay regions are computed per breakpoint from the same scene table (`overlay.anchor`: `left | right | bottom | center`) — one config, two layouts.

## 9. Accessibility (spec §16)

Semantic `<header>/<main>/<section aria-labelledby>/<footer>`; one `<h1>` (name) + `<h2>` per scene; all 3D content `aria-hidden` and duplicated as real text; every action a real `<button>`/`<a>` with visible `:focus-visible` ring; keyboard-navigable nav with skip link; `prefers-reduced-motion: reduce` → camera becomes **near-static**, lid opens once, no parallax/postprocessing underlay, overlays become normal static sections (`FallbackPortfolio` styling) — complete content, minimal motion.

## 10. SEO (spec §17)

`index.html` with title/description/canonical, Open Graph + Twitter cards, generated `og-image.jpg`, `manifest`, JSON-LD `Person` + `WebSite`, `robots.txt`, `sitemap.xml`; every portfolio fact exists as HTML text (crawlable), not only in WebGL.

## 11. Fallback matrix (spec §20)

| Failure | Behaviour |
|---|---|
| GLB missing / fails | `ProceduralLaptop` (same interface) — no blank screen |
| Project cover missing | generated gradient + monogram cover (CSS), never a broken img |
| WebGL unavailable | `FallbackPortfolio` — complete static page, same content, no canvas |
| Weak device | auto quality tier `low` (no post, lower dpr, simplified lights) |
| Reduced motion | static-ish camera, content-first layout |
| JS error in a section | React error boundary per section → renders static text |

## 12. Dependency manifest (pinned, fresh)

`react` 19 · `react-dom` 19 · `three` 0.186 · `@react-three/fiber` 9.8 · `@react-three/drei` 10.7 · `@react-three/postprocessing` 3.1 (+ `postprocessing` 6.39) · `gsap` 3.15 (+ `@gsap/react`) · `lenis` 1.3 · `vite` 8 + `@vitejs/plugin-react` 6 · `tailwindcss` 4 + `@tailwindcss/vite` · `@gltf-transform/*` + `sharp` (devDeps, model pipeline only). **No** framer-motion, howler, leva, zustand, rapier, next — the spec's "no unnecessary dependencies" rule.

## 13. Implementation roadmap (each phase ends runnable + verified)

| # | Phase | Gate |
|---|---|---|
| 1 | Repo reset: remove Next app & dead assets, Vite scaffold, Tailwind 4 tokens, alias, ESLint/Prettier | `npm run dev` shows a styled shell |
| 2 | Data & config layer (profile/projects/skills/timeline/scenes/animation/quality) | content renders as plain HTML |
| 3 | Canvas + Environment + procedural laptop + hinge rig | laptop opens via a debug slider |
| 4 | CameraRig + keyframe interpolation + damping | camera flies the 7 scenes from a `p` slider |
| 5 | Lenis + ScrollTrigger + master timeline + overlay sections | scrolling drives camera/lid/overlays; scrolling back reverses |
| 6 | Screen CanvasTexture system + per-section screen content | screen changes per section, project beats work |
| 7 | Navbar / ProgressBar / ScrollHint / active state / smooth anchor scroll | clicking nav lands on the right scene |
| 8 | Loader + asset gate + smooth hand-off | no jump, %, initials, reduced-motion aware |
| 9 | Effects (Bloom/Vignette/Noise) with quality tiers | 60 fps desktop, effects off on mobile |
| 10 | GLB integration: partition, hinge, UV normalisation + model optimisation pipeline | real model opens correctly, ≤3.5 MB |
| 11 | Responsive + mobile model path + positioning rules | tested 360/768/1280/1920 |
| 12 | Accessibility + reduced motion + fallbacks + error boundaries | keyboard & screen-reader pass |
| 13 | SEO, og-image, favicon, robots, sitemap, JSON-LD | Lighthouse SEO 100 |
| 14 | Performance pass (profiler, budgets, memoisation, leak check) | no GC spikes, no leaks on scroll spam |
| 15 | Production build + preview + deploy config (Vercel/Netlify) | `npm run build` clean, `dist` ≤10 MB, no console errors |
| 16 | Content polish + copy review + final QA on 4 devices | ship |

**Open items I'll confirm as I go:** the exact lid rotation *sign* (mirror of −105°) and the model's natural yaw are the two values I could not resolve from static analysis alone (a rasteriser cannot show which face carries the display); both live in `config/laptop.js` and take minutes to verify in the browser in phase 10. Nothing else about the assembly is uncertain.

## 14. What gets deleted (please confirm in your reply)

`next.config.js`, `jsconfig.json`, all of `src/app`, all 88 zero-byte stubs, `src/store`, `src/shaders`, `src/utils`, old `src/components/**` **except** the concepts I keep (none are reusable verbatim), `public/models/face.glb` (39.3 MB, unused), `public/models/objects/*` (0 B), `public/textures/*` (0 B), `public/audio/**` (0 B, and audio is not in the spec), empty `og-image.jpg`/`favicon.ico` (regenerated). Everything remains in git history at `5b0d1a9` — recoverable at any time.
