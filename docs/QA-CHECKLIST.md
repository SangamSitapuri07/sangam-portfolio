# QA checklist — the pass that needs a real browser

Everything in this repository is machine-checked by `npm run verify` (427 content
assertions, the rig, the painter, the film, contrast). This document is the other
half: the things a headless sandbox cannot judge, in priority order. Budget
**20 minutes** for the required sections, an hour for all of it.

The five sections marked **[REQUIRED]** cover the acceptance criteria that are
currently unverified — nobody has watched this animate yet. Sections 6 onwards are
regression checks for bugs that were already found and fixed once, so they are the
ones most likely to come back.

---

## 0 · Setup

```bash
npm install
npm run dev            # http://localhost:5173

# and, in a second terminal, the production build:
npm run build
npm run preview        # http://localhost:4173
```

Keep the devtools console open the whole time (F12 → Console). Section 12 fails
the pass if anything appears there.

Regenerate the known-good screen renders at any point:

```bash
node tools/verify-screens.mjs    # writes .qa/screens/*.png
```

Those PNGs are what the displays are *supposed* to look like. Compare by eye if
something on screen looks off.

---

## 1 · The film plays at all **[REQUIRED]**

This has never been seen running. It is the single biggest unknown.

Scroll from top to bottom, slowly, then back up.

**Correct:** one continuous camera move through seven chapters — intro, hero,
about, skills, five project beats, experience, contact. The copy blocks fade in
and out. The scroll feels smoothed, not stepped.

**Wrong:** a blank or black canvas; a frozen image; the camera jumping between
two positions; the copy stacked on top of itself; nothing responding to scroll.

If the canvas is empty, check the console for a WebGL error — the app is supposed
to fall back to the plain page by itself, but confirm Section 7 works too.

## 2 · Exact reversal **[REQUIRED]**

The headline promise. Scroll to the very bottom, then back to the very top, at a
consistent speed.

**Correct:** the machine retraces its own path. At the top the lid is **fully
shut and lying flat on the deck**. The screen content retraces in reverse order.

**Wrong:** the lid ends up part-open at the top; a screen panel is left showing
from a section you have scrolled past; the camera settles somewhere it did not
pass through on the way down.

Machine-checked: the director converges to the same pose from either direction to
within 8×10⁻¹², and the panel changes only at its storyboard boundary. So a
failure here means something *outside* the director — most likely a CSS transform
or the overlay, not the film.

## 3 · The hinge **[REQUIRED]**

Watch the laptop closely as you scroll through the first two scenes, then look
again from a low camera angle.

**Correct:** the lid pivots on its own axis and sits **on** the deck when shut —
no gap, no overlap. When open, the display faces you.

**Wrong:**
- a visible gap between the shut lid and the deck → the "floating lid" regression
- the lid sinking into / clipping through the keyboard
- the lid rotating about the middle of the machine instead of the hinge
- the whole laptop rotating instead of just the lid

Machine-checked: shut lid gap is 0.00 mm at model scale; open display normal is
(0, 0.26, 0.97) — facing the viewer and tilting up. This is verified, so a failure
here is a rendering-order or material issue, not geometry.

## 4 · Frame rate **[REQUIRED]**

DevTools → Performance → record ~10 seconds while scrolling steadily.

**Correct:** most frames under 16.7 ms. The director's own CPU cost is 0.015 ms
(p95), so any slowness is the GPU: the model, bloom, or film grain.

**Wrong:** sustained frames over 26 ms. After 90 frames the app is supposed to drop
one quality tier automatically (`autoTune`, `sampleFrames: 90`, `slowFrameMs: 26`).
If it is still slow after that, the tier drop is not working.

Also open React DevTools → Profiler → "Highlight updates while profiling". **No
component should re-render while you scroll.** If they light up, the "no per-frame
React state" rule has been broken somewhere.

## 5 · Real mobile **[REQUIRED]**

Open http://localhost:5173 on an actual phone on the same network (the dev server
binds `0.0.0.0`).

**Correct:** it loads, it is smooth, and the page does not scroll sideways.

**Wrong:** a horizontal scrollbar (a real failure mode — check by dragging left);
text clipped at the edges; the display panels unreadable at that size; the status
panel visible despite `dprCeiling.mobile = 1.5` and low-tier rules.

---

## 6 · The loader

Reload with the network throttled to Slow 3G (DevTools → Network).

**Correct:** the percentage climbs and **stops at 92 %** while the 3.07 MB model
still streams. It never claims 100 % before it is done. It stays for at least
900 ms so the finish reads as deliberate, then hands off with no jump.
A 14-second watchdog forces completion if a request hangs.

