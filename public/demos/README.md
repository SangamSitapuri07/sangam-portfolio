# Hosted project builds

Drop a **web build** of a project in this folder to have the portfolio run it for
real, inside the demo environment's device frame — instead of showing the
recorded demonstration.

1. Build the web version of the app (for a Flutter client: `flutter build web`).
2. Copy the output to `public/demos/<project-id>/`.
3. Register it in `manifest.json`:

```json
{ "demos": { "nuno": { "path": "/demos/nuno/index.html" } } }
```

The project id is the `id` in `src/data/projects.js` (`nuno`, `ai-debate-coach`,
`news-pinch`). Full instructions, including why a Kotlin/Java Android app cannot
be hosted this way, are in `docs/DEMO-LAB.md`.
