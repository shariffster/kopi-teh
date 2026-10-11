---
name: Kopi / Teh
description: A photographic mixing table for a personally assembled kopitiam cup.
colors:
  stone: "#ccbaa3"
  stone-light: "#dacbb6"
  foreground: "#3b3027"
  paper: "#f8f4e9ed"
  dock: "#f3ecdfeb"
  action: "#473022"
  action-hover: "#65432d"
  action-text: "#fbf5e8"
  focus: "#6a472e"
  froth-panel: "#f4ecdedb"
  froth-ink: "#493526"
  froth-active: "#221b16"
  coffee: "#402b20"
  tea: "#a45529"
  water: "#cfddd9"
  condensed: "#efdcae"
  evaporated: "#d7c5a1"
  sugar: "#eee9db"
typography:
  display:
    fontFamily: "Georgia, serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-1.5px"
  wordmark:
    fontFamily: "Georgia, serif"
    fontSize: "29px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-1.2px"
  title:
    fontFamily: "Georgia, serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.8px"
  body:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "12px"
    lineHeight: 1.5
  label:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "10px"
rounded:
  flat: "0px"
  swatch: "4px"
  liquid: "50%"
spacing:
  small: "8px"
  control: "12px"
  mobile-edge: "18px"
  medium: "20px"
  large: "24px"
  desktop-edge: "36px"
components:
  serve-button:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-text}"
    rounded: "{rounded.flat}"
    padding: "0 13px"
    height: "45px"
    width: "100%"
  serve-button-hover:
    backgroundColor: "{colors.action-hover}"
  recipe-ticket:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.flat}"
    padding: "20px 19px 12px"
    width: "223px"
  froth-options:
    backgroundColor: "{colors.froth-panel}"
    textColor: "{colors.froth-ink}"
    rounded: "{rounded.swatch}"
    padding: "8px 16px"
  preset-dock:
    backgroundColor: "{colors.dock}"
    padding: "0 36px"
    height: "158px"
---

# Design System: Kopi / Teh

## Overview

**Creative North Star: "The photographic mixing table"**

The approved MagicPath A composition places a dominant ivory cup between an ingredient shelf and a paper recipe receipt, with familiar drinks along the bottom. It retains Befrothed's warm stone, photographic texture, quiet serif and tactile liquid. Interface elements are compact and secondary to the cup; they now make the pouring, recipe and serving actions explicit.

The user-requested focus mode removes the mixing table while retaining the same cup and recipe. A small toolbar can reveal ingredients, serve, or resume mixing. This document records **0.2.0 — 11 October 2026**, implemented in local source on 11 October 2026; final QA and packaging remain in progress. It does not establish deployment or device acceptance. The reviewed desktop and mobile captures show the cup composition. Refreshed mobile captures also confirm the visible About action, open cultural-notes dialog and three-column ingredient tray. Those prior screenshots establish the surrounding layout, not the latest froth/depth implementation or native-device performance. Root has since exercised native browser dragging on the restored original surface and inspected the new recessed pool; these are scoped checks, not final acceptance.

**Key Characteristics:**
- Original finished Befrothed surface ready to stir, framed by photographic ceramic and stone.
- Deliberate cup replacement, visible rise/drain and artistic depth/layer cues.
- Editorial serif headings paired with small, quiet sans-serif controls.
- A flat paper receipt and horizontal recipe carousel around one dominant cup.
- Optional cup-only focus with a compact ingredient tray.

## Colors

Warm mineral neutrals support brown coffee and amber tea. The palette is deliberately close to the inherited photograph; ingredient accents communicate material identity.

### Primary

The action brown identifies the serve control; its lighter hover shade provides feedback. Coffee and tea are both ingredient swatches and inputs to the illustrative beverage colour model.

### Secondary

Water, condensed milk, evaporated milk and sugar each retain their ingredient colour across shelf swatches, receipt dots and composition bars. Sugar has a ledger entry in grams and is excluded from the liquid composition bar.

### Neutral

Stone and stone-light form the radial page background. Translucent paper and dock surfaces sit over the photograph without enclosing every control in a card. Foreground brown replaces hard black. The focus colour marks keyboard access.

**The Ingredient Identity Rule.** Keep each ingredient's colour consistent across controls, receipt and recipe previews. Resulting liquid colours are artistic mixtures, not calibrated beverage measurements.

## Typography

Georgia supplies the wordmark, main invitation, receipt title and preset names; Helvetica Neue, Helvetica and Arial supply controls and supporting text. Italic emphasis adds warmth without introducing another font.