**Wrong:** the number sitting at 100 % while the canvas is empty; a flash of the
page behind the loader; the loader vanishing before the model appears.

## 7 · The plain page (no-WebGL fallback)

Click **Lite** in the navbar (it only appears when WebGL works). Toggle back with
**3D**.

**Correct:** every section renders as an ordinary document — one `<h1>`, no
canvas, and all nav links scroll normally. Switching lands you on the section you
were reading, not at the top.

**Wrong:** **two** `<h1>`s (the film and the fallback both rendering — this was a
real bug); nav links doing nothing (they used to `preventDefault` with no engine
behind them); the navbar invisible until the loader finishes.

To test the genuinely-WebGL-less path, disable WebGL in `chrome://flags` or open
the page in a browser with it turned off. The Lite/3D button should be **hidden**
with nothing to toggle.

## 8 · Keyboard and screen reader

Tab from the address bar.

**Correct:** a "Skip to content" link appears first and jumps past the nav. Focus
is always visible. On a narrow window the nav collapses to a sheet: **Escape**
closes it, focus returns to the trigger, and Tab stays inside while it is open.

**Wrong:** focus lost to the page body after closing the sheet; the skip link
landing nowhere; no visible focus ring anywhere.

Contrast was just changed — the dimmest grey was brightened from `#667082` to
`#858d9b` to clear WCAG AA (it measured 3.62:1, now 5.41:1 at worst). **Eyeball
it:** it should still read as clearly dimmer than body copy. If the hierarchy now
looks flat, that is a taste call worth making.

## 9 · Reduced motion

Set the OS to reduce motion (macOS: System Settings → Accessibility → Display;
Windows: Settings → Accessibility → Visual effects) and reload.

**Correct:** the camera still moves between chapters but only ~18 % of the
distance; parallax is off; postprocessing is off; the page is about half as long
to scroll. Nothing animates on its own.

**Wrong:** the pointer still moving the machine; bloom still on; the same scroll
length as before.

## 10 · Navigation landings

Click each nav item: Home, About, Skills, Projects, Experience, Contact.

**Correct:** each lands **inside** the section it names, and that item becomes
active. Machine-checked via `arrivalProgress`, so the only thing to judge here is
whether it *feels* right — not stopping awkwardly early or overshooting.

## 11 · Resize and rotate

Drag the window from full width down to phone width, mid-scene.

**Correct:** the layout reflows, text stays inside its column, nothing overlaps.
The film switches between its desktop and mobile camera paths.

**Wrong:** copy overlapping the machine; the display's text running into a pane
seam; a stage that stays desktop-sized on a narrow window.

## 12 · Console must be empty

At the end of all of the above, the console should hold **no errors and no
warnings** — including React warnings, three.js warnings, and 404s. This is an
acceptance criterion, and it is the one thing a headless run genuinely cannot
check for you (WebGL context messages only exist in a real browser).

## 13 · Link preview and deploy

Paste the live URL into a chat or a card validator.

**Correct:** the OG image (1200×630) renders with the right title and description,
and the canonical URL points at `https://sangam-portfolio-roan.vercel.app`.
Check `/robots.txt` and `/sitemap.xml` resolve.

---

## Recording what you find

For each problem, capture: **scene** (intro…contact), **what you did**, **what
happened**, **what you expected**, and whether it survives a hard reload. A
screenshot beats a sentence. Anything reproducible goes in a GitHub issue against
PR #1.

### Reference: the seven chapters and their displays

| Chapter | Nav label | Screen panel |
| --- | --- | --- |
| intro | — | boot |
| hero | Home | hero |
| about | About | about |
| skills | Skills | skills |
| projects (5 beats) | Projects | projects:0 … projects:4 |
| experience | Experience | experience |
| contact | Contact | contact |

### Reference: numbers the suites already guarantee

| Fact | Value |
| --- | --- |
| Content assertions | 427, plus copy hygiene over 363 strings |
| Screens checked | 13 canvases × 3 quality tiers |
| Director CPU cost | 0.015 ms p95 of a 16.7 ms frame |
| Reversal agreement | 8×10⁻¹² worst case over 6 checkpoints |
| Display aspect / resolution | 1.253 × 1.273, 1024 px long edge |
| Model on the wire | 3.07 MB (from 8.33 MB) |
| Production payload | 5.0 MB total, 0.43 MB gzipped JS/CSS/HTML |
| Contrast, worst text colour | 5.41:1 (AA needs 4.5:1) |
