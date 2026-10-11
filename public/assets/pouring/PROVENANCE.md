# Pouring asset provenance

Generated 2026-10-11 with built-in `image_gen.imagegen` (one call per asset); `transparent_background: true`. No CLI/API fallback and no post-generation image editing. The original PNG bytes and alpha channels were preserved on copy.

## Final assets

| Asset | Dimensions | Approximate pour-tip normalized coordinates |
| --- | --- | --- |
| `pitcher-v1.png` | 1254 × 1254 | x = 0.919, y = 0.655 |
| `sugar-spoon-v1.png` | 1254 × 1254 | x = 0.971, y = 0.901 |

Coordinates are visual alignment estimates relative to the entire uncropped image canvas (top-left origin). Visually inspected generated assets. Both files are 1254 × 1254 RGBA PNGs with alpha confirmed via macOS `sips`. The pitcher is ivory ceramic; the spoon is silver with visible sugar grains.

## Original files

- Pitcher: `/Users/shariffmbp13/.codex/generated_images/01a1298b-3e96-7262-92af-605dea606d16/exec-5c66eee6-908c-4ef8-b3c4-eb95ade5d4ec.png`
- Sugar spoon: `/Users/shariffmbp13/.codex/generated_images/01a1298b-3e96-7262-92af-605dea606d16/exec-0343ff36-5b60-4c20-b588-03890ab56941.png`

## pitcher final prompt

```text
Use case: product-mockup
Asset type: transparent cutout photograph for a coffee-and-tea pouring interaction.
Primary request: one small premium ivory ceramic milk pitcher, photographed as a real physical product, suspended in a pouring pose. A single realistic pitcher, not an illustration, icon, or 3D render.
Scene/backdrop: completely transparent true alpha background; no tabletop, no ground plane, no cast shadow outside the object.
Composition/framing: square canvas, entire object isolated with generous clear margins. Camera is above at approximately 65 degrees looking down. Pitcher is tipped forward diagonally towards the lower right, with its narrow pouring spout forming the extreme lower-right tip of the silhouette. Handle is on the left/upper-left. Interior is mostly hidden by the tilt; no visible liquid. Make a convincing, physically plausible tipped pouring pose, not an upright creamer.
Lighting/mood: warm soft photographic studio key from upper left, subtle realistic reflected light.
Materials/textures: real ivory ceramic glaze, subtle surface imperfections and fine highlights; detailed real-world product photography.
Constraints: no hands, no stream, no liquid, no lettering, no logo, no other objects, no background, no checkerboard pixels, no graphic outline. Preserve clean alpha edges.
```

## sugar final prompt

```text
Use case: product-mockup
Asset type: transparent cutout photograph for a coffee-and-tea pouring interaction.
Primary request: one real silver teaspoon carrying a small mound of white granulated sugar. Photographic real sugar grains and a realistic metal spoon, not an icon, illustration, or 3D render.
Scene/backdrop: completely transparent true alpha background; no tabletop, no ground plane, no cast shadow outside the object.
Composition/framing: square canvas. Entire spoon and sugar isolated with generous clear margins. Camera is above at approximately 65 degrees looking down. Spoon is diagonal: handle extends toward upper-left; oval spoon bowl is near the lower-right. Bowl tilted slightly downward in a pouring position, its lower-right tip is where granules would fall. Keep all sugar supported on the spoon, no falling sugar yet.
Lighting/mood: warm soft photographic studio key from upper left, subtle realistic reflected light.
Materials/textures: polished real silver teaspoon with believable reflections and fine scratches; individually resolved translucent white sugar crystals.
Constraints: only one spoon with sugar. No hand, no stream, no falling grains, no labels, no logo, no other objects, no background, no checkerboard pixels, no graphic outline. Preserve clean alpha edges.
```