The normative desktop roles are in the frontmatter. Preset names use Georgia at 24px/1.1 with -0.7px tracking. The modal heading uses 34px/1.1 with -1px tracking. Supporting interface sizes range from 8–12px; modal body copy is 13px/1.6. Receipt quantities use tabular numerals. At 760px and below the wordmark becomes 25px, the invitation 31px and receipt title 25px; the narrowest labels reach 8px. These small sizes are an observed implementation constraint, not a general accessibility endorsement.

## Layout

Desktop uses a 100svh stage with a 680px minimum height. The masthead has 26px vertical and 36px horizontal padding. The ingredient shelf is 190px wide at the left edge; the receipt is 223px wide at the right. The worktable reserves 158px for the bottom carousel. The scene uses `min(86vw, 116svh)` and aligns its image and liquid window from the same asset manifest.

At 761–1050px, side edges reduce to 24px, shelf to 150px and receipt to 200px. At desktop heights of 800px or less, shelf rows tighten to 40px, receipt padding tightens and the invitation becomes 34px. At heights of at least 820px and widths of at least 900px, shelf rows expand to 58px and the dock to 170px.

At 760px and below, the page becomes a scrolling document. A 72px masthead leads a 370px cup region; ingredients and receipt sit in two columns below, using 18px side padding and a 20px gap. The carousel follows them in normal flow and scrolls horizontally. At 380px and below, the cup region reduces to 330px, edges to 14px and gap to 12px. The entire recipe is intentionally below the first phone viewport; this is not a single-screen mobile table.

The new froth tools sit within the cup workspace, separate from the approved left selector and carousel. Their action row sits 48px from the desktop photograph bottom (37px mobile), or 117px in desktop focus mode (136px mobile focus). Buttons use 11px text and a 30px minimum height on desktop, 10px text and a 36px minimum height on mobile. The revealed options panel wraps with 6px vertical / 18px horizontal gaps and a subtle 4px radius.

Focus mode returns to a 100svh stage. The desktop scene grows to `min(128vw, 120svh)`; mobile uses `min(185vw, 105svh)`. The compact toolbar sits 24px above the desktop bottom or 30px on mobile. The mobile ingredient tray is a three-column grid of six ingredients, at viewport width minus 24px. The mobile About label is visible in table mode; cultural notes are hidden while focused.

## Elevation & Depth

Most depth comes from the inherited photograph: ivory rim, handle, saucer, stone texture and directional shadow. Interface surfaces stay flat and square. The receipt has a faint ambient shadow (`0 5px 30px #3b241b08`); serving rotates it 1.5 degrees and increases its shadow (`5px 14px 35px #50302118`). Mobile serving uses a 1-degree rotation. The focus toolbar and ingredient tray use 15px backdrop blur with restrained shadows. The native notes dialog has a dark translucent backdrop with 7px blur.

The new-cup compositor additionally reveals a shaded ceramic well, recessed liquid pool and surface layers as the visible fill changes. These are artistic depth cues; they do not establish physical ingredient stratification. The original finished artwork retains its complete presentation even though its editable ledger is an illustrative 180 ml.

**The Registered Surface Rule.** The photograph and interactive liquid window share the manifest's image coordinates. Never independently scale or reposition the liquid crop.

## Shapes

Paper, receipt, dock and primary action controls have square corners. The small translucent froth-options panel uses a 4px radius, sharing the restrained rounding already used for swatches. Circles belong to the cup, liquid window, miniature cups and receipt ingredient dots. Shelf swatches are narrow rounded strokes (8 × 25px desktop, 6 × 22px mobile). Fine translucent brown rules divide ingredients, receipt lines and presets. Selected presets use a brown bottom rule rather than a surrounding pill.

## Components

### Photographic cup and liquid

The inherited 1254 × 1254 scene is synthetic photographic-style artwork, not a camera photograph. The manifest places the liquid centre at `[0.497, 0.463]` and radii at `[0.218, 0.222]`. Only the inset surface receives WebGL interaction. The initial **Original latte** restores the exact finished surface from Befrothed saved version 5 / v0.2.2, source `51981b8219deb042539a458d4ef2bbd819c7b8d9`, and accepts stirring once ready. It no longer replaces the opening art with an automatically prepared Kopi.

