# Mobile and realism refinement — 7 September 2026

## Baseline and publication boundary

Work began from clean `main` at `cfbd108084dd132f0a6ab1d91939b805d8aa0682` in the standalone Befrothed repository. The current repository, Git HEAD and live Site were checked before edits. A later read still confirmed the owner-controlled public Site, access revision 2, and saved version 1 at https://befrothed.riffster.chatgpt.site. Its saved source matches that baseline.

This refinement is verified locally. Publishing it to the existing public audience is a separate pending action. No Site access settings, unrelated repositories, projects or Sites were changed. The earlier Drive handover remains an archive of the initial v0.1 release, not this refinement.

## Result

- Photo and liquid share a single percentage-based scene frame. Resizing cannot leave independently positioned layers out of step.
- The liquid canvas has its own CSS ellipse, overflow clip and rounded boundary. The final shader also writes opaque photo-matched perimeter pixels. Hidden-until-ready presentation and context-loss fallback retain the photograph.
- The scene uses `min(128vw, 120svh)`, with a landscape height cap. Narrow portrait layouts preserve the entire cup and saucer with margins.
- Slow contact movement no longer accumulates the stationary hold vortex. Faster strokes inject substantially more force. Hold still ramps a local swirl.
- Integrated force selects a finite 8–24 second tail. Passive uneven drag adds asymmetry; velocity and curl fade together over the final five seconds. Parking clears pressure and flow after the fade, preserving pigment.
- GPU average-color correction reduces drift. Mixed-region contrast, emulsion relief and photograph-derived crema grain retain visible structure after heavy stirring. Intact milk colors are excluded from the contrast boost.
- The control is **Reset**. It restores the initial condition through the existing short dissolve and makes no re-pour claim. Internal `reserve_latte` WebMCP naming is retained for compatibility.

## Verification

The running development app was inspected through the in-app browser at 1440×900, 900×700, 390×844, 320×568 and 844×390. Native macOS Safari was inspected in 636×1055 and 1256×768 outer windows. Actual browser content height differs from the native outer-window height.

| Check | Outcome |
| --- | --- |
| Initial composition | Full overhead rim, handle and saucer; intentional portrait margins; no extra consumer UI |
| Slow mouse and touch | 1.44-second synthetic paths through the actual Pointer Events listeners create local deformation; most latte art remains |
| Fast mouse | Same path in about 96 ms creates substantially stronger flow and stretched/torn milk |
| Native mouse capture | Actual IAB and Safari drags disturb only liquid; release outside the cup clears the dragging state |
| Repeated stirring | Six repetitions of two circular revolutions, for both mouse and touch, destroy the art and leave mottled coffee/milk structure |
| Tap / hold | Touch prod is small; a stationary 2.8-second hold builds a local vortex |
| Reset | Actual buttons and WebMCP reset restore the original image; no serving animation added |
| Portrait / landscape / desktop resize | Disturbed surface survives resizing with stable cup registration; no rectangular frame or blank layer observed |
| Mask stress test | Development probe clears the entire raw framebuffer to opaque magenta; only the cup-interior ellipse is visible, with no square corners |
| Context loss / recovery | `WEBGL_lose_context` hides the canvas, keeps the photograph and shows the concise recovery message; Reset recreates working interaction |
| Quality reduction | Forced 128/768 → 96/512 reduction preserves the stirred state. Safari also lowered quality automatically under load |
| Settling and end-state | Motion continues well beyond the old seven-second window after vigorous input, fades to rest, and does not restore the rosetta |
| Console / GL | No app errors or warnings in the in-app browser checks; development field inspections return GL error 0 |
| Production export | Built static output served at port 4179; native dragging, desktop-to-phone resize and Reset work; no FPS overlay; only `reserve_latte` is registered |

Touch checks are synthetic Pointer Events, not a real iPhone. Native mouse input separately verifies browser pointer capture. The actual iPhone artifact is not claimed to have been reproduced or device-certified: the fix removes independent layer registration and uses two explicit clipping defenses, verified in the available browsers.

### Measured aftermath

Development GPU samples use an occasional 64×64 readback, outside the frame loop. Velocity is measured in liquid diameters per second; encoding zero has a readback floor of approximately 0.00002158. These are diagnostic field values, not a claim of physically measured fluid speed.

