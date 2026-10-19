# The Breakdown Protocol

## The continuous journey

1. **The Awakening:** the real laptop lifts into a dark, cyan-lit composition;
   its original lid rotates around the inspected hinge as the visitor scrolls.
2. **Into the Machine:** a closer keyboard/chassis view introduces real skills.
3. **The Breakdown Protocol:** the real display group, keycaps, deck, upper
   inserts, and chassis follow deterministic separation paths.
4. **The Engineering Core:** a labelled, illustrative PCB anchors the skills.
5. **Project Universe:** AI Debate Coach, Nuno, News Pinch, and Dot and Connect.
6. **The Deep Dive:** AI Debate Coach, with repository-backed case-study tabs.
7. **Reassembly Protocol:** the *same offsets* return to zero. No reverse
   positions are independently guessed.
8. **Beyond the Code:** LPU education, CV credentials, and supplied achievements.
9. **The Final Transmission:** real email/social links and the real CV download.
10. **The Afterglow:** calm final pose, chapter navigation, and back-to-top.

`src/data/story.js` defines scene ranges and editable narrative data.
`src/animation/storyboard.js` is a pure, deterministic sampler. It owns camera
poses, lid opening, source-part offsets, screen state, and project selection.
`src/animation/modelRig.js` captures source transforms and applies the shared
explosion amount. Tests verify exact return to source positions/quaternions.

## One animation authority

There is one GSAP timeline and one ScrollTrigger (`portfolio-master`). It derives
one monotonic progress value from the actual measured chapter heights. Lenis is
fed by the GSAP ticker; there is no second requestAnimationFrame animation loop.

The R3F canvas remains mounted. Its demand-rendered frames sample the shared
progress rather than creating component-specific camera/lid tweens. React gets
updates at scene boundaries, user actions, readiness, or quality changes—not
once per rendered frame. Pointer tilt is a small child transform, disabled on
mobile and during disassembly, subordinate to the scroll-controlled parent.

Direct hashes, resize refreshes, and modal query links are supported. Large
project and credential chapters retain normal document flow; lightweight
chapters hold their text while the camera traverses the scene. Native scrolling
is never disabled outside an open, dismissible project dialog.

## Asset truth

- Original GLB: 8,326,028 bytes, unchanged; CC BY 4.0 attribution remains visible.
- `Cube_0`: original base/chassis group.
- `Cube.001_3`: original display/lid group; real local-X hinge.
- `Object_5`: original keycaps; `Object_4`: original deck.
- No separately identified internal motherboard, battery, or fan exists in the
  supplied asset. The added PCB is explicitly labelled **illustrative**.
- `Object_24` is the original main LCD. Its display material receives an editable
  portfolio CanvasTexture; other source textures retain the device's identity.

## Real project content

AI Debate Coach's screenshot was captured from its public frontend source in
Learn mode. The optional animated background and unused Battle component were
disabled only in the ignored capture workspace. No AI answers or metrics were
fabricated. Source: `SangamSitapuri07/AI-Debate_Coach`, `client/src`.

The other three preview assets are original editorial **system sketches**, not
pretended screenshots. Each is labelled accordingly. Android links open their
original Drive pages; APKs are never shipped or prefetched.

Production Planner has no confirmed source in the supplied CV/repositories and
is not invented. Nuno is used instead. A first-person account of the owner's
hardest AI Debate Coach challenge has not been supplied; the case study presents
repository-backed **engineering decisions**, not an invented personal anecdote.

## Performance and accessible alternatives

- One model GET and one persistent canvas across all chapter changes.
- Model HEAD preflight rejects missing/empty/HTML responses before GPU boot.
- Desktop DPR ≤1.75; mobile DPR ≤1.5. Lower-tier rendering uses DPR 1.
- Single-frame procedural environment; no external HDR, heavy bloom, or DOF.
- Demand rendering sleeps at rest. Sparse points are removed when quality drops.
- A conservative sustained-moving-frame monitor can fall back to reading mode.
- Reduced-motion, user-selected reading mode, and WebGL failure retain all ten
  semantic chapters, project details, credentials, contact links, and downloads.
- Build-time prerender ships the full content as HTML before JavaScript runs.
- Keyboard-accessible navigation, native modal focus containment/Escape,
  arrow-key case-study tabs, visible focus, and automated contrast checks.

## Verification

Run `npm run check` and `npm run test:e2e`. Browser tests cover desktop/mobile
asset loading, a single persistent canvas/model request, forward/reverse
scrubbing, reassembly, all ten chapters, real PDF downloads, tabs, dialogs,
refresh restoration, mobile navigation, and missing-model/WebGL fallbacks.

60 FPS is a hardware-dependent target, not a measured guarantee from the
sandbox's software-rendered Chromium. The preserved source is 8.33 MB; the shipped Meshopt derivative is 5.30 MB,
with geometry precision and texture bytes unchanged.

## Continued implementation: navigation and project exploration

`storyLayout.js` now owns both directions of the pixel/story mapping. The
controller caches measured bounds and saves an entry-scoped history bookmark
at scroll settlement, page hide, and anchor navigation. It restores exact
mid-chapter progress, not just the beginning of a hash target. ResizeObserver,
viewport, and font reflows preserve progress. Browser anchoring is disabled
inside the managed root so it cannot fight restoration.

Scene 06 is selectable across the three current CV projects. Content and
architecture live in `data/caseStudies.js`, with no assumed AI-specific copy
for Android or multiplayer projects. Selected studies persist in `feature`
URL parameters; project dossiers preserve their scroll bookmarks.

The original LCD shows local project previews at the project/deep-dive beats.
The AI capture remains an actual frontend screenshot. Nuno/News Pinch sketches
remain labelled illustrations. Loading is lazy and cached; errors retain a
readable summary. Camera, model, and PCB share a cached storyboard sample.

## Final release safeguards

The source GLB is archived unchanged at its original path. The browser requests
only the 5.30 MB derived model. No mesh quantization or texture recompression is
performed, and decode tests preserve every actor used by the hinge/explosion rig.

Project card, case-study, dialog, and reading-poster media handle failures both
before and after hydration. Captions switch to truthful project-overview labels.
Model HEAD checks time out after eight seconds; unresolved scene enhancement
falls back after 45 seconds without stranding the semantic content in a loader.

The build verifies chapter markup, referenced assets, structured metadata, and
runtime model size. Canonical/sitemap URLs are emitted only for a real configured
or platform-provided origin. Production dependencies pass npm's audit.
