# Befrothed v0.2 — foam relief and Interaction Trace

10 October 2026. Builds on the September 7 refinement, saved Site version 2, published on October 10 before this pass.

## Intent and behavior

The owner's iPhone recording showed that the circular crop and Reset worked, but extended stirring became too uniformly tan. This pass gives the foam a separate transported coverage field and a signed height field. Finger strokes and prods depress the surface and raise a soft surrounding bank. Relief gradually relaxes. Milk and coffee move more slowly than the underlying flow, and coverage sharpening keeps material islands distinct. A scalar coverage reference gently corrects numerical loss; it never restores the original pattern. Only Reset restores the initial art.

This remains an artistic 2D material simulation. Coverage correction is approximate, and foam height is shaded rather than geometric. No spoon picker, new beverage or backend was added.

## Trace controls

- **Trace** (top right) or **T**: enable or disable. Default off on every load.
- Cyan-to-amber markers/trails show movement speed; arrows show direction. Two contacts are supported. Dashed rings show the input influence radius. Stationary contact shows a hold ramp; captured motion outside the liquid turns gray.
- The panel shows elapsed time, contact type/count, speed in liquid diameters/second, clockwise/counterclockwise motion, hold/release timing, Reset/settling state, approximate active FPS and quality.
- **Clear** starts a fresh trace. **Save log** downloads JSON containing up to 12,000 input samples and 6,000 approximately 5 Hz state/frame-time checkpoints, plus viewport geometry and current diagnostics. Truncation is identified.
- **Off** or **Escape** restores the clean scene. Turning Trace off discards the unsaved log and stops its observer/render loop. Download first if needed.

Trace does not capture audio/video, upload data, measure physical pressure or modify simulation forces. Frame timings include Trace overhead. Logs are an aid to interpreting a screen recording, not a physics/performance benchmark.

## Verification

- TypeScript checks and 16 Node tests, including existing momentum/input regressions plus trace noninterference, outside-cup/cancellation reporting, stationary speed/hold timing and Y-up direction mapping.
- All 16 shader programs compiled and ran in a standalone Mesa/EGL test harness with a desktop GLSL preamble replacing the WebGL preamble. Low-profile passes were exercised with a gentle stroke, vigorous circles, a 26-second stir/settle sequence and a separate prod.
- Readback stayed finite. The prod generated a negative center displacement and positive surrounding ridge. Reset reproduced the pristine rendered pixels exactly. Sampled mean foam coverage ended at about 98% of its initial value (approximately 88–107% at intermediate checkpoints).
- Rendered contact sheets were inspected for stroke relief, persistent cream/coffee separation, settling and Reset. A layer-isolation check confirmed the uneven settled color followed the transported material rather than a new rectangular overlay.
- Production static build and packaging are required by the publication workflow, using the exact source commit saved for this release.

The supported browser-control skill was unavailable in this environment, so no new browser UI or physical iPhone QA is claimed. The standalone shader test does not certify WebGL driver behavior, mobile layout, export behavior on Safari or actual phone FPS. Older browser checks in `REFINEMENT_QA.md` apply to version 2. Next device review: record Trace enabled through a slow stroke, fast circle, stationary hold, release/settling and Reset; save the matching log before switching Trace off, then inspect the clean view.

## Version history and rollback

Source history is preserved in the existing Befrothed Git repository. Each publication uses a separate saved Site version, without rewriting earlier commits. This pass keeps the existing public audience and URL.

| Baseline | Identifier |
| --- | --- |
| September refinement source | `feefc1a2e51b86303a330a3ac2383b3be5a0f232` |
| Saved Site version 2 | `appgprj_6a9d4e17d4d4819182c19776cad60c0f~appgver_3460ede9bb8c81919bb7dbeca2407847` |
| Version 2 successful deployment | `appgdep_6ac9f3f0a93c8191baf2e8f4673fcff8` |
| Existing Site | `appgprj_6a9d4e17d4d4819182c19776cad60c0f` |

To roll back the live experience, deploy the saved version 2 identifier for this same Site. That switches the hosted version without erasing newer source history. The Site's version record stores the exact new source commit and deployment identifiers after publication. No data/schema migration is involved.