| Sample | Tail | RMS velocity | Observation |
| --- | --- | --- | --- |
| Gentle touch release | 10.56 s | 0.0250 | Local deformation |
| Gentle touch after settling | 10.56 s completed | Encoding floor | Rest, with disturbed art retained |
| Fast mouse release | 14.51 s | 0.1950 | About eleven times the desktop gentle-stroke release RMS in this sample |
| Repeated touch stirring release | 24 s | 0.3135 | Strong circulation and broken art |
| Same touch run, 17.12 s after release | 24 s | 0.0225 | Visible residual motion; not immediately still |
| Same touch run, 25.99 s after release | Completed | Encoding floor | Parked after the fade |
| Repeated desktop stirring after settling | Completed | Encoding floor | Residual crema / milk structure, no returning art |

In the repeated mobile run, sampled mean pigment luma changed from 0.683 pristine to 0.667 settled. The high-white threshold fraction did not expand after heavy stirring. These support reduced drift, not strict pigment conservation or a calibrated foam-mass measurement. Appearance was also inspected visually; numeric field checks alone are insufficient for this product.

### Performance limits

The IAB run measured approximately 8.3 ms requestAnimationFrame cadence on this host. Native Safari displayed about 33 ms while under the session's graphics load and selected the low profile. These are different host/browser observations, not an iPhone FPS guarantee or isolated GPU timing. DPR remains capped, simulation resolution remains independent of viewport resolution, and no catch-up loop doubles GPU work on slow frames.

Physical iPhone Safari and Chrome, dynamic mobile browser chrome, sustained thermals, real finger latency and universal device-specific compositing behavior remain unverified. The generated scene is still a temporary photographic-style asset. Very long stirring still loses fine filaments; the retained texture is a perceptual treatment rather than separate milk/foam physics.

## Automated checks

- Twelve meaningful input/aftermath tests pass: bounds, fast/slow force, touch footprint, capture cancellation, queue budget, teardown, stationary-hold separation, no ambient motion, force-dependent tails, smooth settling, integrated batch force, rested-state behavior and 30/120 Hz envelope retention.
- Authored application lint and TypeScript checks pass.
- Production static build passes and the running export passes browser smoke verification. Client output contains no gesture/inspection probes, mask-fault controls, GPU readback diagnostics or submission instrumentation.
- `git diff --check` passes.
- One Impeccable detector run reports only the existing Helvetica font-family warning. Retained intentionally: the brief calls for almost invisible UI, and the serif wordmark already supplies the identity. No new typeface or UI expansion was introduced.
- Historical scaffold lint/dependency limitations remain as described in `QA.md` and `V0_1_NOTES.md`.

## Exact files changed

| File | Change |
| --- | --- |
| `app/globals.css` | Shared scene frame, independent ellipse, canvas readiness and portrait sizing |
| `components/latte-experience.tsx` | Nested photo/canvas geometry, Reset wording, recovery copy |
| `lib/beverage/scene.ts` | Decode-before-present, resize/restoration handling, safe fallback and aftermath lifecycle |
| `lib/beverage/gpu.ts` | Premultiplied opaque presentation and retained settled drawing buffer |
| `lib/beverage/input.ts` | Gentle/fast gain and stationary-hold separation |
| `lib/beverage/aftermath.ts` | New finite, force-dependent coasting envelope |
| `lib/beverage/config.ts` | Centralized force, damping, viscosity, tail and material tuning |
| `lib/beverage/simulation.ts` | GPU color reduction/correction, velocity parking and development samples |
| `lib/beverage/shaders.ts` | Settling retention, color correction, residual material and opaque composite |
| `lib/beverage/compositor.ts` | Material/mean uniforms |
| `lib/beverage/dev-probe.ts` | Development-only raw-canvas clipping and diagnostic probes |
| `scripts/input.test.mjs` | Moving-contact vs stationary-hold regression |
| `scripts/aftermath.test.mjs` | New force, envelope and idle regressions |
| `package.json` | Run both test files |
| `README.md` | Current architecture, controls and public-Site context |
| `V0_1_NOTES.md` | Refinement, shortcuts, limits and next improvements |
| `REFINEMENT_QA.md` | This verification and handoff record |

Local screenshots and raw measurements are in `outputs/refinement/` (ignored generated evidence). Main captures: `mobile-pristine.jpg`, `mobile-gentle.jpg`, `mobile-stirred-release.jpg`, `mobile-stirred-settled.jpg`, `mobile-clip-fault.jpg`, `mobile-context-fallback.jpg`, `phone-small-pristine.jpg`, `phone-landscape-settled.jpg`, `narrow-desktop-settled.jpg`, `desktop-pristine.jpg`, `desktop-stirred-release.jpg`, `desktop-stirred-settled.jpg`, `safari-portrait.jpg`, `safari-desktop.jpg`, and `measurements.json`.
