# Drink model

Kopi / Teh models a cup as a ledger of ingredients and an illustrative surface. The recorded recipe is the source of truth for quantities and names. Stirring changes the visual surface, not the ingredient totals.

## Units and capacity

`DrinkRecipe` is a record keyed by `coffee`, `tea`, `water`, `condensed`, `evaporated` and `sugar`. The first five values are **ml of liquid input**; `sugar` is **g of separately added sugar**. The initial empty recipe has six zeros.

`addIngredient` returns a new recipe without mutating its input. Negative or non-finite requests add nothing. Valid liquid additions are clipped to the remaining 300 ml ledger capacity; sugar additions are clipped separately at 30 g. Earlier additions are never displaced to make room. The ledger does not estimate dissolution-related volume changes, density, evaporation or cup headspace.

The composition bar includes liquids only. The current ingredient controls add 5 ml per liquid dose or 2 g per sugar dose; a held control requests further doses. Only additions accepted by the renderer are committed to the UI ledger. Presets use the same addition and clamping path.

## Illustrative presets

Every preset starts with 140 ml of its coffee or tea base. The arrows below specify pour order, not a traditional preparation requirement.

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

Preset selection clears the cup and replays its additions. Undo restores the previous composition by clearing and replaying a saved ledger; it does not restore the earlier liquid pattern. A held pour can contain several additions, so undo reverses the latest accepted addition. The in-page history retains up to 200 recipe snapshots.

Serving changes presentation and prevents further ingredient additions until **Keep mixing** is selected. **Make another** selects the empty cup. The focused view changes layout and provides the same ingredient controls in a tray; it does not create a separate recipe.

The renderer inherits Befrothed's visual flow and interaction work and adds ingredient-specific material colours and surface disturbances. Sugar contributes separate mass and disturbance, not liquid volume or a white milk colour. Colour, viscosity and mixing behaviour are authored visual approximations. Temperature, extraction, molecular mixing, brand composition and sensory outcomes are outside scope.

The source baseline is Befrothed saved version 5 / v0.2.2, commit `51981b8219deb042539a458d4ef2bbd819c7b8d9`; see [fork provenance](../FORK-PROVENANCE.md). This document describes implementation and limitations, not deployment status or a completed device-validation claim.