The original ticket identifies an **Illustrative starting mix** of 140 ml coffee, 20 ml condensed milk and 20 ml water. This 180 ml assignment is not inferred from the artwork. Preserve the original's full photographic presentation independently of the model volume. A deliberate Empty cup or preset choice drains the current surface before the new cup fills. New cups show a recessed pool, a visible rise and local ingredient/pigment layers; an empty ceramic well cannot be stirred as liquid.

A stream appears during pours; sugar uses a dotted falling treatment and water reduced opacity. Normal draining is 480ms, shortened to **100ms** with reduced motion. Original-latte restoration rises over 400ms, shortened to 100ms with reduced motion; startup restores directly. Recipe amounts, layers, colour and depth are illustrative, not measured fluid behaviour or chemistry.

### Froth controls

**Shape the froth** reveals Heart, Rosetta and Draw your own. These shape the visual appearance of existing milk; they never add a ledger ingredient or change ml/g. The options require milk and are disabled during preparation or serving. The small translucent panel stays near the cup; active freehand mode uses a crosshair and **Back to stirring** label. Closing the tools, serving or replacing the cup exits drawing mode. **Original latte** is a separate restore action. This is bounded surface play, not a claim about real foam generation or conservation.

### Ingredient controls

Six divided rows support pointer holds and keyboard activation. Hover or pouring adds a translucent cream background and a 6px left inset; active swatches receive a soft ring. Pointer capture and release/cancel/blur handling end holds. Loading, preparation, serving and capacity states disable relevant actions. Liquid capacity is 300ml; separately added sugar caps at 30g. Undo restores a prior recipe through the same renderer pathway.

### Recipe receipt and serve

The receipt labels the initial state Original latte / Illustrative starting mix and explicitly disclaims a recipe inferred from the image. After ordinary ingredient editing or preset selection, it names the current ingredient family. It separates liquid ml from added sugar g and displays all six ledger entries. Serve preserves the assembled recipe, disables stirring and presents Make another / Keep mixing states. Empty cup is an understated underlined action. Errors replace the serve action with Reload cup. These states must remain truthful to the stored ledger.

### Preset carousel

Kopi-O, Kopi, Kopi-C, Teh and Empty cup use photographic miniatures, short descriptions and composition bars. The selected preset carries a bottom rule and Yours label. Desktop items have a 190px minimum width; mobile items use 195px. Scroll snapping, horizontal swiping and arrow controls support overflow. The four cultural recipes and the approved photographic carousel remain unchanged. Preset preparation follows deliberate draining and visibly pours ingredients into the shared cup; Original latte is a separate surface restore control.

### Focus toolbar and tray

Just the cup hides and makes inert the shelf, receipt and carousel without resetting the drink. Show mixing table restores them. The toolbar retains drink name, Ingredients and Serve; a served cup offers Keep mixing. Opening or closing controls ends an active pour. Desktop ingredients form a horizontal row; the mobile tray uses three columns and two rows.

### Cultural notes and focus states

The language of a cup becomes About on mobile and opens a native modal dialog. A close button receives initial focus. Fine rules divide naming definitions. All standard buttons and links use a 2px focus outline with a 4px offset; the canvas uses an inset pale ring. Reduced-motion CSS removes interface transitions/animations and hides pour-stream decoration. The scene also shortens drain and original-return rise to 100ms. This source behaviour is documented without claiming completed reduced-motion or native-device QA.

## Do's and Don'ts

### Do:
- **Do** preserve the exact inherited finished opening, warm stone and shared image/liquid registration.
- **Do** make empty/preset changes deliberate and keep the original artwork separate from the illustrative recipe assignment.
- **Do** keep froth shaping separate from ingredient quantities and preserve the approved selector and carousel.
- **Do** keep ingredient colours and units consistent across the shelf, receipt, carousel and focus tray.
- **Do** preserve the current drink when entering or leaving focus mode.
- **Do** distinguish source evidence, rendered screenshots and native-device testing.

### Don't:
- **Don't** restore the stale Befrothed claim that there is no surrounding interface; this build has an approved mixing table and carousel.
- **Don't** describe synthetic artwork as a camera photograph or illustrative recipes as standard stall ratios.
- **Don't** claim sensory, nutritional, fluid-physics or chemistry accuracy from the visual model.
- **Don't** infer the original photograph's recipe or physical fill from its illustrative 180 ml ledger.
- **Don't** describe G as selected or integrated; its blend-panel choice remains separate and pending.
- **Don't** treat desktop or emulated mobile captures as proof of native phone performance, sustained frame rate or physical touch latency.
