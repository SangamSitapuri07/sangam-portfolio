# The demo environment

Every project on the CV has a **Run demo** button. Click it — or click the laptop's
display in the 3D scene while a project is on screen — and the project opens in a
device frame.

The frame adapts to what the thing is: a browser for a web app, a phone for an
app you hold.

---

## What actually runs, and what does not

| Project | CV's Live Demo link | What the portfolio does |
| --- | --- | --- |
| AI Debate Coach | `debate-coach.netlify.app` | **Runs it.** A real deployed web app, embedded. |
| Nuno | a Drive video | Plays the recording — **and can run for real**, see below. |
| News Pinch | a Drive video | Plays the recording. Cannot run in a browser; see below. |

Two of the three are recordings because of what they are, not because of a
shortcut:

- **Nuno's** client is Flutter, and the graph is served by a Node backend. The
  CV's demo link is a video of it.
- **News Pinch** is a native **Android** application — Kotlin, compiled to an APK
  for the Android runtime.

## The Android answer, plainly

**A web page cannot run a native Android application.** Not this portfolio, not
any portfolio. An APK is a bundle of Dalvik bytecode for the ART runtime; a
browser has no way to execute it. Worth knowing, because you will see products
claiming otherwise, and they are always doing one of three things:

1. **Playing a video** and calling it a demo. (What the CV does, honestly labelled
   here as a recording.)
2. **Re-implementing** the app's screens in HTML so they *look* like the app. It
   is a mock-up: it does not run your code, and it will drift from the real thing
   the moment either changes.
3. **Streaming a remote emulator** — a real Android device or emulator in a data
   centre, sending pixels to the browser. This genuinely works, and it is what
   Appetize.io and Genymotion Cloud sell. It costs money per minute and needs
   infrastructure; it is not something a static Vite deploy can do.

So the environment does the honest thing: it plays the CV's demo, labels it a
**Recorded demo**, and states the limitation on screen instead of hiding it.

### Three ways to make it genuinely runnable

**1. Flutter web build (works today, for Nuno).** Flutter is Kotlin's opposite in
this respect: the same Dart code that builds an Android APK also compiles to
JavaScript. If Nuno's client is the Flutter app the CV's tech line names:

```bash
cd nuno            # the Flutter client repository
flutter build web --release
cp -r build/web/* ../sangam-portfolio/public/demos/nuno/
```

then register it:

```json
{ "demos": { "nuno": { "path": "/demos/nuno/index.html" } } }
```

The lab now runs the application itself — same Dart source as the Android build —
inside the phone frame, and the badge changes from *Recorded demo* to *Running
here*. Nothing else to change.

**2. APK download.** For the true Android build, the honest path is to hand the
visitor the APK. Add a link and they can install and run it on a real device. If
you want this, say so and I will add a "Get the APK" action to the News Pinch
demo; it needs a hosted APK and an `unknown sources` explanation for the reader.

**3. A hosted emulator.** If a native, clickable News Pinch is worth a monthly
bill, an Appetize/Genymotion embed drops into this same frame — it is a URL, and
the lab already takes one. Tell me and I will wire it as a third `kind`.

## How the pieces fit

```
src/config/demos.js        what each project's demo is (CV-sourced)
src/lib/demoManifest.js    reads public/demos/manifest.json once
src/components/DemoLab.jsx the overlay: device frames, loading, failure, focus
src/lib/interaction.js     drag / idle drift on the 3D machine
src/components/Interactions.jsx  raycast the display, click to open a demo
public/demos/              drop hosted web builds in here
```

### Why a manifest and not a file check

The lab could have probed for `/demos/<id>/index.html` directly. It does not,
because every dev server that serves a single-page fallback answers `200` for a
file that does not exist — the demo would appear to be found and then render the
portfolio inside its own frame. A manifest is explicit, and a wrong answer here is
worse than an extra file.

### When an embed refuses to load

External sites are allowed to forbid being framed, and some do. If a demo has not
loaded after eleven seconds, the frame stops pretending and offers a way out
("Open in a new tab") with the reason stated. That is not a bug to fix; it is a
site's choice to respect.

## Adding a project's demo

1. Add the project to `src/data/projects.js` (with its CV links).
2. Add an entry to `src/config/demos.js`: `kind` is `web` | `video` | `drop-in`,
   and `frame` is `browser` | `phone`.
3. If it needs a hosted build, put it in `public/demos/<id>/` and register it in
   `public/demos/manifest.json`.

`npm run verify:content` fails if a project has no demo entry, if a web demo is
labelled as a recording, or if a native Android project does not state its
limitation — so the honest labelling cannot rot into a silent claim.
