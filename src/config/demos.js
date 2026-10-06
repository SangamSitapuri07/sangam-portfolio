/**
 * Demo environment — how each project is run from inside the portfolio.
 *
 * The source for every entry here is the CV's own "Live Demo" link. Nothing was
 * added: two of those links are recorded demonstrations and one is a deployed web
 * app, because that is what the CV says they are.
 *
 * ── The honest part ───────────────────────────────────────────────────────────
 *
 * A browser cannot run a native Android application. News Pinch is Kotlin and
 * compiles to an APK for the ART runtime; no web page can execute that. Anyone
 * who claims otherwise is showing you a video, a re-implementation, or a remote
 * emulator streaming pixels. So this environment does the honest thing: it plays
 * the recorded demo the CV links to, says plainly that it is a recording, and
 * tells you how to actually run the app.
 *
 * ── Making a project genuinely runnable ───────────────────────────────────────
 *
 * `drop-in` — if a web build of the app exists, put it in `public/demos/<id>/` and
 *   add it to `public/demos/manifest.json`. The lab then runs it in the frame,
 *   same-origin, with no other change. This is the recommended path, and it is
 *   real: `flutter build web` in the Nuno client produces exactly such a build,
 *   running the same Dart code as the Android app.
 *
 * See docs/DEMO-LAB.md for the exact steps, including why Flutter can do this and
 * Kotlin cannot.
 */

/** Where a hosted web build would live if one is dropped in. */
export const hostedPath = (id) => `/demos/${id}/index.html`

export const demos = {
  nuno: {
    id: 'nuno',
    projectId: 'nuno',
    /** What the CV's Live Demo link actually is. */
    kind: 'video',
    src: 'https://drive.google.com/file/d/18CvfcClqI6hI97C6cGeu4zrXlPbNsG-s/preview',
    external: 'https://drive.google.com/file/d/18CvfcClqI6hI97C6cGeu4zrXlPbNsG-s/view?usp=sharing',
    frame: 'phone',
    badge: 'Recorded demo',
    title: 'Nuno — multiplayer card game',
    /* The app is Flutter, so a real in-browser build is possible. */
    runtime: 'flutter',
    runnable: true,
    howToRun:
      'The client is Flutter, which also compiles to the web. Run `flutter build web` in the client repository, drop the output in `public/demos/nuno/`, and this frame runs the app itself instead of the recording.',
  },

  'ai-debate-coach': {
    id: 'ai-debate-coach',
    projectId: 'ai-debate-coach',
    /** A deployed web app: this one genuinely runs. */
    kind: 'web',
    src: 'https://debate-coach.netlify.app/',
    external: 'https://debate-coach.netlify.app/',
    frame: 'browser',
    badge: 'Live web app',
    title: 'AI Debate Coach',
    runtime: 'web',
    runnable: true,
    howToRun: null,
  },

  'news-pinch': {
    id: 'news-pinch',
    projectId: 'news-pinch',
    kind: 'video',
    src: 'https://drive.google.com/file/d/1i5czKpk2k_Pkq38Buh9PpnFJIZ5UEWsr/preview',
    external: 'https://drive.google.com/file/d/1i5czKpk2k_Pkq38Buh9PpnFJIZ5UEWsr/view?usp=sharing',
    frame: 'phone',
    badge: 'Recorded demo',
    title: 'News Pinch — Android app',
    runtime: 'android',
    runnable: false,
    /* Said once, plainly, instead of pretending. */
    limitation:
      'News Pinch is a native Android application: Kotlin compiled to an APK for the Android runtime. No web page can execute it, so this is the demonstration recording.',
    howToRun:
      'To run it for real: open the repository and build the APK from source in Android Studio, or install a released APK on a device.',
  },
}

/** Projects that have a demo entry, in CV order. */
export const demoOrder = ['nuno', 'ai-debate-coach', 'news-pinch']

export default demos
