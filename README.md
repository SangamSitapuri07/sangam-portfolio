# Sangam Sitapuri — The Breakdown Protocol

Release **1.0.0** — the complete ten-chapter implementation.

A scroll-controlled, ten-scene developer portfolio built around the supplied
cyberpunk laptop. **Reveal → Deconstruct → Explore → Rebuild → Connect.**

React + Vite, React Three Fiber/Drei/Three.js, GSAP ScrollTrigger, Lenis,
Tailwind, self-hosted Inter and Space Grotesk. The existing working React/JS
framework is retained rather than imposing an unrelated framework migration.

## Run

Node `^20.19.0 || >=22.12.0`.

```sh
npm install
npm run dev
```

Dev: `0.0.0.0:5173`; `.e2b.app` live-preview hosts are accepted. Browser assets
and the resume use relative URLs, not sandbox localhost URLs.

```sh
npm run check       # ESLint, deterministic/model/content tests, production build
npm run preview     # production preview on 0.0.0.0:4173
npx playwright install chromium
npm run test:e2e    # desktop + mobile behavior, reverse scroll, accessibility
npm run release:check # build verification + the managed production browser suite
```

The build prerenders every chapter into `dist/index.html`, then progressively
enhances it with the persistent cinematic canvas. Vercel/Netlify build with
`npm run build` and publish `dist/`; configuration is included.

In constrained CI, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an installed
browser. `PLAYWRIGHT_BASE_URL` can target the production preview.

## Editable content and architecture

- `src/data/personal.js`: identity, biography, education, email/socials, resume.
- `src/data/projects.js`: project summaries, tech, media, repository/demo URLs.
- `src/data/timeline.js`: CV-backed training, credentials, achievements.
- `src/data/story.js`: ten chapter ranges and narrative.
- `src/data/caseStudies.js`: selectable, CV-backed project case studies and architecture.
- `src/config/assets.js`: runtime/source models, source names, hinge, resume provenance.
- `src/config/model.generated.js`: reproducible optimization output metadata.
- `src/config/theme.js`: theme tokens.
- `src/animation/storyboard.js`: one deterministic camera/assembly sampler.
- `src/animation/modelRig.js`: source rest transforms and shared explosion paths.
- `src/animation/runtime.js`: cached frame samples and discrete scene/project changes.
- `src/animation/storyLayout.js`: bidirectional pixel/progress mapping and history bookmarks.
- `src/components/story/ScrollController.jsx`: the **single** GSAP/ScrollTrigger
  authority and GSAP-ticker-driven Lenis integration.
- `src/components/scene/PortfolioCanvas.jsx`: one lazy, persistent R3F canvas.
- `src/sections/StorySections.jsx`: all ten semantic HTML chapters.

See [`docs/the-breakdown-protocol.md`](docs/the-breakdown-protocol.md) for the
story, asset truth, controls, performance strategy, and known content limits.

## Asset and content integrity

The original 8.33 MB `public/models/cyberpunk_laptop.glb` remains byte-for-byte
unchanged. Actual exterior meshes animate; the added engineering PCB is clearly
labelled **illustrative**, never claimed to be an internal source mesh.
Visible artist attribution is required: **Vivien Deroche, CC BY 4.0**. See
[`public/models/LICENSE.md`](public/models/LICENSE.md) and
[`docs/laptop-model.md`](docs/laptop-model.md).

The exact supplied CV (`SangamCV.pdf` on GitHub) is served as
`public/assets/sangamcv.pdf`. See [`docs/cv-source.md`](docs/cv-source.md).
The UI uses verified CV/repository information, not sample emails or made-up
jobs/awards. Production Planner is omitted because no confirmed source exists.

AI Debate Coach uses an actual source-captured interface preview. Other project
previews are explicitly labelled system sketches until authentic screenshots
are supplied. The case study's engineering analysis is source-backed; a personal
account of the hardest technical challenge can be added when supplied.

The browser loads a **5.30 MB Meshopt derivative**, 36.4% smaller than the
8.33 MB original. Source node names, hierarchy, transforms, geometry precision,
oriented triangles, textures, and material appearance are verified unchanged.
The original remains preserved, and no external decoder service is needed.
Real-device GPU profiling is still recommended; 60 FPS is a hardware-dependent
target, not a guarantee from software-rendered browser tests.

Three.js is pinned to r182 because the selected R3F release still uses `Clock`,
which is deprecated in r183. Warnings are not suppressed. Three core/WebGL are
split, while R3F's interdependent helpers stay in one automatic lazy chunk to
avoid production-only circular initialization errors.

## Generated assets

`npm run assets:render -- --social-only` updates the 1200 × 630 social card using
the existing actual-model poster. Model/preview capture workspaces, browser
binaries, raw extraction notes, screenshots, and test artifacts are ignored.
Only the small final assets are included with the source.

## Project exploration and position preservation

Scene 06 can examine AI Debate Coach, Nuno, or News Pinch. The selector updates
the case study, architecture, source/demo actions, and the original laptop LCD.
`?feature=nuno#deep-dive` links directly to a selected study; `?project=nuno`
opens its dossier. Personal challenge anecdotes remain unset unless supplied.

The screen lazily loads the existing local preview only when its project beat
is reached. It labels system sketches, reuses loaded images, and falls back to
CV-backed summary text if a preview fails. It never requests APK demo content.

History entries store normalized story progress rather than a viewport-specific
pixel offset. Reload, browser Back/Forward, resize, and reading/3D mode changes
preserve the point within the chapter. Modal dialogs pause the Lenis engine.
The camera, laptop, and core reuse the same sampled frame until an input changes.

## Release and deployment

- `npm run release:check` builds and verifies all ten prerendered chapters,
  required files, the model budget, and the complete production browser suite.
- `.github/workflows/quality.yml` runs the same release check for pushes/PRs.
- `npm run assets:optimize` regenerates the losslessly compressed runtime model
  from the preserved original, never from an already compressed derivative.
- `PUBLIC_SITE_URL` may be set to the actual site origin for canonical URLs,
  absolute social images, and sitemap generation. Vercel/Netlify deployment
  origins are detected automatically. No production domain is fabricated.
- Vercel/Netlify build with `npm run build` and publish `dist/`. No backend or
  private API key is required by this portfolio.

Images that fail, including errors before hydration, fall back to labelled local
project overviews or a simplified laptop illustration. Stalled model preflight
and scene readiness have bounded timeouts and retain the full reading layout.
Demo APKs are only external links, never prefetched or executed by the site.

No personal challenge anecdote, unsupported project, or simulated internal
component is presented as a verified fact. Every supplied action is functional;
release verification does not imply that a public deployment has been created.
