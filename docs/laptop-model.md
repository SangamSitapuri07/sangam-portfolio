# Supplied laptop model

## Source and licensing

- File: `public/models/cyberpunk_laptop.glb`
- Source: the owner's `main` branch, downloaded using the GitHub blob API.
- Size: 8,326,028 bytes (8.33 MB decimal).
- Original blob: `42d690d45aa1beacd845759aca38442e21bce93f`.
- Artist: Vivien Deroche / blue-odym.
- Title: CyberPunk Laptop.
- License: CC BY 4.0, recorded in the GLB's `asset.extras`.
- Artist/source/license links are visible in the portfolio footer.

The supplied binary is unmodified. Render-time lighting and screen emission
are adjusted for the dark studio. The poster and social image are renders of
this same model, not substitutes or AI-generated approximations.

## Structure

- One scene, 42 nodes, 37 meshes, 33 materials, eight embedded images.
- No skins, animation clips, or external texture dependencies.
- `Cube_0`: base group.
- `Cube.001_3`: separate lid group.
- `Object_24`: main screen, parented under the lid.
- `Object_25`: secondary screen, also parented under the lid.
- Lid translation: `[0, 0.09567784518003464, -0.72751384973526]`.
- Hinge rotates around local X; the source pose is already open.

Three's GLTFLoader sanitizes node names: `Cube.001_3` becomes `Cube001_3`.
Always use `resolveModelNode()` with the source name from the asset manifest.

The Sketchfab conversion hierarchy contains inverse X-axis rotations that
cancel out. Keep that hierarchy intact rather than guessing an extra global
90-degree correction.

## Cinematic integration

The ten-scene implementation preserves this hierarchy. The original lid,
keycaps (`Object_5`), deck (`Object_4`), and chassis animate using captured rest
transforms. The LCD receives a portfolio display texture. The added PCB is
labelled illustrative; it is not an internal source mesh.

See `docs/the-breakdown-protocol.md` for the controller, component offsets,
source-aware project previews, reverse-scroll tests, and fallback behavior.

## Release optimization

Runtime: `public/models/cyberpunk_laptop.optimized.glb`, 5,295,184 bytes.
The original above remains byte-for-byte unchanged. `npm run assets:optimize`
uses Meshopt without quantization, simplification, reparenting, or texture
recompression. The build verifies source identity; tests compare all decoded
attributes, oriented triangles, named nodes/transforms, texture bytes and
material values. Runtime decoding uses Drei's bundled decoder, not a CDN.
