# Kopi / Teh

A tactile drink-making prototype: start with a familiar kopi or teh, change the proportions, stir the surface, and serve your own cup. Built for the Common Ground Makeathon on 11 October 2026.

## Try the flow

1. Choose **Kopi-O**, **Kopi**, **Kopi-C**, **Teh**, or **Empty cup**. Presets prepare the cup through a sequence of actual ingredient additions; the opening cup is Kopi.
2. Hold an ingredient to pour, or activate its button with the keyboard for one addition. The six inputs are coffee, tea, water, condensed milk, evaporated milk and sugar.
3. Drag the liquid surface to stir. The ticket shows the recorded ingredients, a composition bar for liquids, and separate sugar grams.
4. Use **Undo last addition** to restore the preceding recipe composition. Choose **Just the cup** for a focused view; its **Ingredients** tray keeps pouring available.
5. **Serve this cup** switches to the finished-cup presentation. **Keep mixing** returns to editing; **Make another** starts empty. Nothing is ordered, purchased or submitted.

The surface accepts pointer input and keyboard arrows for stirring, Space for a ripple, and R to empty the cup. Ingredient buttons and the surrounding controls remain keyboard accessible.

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

The four presets are authored examples with 140 ml of coffee or tea and 180 ml total liquid. They are not national standards or authoritative stall recipes. The WebGL mixing, colour and surface movement are illustrative; they do not predict chemistry, nutrition or taste. Undo restores composition through fresh pours, not a previous swirl pattern. See [the drink model](docs/DRINK-MODEL.md) for quantities, naming rules and limitations.

Naming references: [Mount Alvernia Hospital, Know Your Kopi](https://mtalvernia.sg/education/know-your-kopi/) and [HealthHub, Getting Your Caffeine Hit](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/i-love-coffee-i-love-tea).

## Source and assets

This project forks **Befrothed saved version 5 / v0.2.2**, commit `51981b8219deb042539a458d4ef2bbd819c7b8d9`. See [FORK-PROVENANCE.md](FORK-PROVENANCE.md). The earlier Site and repository are separate; their publication history is not this fork's publication status.

The fork retains Befrothed's registered photographic scene, WebGL surface, interaction engine and historical release notes. The scene is generated photographic-style artwork, not a camera photograph; its original provenance is retained in [ASSET_NOTES.md](public/assets/beverages/latte/ASSET_NOTES.md). Existing provenance and dependency licence terms remain applicable; these docs introduce no new licence grant.

An ingredient-props image experiment was rejected for edge artefacts and excluded from this release. Ingredient controls use colour swatches.

The interaction requires WebGL 2; graphics failure is surfaced with a reload control. Prior Befrothed device observations in `V0_*_NOTES.md` are historical evidence, not certification of this fork. See [CHANGELOG.md](CHANGELOG.md) for the new scope.
