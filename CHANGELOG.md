# Changelog

## 0.2.0 — 11 October 2026

### Changed

- Open on **Original latte**, restoring the exact finished Befrothed saved-version-5 surface and immediate stirring once loaded. The opening no longer automatically prepares the Kopi preset.
- Label the opening's 180 ml ledger as an **illustrative starting mix**: coffee 140 ml, condensed milk 20 ml and water 20 ml. These amounts are not inferred from the image or claimed as the original photograph's real recipe.
- Make selecting Empty cup or any cultural preset a deliberate drain-and-rebuild transition. Restore Original latte through its own return transition.
- Add an artistic recessed pool, changing fill depth and visible surface layers for newly made cups. Preserve the original photograph's finished appearance independently of its illustrative volume.
- Shorten draining to **100ms** with reduced motion (normal drain: 480ms); the original-surface return rise uses 100ms with reduced motion (400ms otherwise).

### Added

- **Shape the froth** controls: Heart, Rosetta and freehand Draw your own / Back to stirring.
- Froth controls require existing milk and change surface appearance without adding ml, sugar grams or any ledger ingredient. Preparing/served states constrain editing; freehand mode is explicit.
- An **Original latte** restore action alongside the cup tools.

### Preserved and bounded

- Kopi-O, Kopi, Kopi-C and Teh quantities and naming remain unchanged, as do the approved ingredient selector and photographic carousel.
- The opening asset remains the synthetic photographic-style artwork inherited from Befrothed saved version 5 / v0.2.2 at `51981b8219deb042539a458d4ef2bbd819c7b8d9`.
- Fill, layers and froth are visual approximations, not a real fluid, foam chemistry or sensory simulation.
- 38 tests and TypeScript checks pass. Browser checks cover native stirring, original appearance, small pours, milk/froth, rapid recipe switching, serving, and the 390px phone/focus layouts. Actual transition frames are retained in the makeathon workspace. G's separate blend-panel choice is not part of this release.

## 0.1.0 — 11 October 2026 — submission candidate

### Added in Kopi / Teh

- Four staged illustrative presets: Kopi-O, Kopi, Kopi-C and Teh, plus an empty-cup starting point.
- Coffee, tea, water, condensed milk, evaporated milk and sugar additions; hold-to-pour and keyboard activation feed the same recorded composition.
- A recipe ticket with ingredient quantities, composition-based naming, a liquid-only bar and separate sugar grams.
- Independent 300 ml liquid and 30 g separately added sugar limits, with incoming additions clipped to remaining capacity.
- Composition undo, rebuilt through ingredient pours; finished-cup serving and return-to-mixing states.
- A focused cup view with an ingredient tray, alongside the mixing table and preset carousel.
- Source-linked notes explaining Kopi/Teh naming and the illustrative nature of the ratios and rendering.
- Unit tests covering naming, condensed-milk sweetness, immutable additions and separate capacity invariants.

### Inherited and preserved

Forked from Befrothed saved version 5 / v0.2.2, commit `51981b8219deb042539a458d4ef2bbd819c7b8d9`. The registered scene artwork, WebGL interaction foundations, asset provenance and historical release notes remain in the fork. See [FORK-PROVENANCE.md](FORK-PROVENANCE.md).

### Scope notes

The renderer is an illustrative material model, not a chemical or sensory simulation. Preset quantities are authored examples. No deployment, publication, judging submission or current device certification is asserted by this entry. The generated ingredient-props strip is an unused experiment and is not part of the implemented ingredient controls.
