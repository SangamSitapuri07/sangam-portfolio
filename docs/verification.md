# Release verification — 1.0.0

Verified against the production build on 19 October 2026.

## Results

- `npm run release:check`: **passed**.
- ESLint: **passed**, no errors or warnings.
- Unit tests: **36 passed**.
- Production browser/accessibility tests: **62 passed**, desktop and mobile.
- Build: all ten chapters prerendered, metadata and referenced assets verified.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities**.
- `git diff --check`: **passed**.

The sandbox used Chromium 153 with software WebGL. The browser executable and
support libraries are ignored local tooling, not portfolio dependencies.
Standard environments can use `npx playwright install chromium`.

## Narrative and interaction coverage

- All ten ordered chapters and a continuous normalized 0–1 storyboard.
- One persistent canvas and one runtime-model GET across scene changes.
- Original lid hinge, source keycaps/deck/chassis disassembly, shared reassembly.
- Forward/backward sampling, camera continuity, exact return to source transforms.
- Responsive framing and DPR caps; canvas persists across resize.
- Selectable AI Debate Coach, Nuno, and News Pinch case studies, architecture,
  repository/demo actions, shareable URLs, and project dossiers.
- Actual laptop LCD previews switch with the selected project.
- Real CV download bytes and filename, email/GitHub/LinkedIn actions.
- Keyboard navigation, native dialog/Escape/focus restoration, case-study tabs,
  mobile menu, skip link, back-to-top, and direct hash/query refresh.
- Mid-chapter reload, Back/Forward, responsive reflow and reading/3D switches
  preserve normalized position instead of resetting to a chapter boundary.
- Automated WCAG A/AA reading-layout checks on desktop and mobile.
- Full prerendered portfolio remains readable with JavaScript disabled.

## Asset optimization and failure coverage

The original GLB is unchanged: **8,326,028 bytes**. Runtime Meshopt derivative:
**5,295,184 bytes**, a **36.4% reduction**. Tests compare every named node,
hierarchy, transform, mesh binding, attribute, oriented triangle, texture byte,
and material appearance after decoding. No simplification or quantization is
applied. The same artist model remains the visual centerpiece.

Tests exercise failed project media, a missing poster, stalled model preflight,
unsupported WebGL, missing/HTML model responses, actual context loss, image-view
persistence, and reduced motion without a model download. Failed prerendered
images are detected even if failure occurred before hydration.

Production code has an eight-second HEAD deadline and a 45-second scene-readiness
watchdog. These select the complete reading layout, never fabricated progress.
The performance monitor lowers DPR/removes particles before reading fallback.

## Deployment and factual limits

The site is complete in the repository and live preview. No public Vercel or
Netlify deployment was performed. Both static deployment configurations are
included; the actual origin enables canonical/social URLs and a sitemap.
GitHub Actions runs the release command when the branch is pushed.

Physical-device GPU profiling and human assistive-technology testing remain
recommended. 60 FPS is a hardware-dependent target, not a universal guarantee.

The added PCB and non-AI project visuals remain explicitly labelled illustrative
or system sketches. Production Planner has no confirmed source and is not
fabricated; the real CV project Nuno is used. Unprovided personal challenge
anecdotes are not invented: source-backed engineering decisions are presented.
