# Befrothed v0.2.2 — contact depth

10 October 2026. Follow-up to the owner's 17:27 iPhone recording of v0.2.1. That recording supported keeping the softer foam, calmer settling and lighter Trace. This pass adds localized depth to the finger's contact with the surface.

## Changes

- A bounded, shallow depression follows each active pointer. Holding maintains its shape rather than digging deeper indefinitely. Up to two contacts are supported, with the existing wider touch footprint.
- A soft raised bank leads a moving stroke. The direction becomes neutral after the pointer stops, and reverses with the stroke.
- After movement or release, the displaced height travels with the surface, smooths and relaxes. Warm coffee and lighter cream cues make the cavity and bank legible while leaving fine pigment strands softly shaded.
- The footprint is evaluated inside the existing foam evolution pass. No additional framebuffer or full rendering pass is added. Input force, the broader settling window and Trace observation remain unchanged.
- The Trace panel and exported logs identify v0.2.2. Trace remains optional and off by default.

## Validation

- TypeScript checking and all 21 Node behavior tests passed. New coverage verifies contact position/direction, stationary holds, outside-cup exit/reentry, cancellation and two-contact cleanup.
- Standalone Mesa/EGL rendering compiled the actual shader bodies with a desktop GLSL preamble. A deterministic stroke, circle and release sequence at the low simulation profile stayed finite, retained about 98.4% of reference foam coverage after settling, and reached zero flow. The rendered swirls retained soft shading.
- An isolated zero-flow contact check verified a centered, bounded depression, no distant height change, directional banks in both directions, and two simultaneous depressions. In this synthetic check, the center retained approximately 61% of its held depth after one second and 9% after five seconds of release. These are model values, not physical depth measurements or promised timings under moving flow.
- Both reset checks produced pixel-identical pristine renders. The source publication workflow builds and packages the exact pushed commit.

The supported browser-control skill was unavailable, so browser/device QA was skipped as required by the Sites workflow. The standalone renderer does not certify WebGL compatibility, mobile performance or perceived touch depth. Review the new build on iPhone with a slow stroke, reversed stroke, stationary hold and release; record with Trace when diagnosing contact, then turn it off to judge the surface unobstructed.

## Rollback

Saved Site version 4 (v0.2.1) is the immediate rollback point. Earlier versions and Git history are retained. No user-data change or migration is involved.

| Version 4 reference | Exact identifier |
| --- | --- |
| Source commit | `c567fd9570a37d23a1e3b8e5f4d3f156247f06ea` |
| Saved Site version | `appgprj_6a9d4e17d4d4819182c19776cad60c0f~appgver_05fcfaffcd1881918c3ce71157cdb399` |
| Successful deployment | `appgdep_6aca03bd1220819180029032f0133702` |

Deploy that saved version to the same Befrothed Site to restore v0.2.1 without rewriting history. Keep the existing public audience.
