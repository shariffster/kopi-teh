# v0.1 verification

Local verification on 6 September 2026. The task's Sites tool record is the authority for the eventual deployment result; this file records the application evidence.

## Automated checks

- `npm test`: 5 input regressions passed. Covers out-of-cup input, velocity-sensitive force, touch footprint, cancellation, bounded splat batches and listener teardown.
- `npm run typecheck`: passed.
- `npm run lint:app`: passed for authored UI, simulation and scripts.
- `npm run build`: passed; `/` is exported statically to `dist/client`.
- Production client search found no `exercise_latte_input`, `inspect_latte_development`, or development submission instrumentation.
- Whole-scaffold lint retains catalog/hook findings. The generated lockfile has upstream npm audit advisories; see the v0.1 notes.

## Browser checks

Tested the running development app and its separately served production export with the connected in-app browser.

| Check                 | Evidence                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial photograph    | Full overhead ceramic rim, handle, saucer, static light and restrained UI inspected                                                                           |
| Slow mouse/touch drag | Native short drag and a timed 1.44-second synthetic touch path deform nearby milk                                                                             |
| Fast drag             | Native broad strokes and a timed 96ms synthetic mouse path tear and curl the pattern; input regression confirms stronger force for equal-length faster motion |
| Repeated stirring     | Six timed circles through actual Pointer Events listeners, plus repeated native drags; art is visibly broken into marbling                                    |
| Hold                  | 2.8-second synthetic touch builds a local vortex progressively                                                                                                |
| Tap/prod              | Synthetic touch tap and native keyboard Space produce a small disturbance; ripple shading is deliberately restrained                                          |
| Release               | Immediate post-stroke motion and later settled states inspected; art remains disturbed after seven-second settling                                            |
| Re-serve              | Native button, R key and valid WebMCP action restore pristine original art                                                                                    |
| Keyboard              | Arrow-key stirring, Space prod, R reset and visible focus inspected                                                                                           |
| Resize                | 1440×900, 900×700, 390×844, 320×568, and 844×390 checked; full ceramic rim remains visible                                                                    |
| Phone layout          | The 390px and 320px layouts retain usable controls, centered beverage and no horizontal document overflow                                                     |
| Quality reduction     | 128/768 to 96/512 downgrade preserves the disturbed pigment and resumes interaction                                                                           |
| Context loss          | Real `WEBGL_lose_context` test retains the static photo and honest message; native Re-serve constructs a new canvas and restores interaction                  |
| Production surface    | Only the re-serve WebMCP tool registers; no FPS UI or development gesture probes                                                                              |
| Tool failure path     | Unexpected reset arguments fail intentionally without corrupting the latte; subsequent valid reset succeeds                                                   |
| Console               | No application console errors or warnings recorded during final production interaction and responsive checks                                                  |

The timed touch checks synthesize Pointer Events inside the development browser and exercise the same input listeners. They do not substitute for real-finger iPhone tests. Native mouse dragging separately verifies the browser's actual capture path.

The stationary scene is a separate immutable DOM image. The GPU compositor masks its output inside the inset liquid ellipse; visual checks show no liquid crossing the rim. Screenshot JPEG compression can alter a few neighboring pixels, so the evidence does not claim an exact zero-difference image test.

## Performance scope

Starting and reduced profiles both ran interactively. Development measurements ranged from approximately 8ms frames early in the session to slower cadence under concurrent machine graphics load. The readout measures requestAnimationFrame cadence, not isolated GPU time; no sustained-device FPS guarantee is claimed. The implementation caps DPR, separates flow/pigment resolution, avoids catch-up render spirals, lowers quality after sustained slow frames, and suspends fluid passes while settled or hidden. A physical iPhone Safari/Chrome test remains the highest-priority external verification.

## Visual evidence

Production browser captures in `.impeccable/review/`:

- `desktop.jpg`, `desktop-stirred.jpg` — 1440×900.
- `narrow-desktop.jpg` — 900×700.
- `mobile.jpg`, `mobile-stirred.jpg` — 390×844.
- `small-phone.jpg` — 320×568.
- `landscape.jpg` — 844×390.

These are native JPEG screenshots. Two initially malformed small/landscape captures were replaced with full-viewport renderer captures before finish review.

An independent read-only finish reviewer inspected all seven corrected images against the product brief and returned **ship**, with no material fixes. The verdict covers visible composition, interface, photographic material treatment and rim confinement. Motion quality is supported separately by the interactive checks above, within their stated device limits.
