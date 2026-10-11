# Drink model

**0.2.0 — 11 October 2026.** This describes the implemented local source; final QA and release packaging remain in progress.

Kopi / Teh models a cup as a ledger of ingredients and an illustrative surface. The recorded recipe is the source of truth for quantities and names. Stirring changes the visual surface, not the ingredient totals.

## Units and capacity

`DrinkRecipe` is a record keyed by `coffee`, `tea`, `water`, `condensed`, `evaporated` and `sugar`. The first five values are **ml of liquid input**; `sugar` is **g of separately added sugar**. The reusable empty recipe has six zeros. The opening state is now **Original latte**, not an automatic Kopi preset pour.

`addIngredient` returns a new recipe without mutating its input. Negative or non-finite requests add nothing. Valid liquid additions are clipped to the remaining 300 ml ledger capacity; sugar additions are clipped separately at 30 g. Earlier additions are never displaced to make room. The ledger does not estimate dissolution-related volume changes, density, evaporation or cup headspace.

The composition bar includes liquids only. The current ingredient controls add 5 ml per liquid dose or 2 g per sugar dose; a held control requests further doses. Only additions accepted by the renderer are committed to the UI ledger. Presets use the same addition and clamping path.

## Original finished opening

The first ready frame restores the finished artwork from **Befrothed saved version 5 / v0.2.2**, commit `51981b8219deb042539a458d4ef2bbd819c7b8d9`. It is immediately available for stirring. Its UI identity is **Original latte**, with the ticket labelled **Illustrative starting mix**.

The editable starting ledger is **coffee 140 ml, condensed milk 20 ml, water 20 ml, tea 0 ml, evaporated milk 0 ml and separate sugar 0 g**: 180 ml liquid in total. It reuses the authored Kopi quantities as a convenient model assignment; it is **not a recipe inferred from the image**, evidence of the original beverage's ingredients, or a standard latte recipe. The artwork itself is synthetic photographic-style imagery.

The original presentation intentionally shows the full finished surface independently of this 180 ml ledger. New cups use visible fill derived from the ledger. This distinction preserves the inherited image without claiming its pictured geometry measures a physical drink.

## Illustrative presets

The four selectable cultural presets are unchanged. Every preset starts with 140 ml of its coffee or tea base. The arrows below specify pour order, not a traditional preparation requirement.

| Preset | Sequence | Liquid total | Separate sugar |
| --- | --- | --- | --- |
| Kopi-O | Coffee 140 ml → water 40 ml → sugar 8 g | 180 ml | 8 g |
| Kopi | Coffee 140 ml → condensed milk 20 ml → water 20 ml | 180 ml | 0 g |
| Kopi-C | Coffee 140 ml → evaporated milk 20 ml → water 20 ml → sugar 8 g | 180 ml | 8 g |
| Teh | Tea 140 ml → condensed milk 20 ml → water 20 ml | 180 ml | 0 g |

These are authored proportions for the prototype. They are not measured stall recipes, national standards or claims about an ideal cup. The brewed base is an input; extraction strength is not modelled.

## Naming and cultural references

For a coffee-only base the prefix is Kopi; for a tea-only base it is Teh. Without milk, the suffix is O, followed by Kosong when no separate sugar is present. Evaporated milk uses C, followed by Kosong when no separate sugar is present. Condensed milk uses the unmodified Kopi/Teh name and is never labelled Kosong. Mixed coffee and tea, or both milk types together, are named **Your blend**. Adding water alone does not assign Po/Gau or any other strength label.

These ingredient-family conventions are grounded in [Mount Alvernia Hospital's Know Your Kopi](https://mtalvernia.sg/education/know-your-kopi/) and [HealthHub's coffee/tea ordering table](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/i-love-coffee-i-love-tea). Sources describe common orders, not a universal proportion system. Their descriptions of separate sugar in condensed-milk drinks vary; this prototype reports the actual ingredients added rather than assuming a fixed extra sugar amount.

Condensed milk is **sweetened milk**. Zero on the separate-sugar control does not mean a sugar-free drink. Milk can contain sugars independently of this control. No total-sugar, calorie, caffeine or perceived-sweetness estimate is calculated.

## State and rendering

Selecting Empty cup, a preset or Original latte is an explicit user action. The existing surface drains before the target state is applied. Presets rebuild through accepted ingredient additions; Original latte restores the inherited artwork and illustrative original ledger. Stale or cancelled transitions do not apply a previously selected target over a newer choice.

Normal draining takes 480ms; `prefers-reduced-motion: reduce` shortens it to **100ms**. Returning to Original latte uses a 400ms rise, shortened to **100ms** with reduced motion. First startup restores the finished surface directly. A hidden document or already empty cup may skip draining. Ingredient controls and surface input are constrained while preparing. These timed visual transitions are not a simulation of a real cup emptying.

The renderer tracks displayed volume separately from accepted ledger quantities to ease visual rise/drain. New-cup fill is based on displayed liquid volume divided by the 300 ml capacity. The compositor reveals a shaded ceramic well and recessed pool as fill falls, with local milk/pigment layers and an edge treatment. The empty ceramic well does not respond as stirrable liquid. These visual depth cues are authored approximations, not measured vessel geometry or physically separated ingredient strata.

Undo restores the preceding recipe by draining and rebuilding a saved ledger. It does not restore the prior swirl or freehand design. An original-state snapshot restores the original artwork, rather than the previously disturbed version of that artwork. A held pour can contain several accepted additions, so undo reverses the latest accepted addition. The in-page history retains up to 200 snapshots.

Serving preserves the recipe, ends pouring/drawing and prevents further editing until **Keep mixing**. **Make another** selects Empty cup. Focus mode changes layout and supplies the same ingredient controls; it does not create a separate recipe.

## Froth shaping

**Heart**, **Rosetta** and **Draw your own** operate on the surface appearance of milk already present. Either condensed or evaporated milk must have a positive amount; liquid must be present and the engine ready. UI controls are disabled during preparation or serving. Freehand drawing is an explicit mode with a crosshair cursor and **Back to stirring** control. Pointer strokes shape the milk; keyboard surface actions also route to shaping in this mode.

Froth shaping does **not** call ingredient addition, change the recipe ledger, consume capacity or add ml/g. It is a bounded artistic manipulation of pigment/foam textures, not evidence of additional milk or a physically conserved foam structure. Returning to stirring lets the design be disturbed again. Serving, cup replacement and closing the tools end drawing mode.

## Model limitations

The renderer inherits Befrothed's visual flow and adds ingredient-specific material colours, disturbances and visible fill treatment. Sugar contributes separate recorded mass and a disturbance, not liquid volume or a white milk pigment. Water does not become a cream-coloured pigment. Colour, viscosity, depth, layers and froth geometry are authored visual approximations. Temperature, extraction, molecular mixing, foam chemistry, density, brand composition and sensory outcomes are outside scope.

Root's scoped browser checks exercised native dragging on the original surface and inspected the new pool depth. Final integrated QA is still in progress; this document does not certify all froth interactions, reduced-motion behaviour or native-device performance.

The source baseline is Befrothed saved version 5 / v0.2.2, commit `51981b8219deb042539a458d4ef2bbd819c7b8d9`; see [fork provenance](../FORK-PROVENANCE.md). This document describes implementation and limitations, not deployment status or a completed device-validation claim.
