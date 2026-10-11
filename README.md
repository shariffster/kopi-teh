# Kopi / Teh

A tactile drink-making prototype: stir an original finished latte, deliberately start a new kopi or teh, change the proportions, shape the milk surface and serve your own cup. Built for the Common Ground Makeathon on 11 October 2026.

**0.4.0 candidate — 11 October 2026.** Local refinements add broader liquid filling, high ingredient pours, a sugar cascade and progressively drawn photographic froth. Final integrated QA and release packaging remain in progress; this source version alone does not certify publication.

## Try the flow

1. The opening is **Original latte**: Befrothed saved version 5's finished photographic-style surface, ready to stir as soon as the engine is loaded. It does not automatically pour a Kopi preset on arrival.
2. Choose **Kopi-O**, **Kopi**, **Kopi-C**, **Teh**, or **Empty cup** when you want a new cup. This deliberate change drains the current surface; a selected recipe then fills through staged ingredient additions. The same four cultural presets remain available.
3. Hold an ingredient to pour, or activate its button with the keyboard for one addition. The six inputs are coffee, tea, water, condensed milk, evaporated milk and sugar. New cups show a recessed liquid pool, visible fill changes and surface layers as ingredients arrive.
4. Drag to stir. Open **Shape the froth** for **Heart**, **Rosetta** or **Draw your own**. Froth tools require milk already in the cup and reshape its appearance; they add no ingredient quantity. **Back to stirring** leaves drawing mode. **Original latte** restores the inherited finished surface with its illustrative starting ledger.
5. Use **Undo last addition** to restore the preceding composition through a drain/rebuild transition. Choose **Just the cup** for a focused view; its **Ingredients** tray keeps pouring available.
6. **Serve this cup** preserves the cup and switches to its finished presentation. **Keep mixing** returns to editing; **Make another** starts empty. Nothing is ordered, purchased or submitted.

The surface accepts pointer input and keyboard arrows for stirring, Space for a ripple, and R to deliberately empty the cup. In froth drawing mode, pointer strokes and keyboard surface input shape the milk instead. The empty ceramic well is not stirred as liquid. Ingredient buttons and surrounding controls remain keyboard accessible. Reduced-motion users receive a shortened **100ms drain**; the original-surface return rise also shortens to 100ms. These are visual transitions, not a real fluid measurement.

## Run locally

Requires Node.js 22.13 or newer and npm.

```sh
npm ci
npm run dev -- --port 4178
```

Open `http://localhost:4178`. Available development commands:

```sh
npm run typecheck
npm run lint:app
npm test
npm run build
npm run preview
```

The inherited preview script serves `dist/client` at `http://127.0.0.1:4179`; `BEFROTHED_PORT` changes its port. These commands are instructions, not a claim that all release checks passed. This README does not certify a deployment or public release.

## What the model means

Liquid inputs are recorded in **ml**, separately added sugar in **g**. The ledger caps liquid additions at 300 ml and separate sugar at 30 g. Sugar grams never enter the liquid composition bar. Condensed milk is explicitly sweetened milk, even with zero separate sugar.

The opening **Original latte** carries an explicitly illustrative editable ledger: **140 ml coffee + 20 ml condensed milk + 20 ml water = 180 ml**, with zero separately added sugar. This assignment is **not a recipe inferred from the image**. The original photograph is presented as a finished cup independently of that illustrative volume; it does not prove actual ingredients or fill depth.

The four selectable presets are unchanged authored examples with 140 ml of coffee or tea and 180 ml total liquid. They are not national standards or authoritative stall recipes. The WebGL mixing, colour, fill depth, surface layers and froth shapes are artistic visual models; they do not predict fluid physics, chemistry, nutrition or taste. New-cup fill follows the liquid ledger visually, while the inherited opening intentionally preserves its finished photographic presentation. Froth shaping changes neither ml nor g. Undo restores composition, not the preceding swirl or freehand design; restoring an original-state snapshot returns the original artwork. See [the drink model](docs/DRINK-MODEL.md) for quantities, naming rules and limitations.

Naming references: [Mount Alvernia Hospital, Know Your Kopi](https://mtalvernia.sg/education/know-your-kopi/) and [HealthHub, Getting Your Caffeine Hit](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/i-love-coffee-i-love-tea).

## Source and assets

This project forks **Befrothed saved version 5 / v0.2.2**, commit `51981b8219deb042539a458d4ef2bbd819c7b8d9`. See [FORK-PROVENANCE.md](FORK-PROVENANCE.md). The earlier Site and repository are separate; their publication history is not this fork's publication status.

The fork retains Befrothed's registered photographic scene, WebGL surface, interaction engine and historical release notes. The default finished surface is restored from the exact saved-version-5 source identified above; it is not a newly generated replacement. The scene is generated photographic-style artwork, not a camera photograph; its original provenance is retained in [ASSET_NOTES.md](public/assets/beverages/latte/ASSET_NOTES.md). Existing provenance and dependency licence terms remain applicable; these docs introduce no new licence grant.

Ingredient controls use colour swatches. Active pours use generated pitcher and spoon assets; these are visual props, not photographs of real utensils. Other rejected prop experiments remain unused.

The interaction requires WebGL 2; graphics failure is surfaced with a reload control. Prior Befrothed device observations in `V0_*_NOTES.md` are historical evidence, not certification of this fork. See [CHANGELOG.md](CHANGELOG.md) for the new scope.

## Verification status for 0.4.0 candidate

The local liquid/froth/sugar candidate passed 44 tests, typecheck, scoped lint and a production build before the final directional overflow refinement. Browser checks exercised the original surface, held pours, full capacity, sugar cascade and froth controls. Final overflow browser QA and release packaging remain in progress. These are scoped desktop observations, not native-device or physical-simulation certification.
