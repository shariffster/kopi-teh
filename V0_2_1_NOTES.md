# Befrothed v0.2.1 — softer foam and calmer settling

10 October 2026. A focused follow-up to the owner's 17:05 iPhone recording of saved Site version 3. The recording showed persistent foam, working Trace/Reset, and an approximate reported 60 FPS on the mobile profile. It also exposed overly sharp, shiny folds, continuing fine turbulence after release, and heavy dark trails hiding the liquid.

## Changes

- Broader and shallower input grooves, faster local height smoothing, reduced coverage sharpening, and gentler cream/coffee contrast. Coverage correction and persistent disturbed art remain in place.
- Surface lighting samples over a wider spatial patch and uses much smaller coverage-height slopes, highlights and cavity shadows. Fine pigment strands no longer receive steep metallic-looking ridges. The pristine photograph remains exact.
- Reduced active curl reinforcement. After release, fine-eddy reinforcement has its own short decay and velocity diffusion increases gently. The broader velocity envelope and original 8–24 second settling window are retained. Fresh input restores the active response immediately.
- Trace trails fade over 1.1 seconds instead of 2.4, use thin translucent color strokes, and have no dark backing stroke. Current contact, direction arrow, hold ring, data logging and toggling remain available. Log exports and the panel identify v0.2.1.

## Checks

- TypeScript and 18 Node behavior tests passed, including early fine-eddy decay without shortening the broader settling window, immediate response to new input, input/Trace noninterference, cancellation, Reset state and frame-rate-independent terminal fading.
- A standalone Mesa/EGL harness compiled the GLSL programs with a desktop preamble and compared the same deterministic stroke/circle/release sequence against the version 3 source. It used the actual configurations and Aftermath outputs for each version, at the low simulation profile.
- The inspected 6- and 8-second frames showed rounder milk swirls and substantially softer shading. Two seconds after release, sampled curl RMS was about 87% below version 3 while nonzero broader movement remained. This is a synthetic rendering comparison, not a physical foam measurement or phone benchmark.
- The long sequence also checks finite fields, retained foam coverage, eventual zero velocity, a prod's depression/raised bank and pixel-identical pristine Reset.
- The publication workflow builds and packages the exact pushed source commit before saving the Site version.

The supported browser-control skill was unavailable, so this release has no new browser/device QA. The owner's next recording should confirm softness, perceived settling, lighter trails and touch response on iPhone. The previous recording's FPS does not establish this build's performance.

## Rollback

Version 3 remains the immediate rollback point; version 2 remains the earlier September baseline. History is preserved rather than overwritten, and the existing public audience is unchanged.

| Version 3 reference | Exact identifier |
| --- | --- |
| Source commit | `266f9a0c2f50ea16d88ae6425a48d1e4f64f62e6` |
| Saved Site version | `appgprj_6a9d4e17d4d4819182c19776cad60c0f~appgver_d66ba3df03d08191bf0967bc645ff007` |
| Successful deployment | `appgdep_6ac9fb60eca08191be9a0068d0fe39d4` |

Deploy that saved version for the same Befrothed Site to restore version 3 without erasing subsequent source history. There is no database migration or user-data change.
