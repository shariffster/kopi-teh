# Befrothed v0.1 notes

## Implemented

One photographic-style overhead latte. Pointer/touch drag, velocity-sensitive tearing, stationary hold vortex, tap ripples, force-dependent settling, persistent destroyed art and pristine Reset. Static cup and context, responsive composition, keyboard interaction, replaceable assets, adaptive GPU quality, context recovery and development frame instrumentation. The owner made the initial static Site public.

The 7 September refinement adds shared photo/canvas registration, independent elliptical clipping, opaque photo-matched presentation, safe hidden-canvas fallback, improved portrait framing, an 8–24 second finite aftermath, pigment drift correction and residual mixed-surface texture. See `REFINEMENT_QA.md` for verified outcomes and the current publication boundary.

## Realism shortcuts

- The cup, saucer, table and shadows are a single synthetic photographic-style image.
- A high-resolution pigment field carries coffee, milk, crema and their photographed microtexture together. These are not separate chemically modeled fluids.
- A shallow 2D flow with curl and a pressure solve supplies macro movement. No 3D liquid, volumetric foam, surface tension mesh or individual microbubble simulation.
- Small analytic ripple normals and restrained highlights imply surface depth. A static meniscus protects the ceramic boundary.
- Photograph-derived annulus grain and domain-warped emulsion relief replenish detail lost during strong mixing. A bounded contrast treatment acts on mixed colors, avoiding amplification of intact white foam.
- A small GPU average-color reduction counteracts transport drift. This does not reconstruct the rosetta, conserve individual coffee/milk masses, or simulate bubble populations.
- Passive spatial variation in drag and a smooth force-dependent envelope supply an organic but finite aftermath.

## Known limitations

- The generated 1254px scene is the v0.1 visual asset, not a final photographic capture. The asset request asked for 2048px; the returned file is 1254px.
- Advection is bounded and visually stable but not strictly pigment-mass conserving. The drift correction reduces, but does not eliminate, long-stir color change. Heavy mixing still softens fine strands; retained marbling is an artistic approximation.
- Two contacts are supported; this is not a general multi-tool fluid workbench.
- Responsive browser and native macOS Safari checks are complete for this refinement. The original mobile artifact was not reproduced on a physical iPhone; the independent clip was stress-tested with a fully opaque raw canvas. Native iPhone Safari/Chrome thermal behavior, sustained FPS, browser chrome and real finger latency remain device-QA work.
- Devices without renderable float WebGL 2 surfaces retain the still image and an honest recovery message.
- The untouched Sites scaffold has catalog lint debt and upstream dependency advisories. Authored code passes focused lint and typecheck. Deployment contains only static client files, with no server-function runtime.

## Next highest-leverage improvements

1. Capture a higher-resolution, precisely registered real latte, with separate liquid seed and measured meniscus matte.
2. Measure and tune the sustained flow on a real recent iPhone, particularly thermals, touch latency and aggressive stirring.
3. Improve conservative pigment transport and calibrated foam retention, beyond the current average-color correction.
4. Replace synthesized emulsion relief and annulus grain with a dedicated nonrepeating foam/crema microdetail atlas and normal map.
