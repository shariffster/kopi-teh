---
name: Kopi / Teh
description: A photographic mixing table for a personally assembled kopitiam cup.
colors:
  stone: "#ccbaa3"
  stone-light: "#dacbb6"
  foreground: "#3b3027"
  dock: "#f3ecdfeb"
  action-ink: "#402c20"
  action-hover: "#eee3d230"
  capacity-track: "#a28c7024"
  blend-secondary: "#735b43"
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
    fontSize: "38px"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-1.1px"
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
  meter: "3px"
  ingredient-dot: "1px"
spacing:
  small: "8px"
  control: "12px"
  mobile-edge: "18px"
  medium: "20px"
  large: "24px"
  desktop-edge: "36px"
components:
  serve-button:
    backgroundColor: "transparent"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.flat}"
    padding: "0"
    height: "45px"
    width: "100%"
  serve-button-hover:
    backgroundColor: "{colors.action-hover}"
  blend-panel:
    backgroundColor: "transparent"
    rounded: "{rounded.flat}"
    padding: "0"
    width: "204px"
  capacity-meter:
    backgroundColor: "{colors.capacity-track}"
    rounded: "{rounded.meter}"
    width: "29px"
    height: "210px"
  froth-options:
    backgroundColor: "{colors.froth-panel}"
    textColor: "{colors.froth-ink}"
    rounded: "{rounded.swatch}"
    padding: "8px 16px"
  preset-dock:
    backgroundColor: "{colors.dock}"
    padding: "0 36px"
    height: "218px"
---

# Design System: Kopi / Teh

## Overview

**Creative North Star: "The photographic mixing table"**

The user-approved **H direction** (13:49 SGT, 11 October 2026) refines the MagicPath A mixing table: a dominant ivory cup sits between the ingredient shelf and a freestanding Your blend readout, with a photographic recipe carousel along the bottom. It retains Befrothed's warm stone, photographic texture, quiet serif and tactile liquid. Interface elements are compact and secondary to the cup; they now make the pouring, recipe and serving actions explicit.

The user-requested focus mode removes surrounding controls while retaining the same cup and recipe. A small toolbar can reveal ingredients, serve or resume mixing. This document records **0.3.0 — Unreleased**, including H source currently being prepared. H is explicitly approved; its final validation and publication are pending. Prior 0.2.0 desktop/mobile and original-surface checks do not certify this new layout. Native-device performance is not established.

**Key Characteristics:**
- Original finished Befrothed surface ready to stir, framed by photographic ceramic and stone.
- Deliberate cup replacement, visible rise/drain and artistic depth/layer cues.
- Editorial serif headings paired with small, quiet sans-serif controls.
- A freestanding blend readout with a fixed-capacity vertical bar.
- Recipe names above larger centred photographic cups, with details below.
- Optional cup-only focus with a compact ingredient tray.

## Colors

Warm mineral neutrals support brown coffee and amber tea. The palette is deliberately close to the inherited photograph; ingredient accents communicate material identity.

### Primary

The serve action uses brown text between fine rules and a faint cream hover wash. It no longer uses a solid brown rectangle. Coffee and tea are both ingredient swatches and inputs to the illustrative beverage colour model.

### Secondary

Water, condensed milk, evaporated milk and sugar each retain their ingredient colour across shelf swatches, blend dots and composition bars. Sugar has a ledger entry in grams and is excluded from the liquid composition bar.

### Neutral

Stone and stone-light form the radial page background. The translucent dock supports the carousel while the blend readout sits directly on the stone without a paper card or shadow. A faint neutral capacity track makes unfilled volume visible. Foreground brown replaces hard black. The focus colour marks keyboard access.

**The Ingredient Identity Rule.** Keep each ingredient's colour consistent across controls, blend readout and recipe previews. Resulting liquid colours are artistic mixtures, not calibrated beverage measurements.

## Typography

Georgia supplies the wordmark, main invitation, receipt title and preset names; Helvetica Neue, Helvetica and Arial supply controls and supporting text. Italic emphasis adds warmth without introducing another font.

The normative desktop roles are in the frontmatter. Your blend uses the title role with italic emphasis; current liquid volume uses Georgia at 32px/1 with -0.8px tracking. Carousel names use Georgia at 23px/1.1; details use 9px sans serif. Ingredient amounts use 14px tabular numerals, units 9px and whole-number shares 10px. The modal heading retains 34px/1.1 with -1px tracking and body 13px/1.6.

At desktop heights of 800px or less, the blend title becomes 33px, amount text 12px and carousel names 21px. At 760px and below, the title is 31px/1.1, total volume 28px, ingredient names 9px, amounts 12px and shares 8px. These compact source sizes are observed design choices, not a general accessibility endorsement.

## Layout

Desktop uses a 100svh stage with a 680px minimum height. The masthead retains 26px vertical / 36px horizontal padding and the ingredient shelf remains 190px wide. H's transparent blend panel is 204px wide at the right, normally 140px from the top. Its 210px-high readout pairs a 29px capacity bar with ingredient amounts using an 18px gap. The worktable reserves 218px for the carousel dock; each stacked preset is 174px high with a minimum width of 165px and a centred 122px cup.

At desktop heights of 800px or less, the blend panel starts at 99px, readout height is 155px, dock height 194px, preset height 150px and miniature cup 104px. At widths 761–1050px, the blend panel is 176px wide with a 22px right edge and 12px readout gap. The inherited cup image retains shared registration with its liquid window.

At 760px and below, the page remains a scrolling document: a 72px masthead, a 370px cup region, then the ingredient shelf and freestanding blend readout in two columns with 18px edges and a 20px gap. The blend bar becomes 22px wide within a 190px-high readout. The carousel stays horizontally scrollable in normal flow, with automatic dock height, 148px-wide / 170px-high choices and 118px cups. At widths of 380px and below, the inherited cup region reduces to 330px, edges to 14px and grid gap to 12px. The complete mobile table continues below the first viewport.

The new froth tools sit within the cup workspace, separate from the approved left selector and carousel. Their action row sits 48px from the desktop photograph bottom (37px mobile), or 117px in desktop focus mode (136px mobile focus). Buttons use 11px text and a 30px minimum height on desktop, 10px text and a 36px minimum height on mobile. The revealed options panel wraps with 6px vertical / 18px horizontal gaps and a subtle 4px radius.

Focus mode returns to a 100svh stage. The desktop scene grows to `min(128vw, 120svh)`; mobile uses `min(185vw, 105svh)`. The compact toolbar sits 24px above the desktop bottom or 30px on mobile. The mobile ingredient tray is a three-column grid of six ingredients, at viewport width minus 24px. The mobile About label is visible in table mode; cultural notes are hidden while focused.

## Elevation & Depth

Most depth comes from the inherited photograph: ivory rim, handle, saucer, stone texture and directional shadow. H removes the paper receipt's background, padding, shadow and served-state rotation. The blend data sits directly on the table; its capacity bar is a flat readout, not a thermometer object. The focus toolbar and ingredient tray retain 15px backdrop blur with restrained shadows; the native notes dialog has a dark translucent backdrop with 7px blur.

The new-cup compositor additionally reveals a shaded ceramic well, recessed liquid pool and surface layers as the visible fill changes. These are artistic depth cues; they do not establish physical ingredient stratification. The original finished artwork retains its complete presentation even though its editable ledger is an illustrative 180 ml.

**The Registered Surface Rule.** The photograph and interactive liquid window share the manifest's image coordinates. Never independently scale or reposition the liquid crop.

## Shapes

The blend readout has no enclosing card. The dock and main action controls retain square forms; the capacity bar uses a restrained 3px radius and ingredient markers 1px. The small translucent froth-options panel uses a 4px radius, sharing the restrained rounding already used for swatches. Circles belong to the cup, liquid window, miniature cups and blend ingredient dots. Shelf swatches are narrow rounded strokes (8 × 25px desktop, 6 × 22px mobile). Fine translucent brown rules divide the ingredient shelf, separate sugar and serve action, and separate preset choices. Selected presets use a brown bottom rule rather than a surrounding pill.

## Components

### Photographic cup and liquid

The inherited 1254 × 1254 scene is synthetic photographic-style artwork, not a camera photograph. The manifest places the liquid centre at `[0.497, 0.463]` and radii at `[0.218, 0.222]`. Only the inset surface receives WebGL interaction. The initial **Original latte** restores the exact finished surface from Befrothed saved version 5 / v0.2.2, source `51981b8219deb042539a458d4ef2bbd819c7b8d9`, and accepts stirring once ready. It no longer replaces the opening art with an automatically prepared Kopi.

The original ticket identifies an **Illustrative starting mix** of 140 ml coffee, 20 ml condensed milk and 20 ml water. This 180 ml assignment is not inferred from the artwork. Preserve the original's full photographic presentation independently of the model volume. A deliberate Empty cup or preset choice drains the current surface before the new cup fills. New cups show a recessed pool, a visible rise and local ingredient/pigment layers; an empty ceramic well cannot be stirred as liquid.

A stream appears during pours; sugar uses a dotted falling treatment and water reduced opacity. Normal draining is 480ms, shortened to **100ms** with reduced motion. Original-latte restoration rises over 400ms, shortened to 100ms with reduced motion; startup restores directly. Recipe amounts, layers, colour and depth are illustrative, not measured fluid behaviour or chemistry.

### Froth controls

**Shape the froth** reveals Heart, Rosetta and Draw your own. These shape the visual appearance of existing milk; they never add a ledger ingredient or change ml/g. The options require milk and are disabled during preparation or serving. The small translucent panel stays near the cup; active freehand mode uses a crosshair and **Back to stirring** label. Closing the tools, serving or replacing the cup exits drawing mode. **Original latte** is a separate restore action. This is bounded surface play, not a claim about real foam generation or conservation.

### Ingredient controls

Six divided rows support pointer holds and keyboard activation. Hover or pouring adds a translucent cream background and a 6px left inset; active swatches receive a soft ring. Pointer capture and release/cancel/blur handling end holds. Loading, preparation, serving and capacity states disable relevant actions. Liquid capacity is 300ml; separately added sugar caps at 30g. Undo restores a prior recipe through the same renderer pathway.

### Your blend readout and serve

A minimal **Your blend.** heading sits above the drink name and current liquid amount **/ 300 ml**. The unboxed vertical capacity meter always uses a **300 ml denominator**: an ingredient's height is its ml divided by 300, and unfilled space stays visible. Beside it, only present liquid ingredients appear with their ml and rounded percentage of the **current total liquid**, not capacity. These are deliberately different measures. Rounding may make displayed shares total 99% or 101%; zero liquid uses an empty-cup message rather than a percentage.

Added sugar is separate below a fine rule and never changes liquid bar height or shares. Original latte retains the Illustrative starting mix note; its 180 ml assignment still makes no inference about the artwork's real recipe. The serve control uses text, transparent background and top/bottom rules, preserving error/reload, serve, Make another and Keep mixing behaviour without card lift or rotation. Bar segments transition in 200ms with `cubic-bezier(0.16, 1, 0.3, 1)`; reduced motion removes that transition.

### Preset carousel

Each choice stacks its **name above a larger centred photographic cup**, followed by the short ingredient description and a small horizontal composition strip. The four cultural recipes and Empty cup are unchanged; selected choices retain the bottom rule and tinted state. The previous side-by-side copy layout and Yours/Try it corner labels no longer describe the source. Horizontal scrolling, snapping and arrow controls remain. Choosing a preset still deliberately drains and prepares the shared cup.

### Focus toolbar and tray

Just the cup hides and makes inert the shelf, receipt and carousel without resetting the drink. Show mixing table restores them. The toolbar retains drink name, Ingredients and Serve; a served cup offers Keep mixing. Opening or closing controls ends an active pour. Desktop ingredients form a horizontal row; the mobile tray uses three columns and two rows.

### Cultural notes and focus states

The language of a cup becomes About on mobile and opens a native modal dialog. A close button receives initial focus. Fine rules divide naming definitions. All standard buttons and links use a 2px focus outline with a 4px offset; the canvas uses an inset pale ring. Reduced-motion CSS removes interface transitions/animations and hides pour-stream decoration. The scene also shortens drain and original-return rise to 100ms. This source behaviour is documented without claiming completed reduced-motion or native-device QA.

## Do's and Don'ts

### Do:
- **Do** preserve the exact inherited finished opening, warm stone and shared image/liquid registration.
- **Do** make empty/preset changes deliberate and keep the original artwork separate from the illustrative recipe assignment.
- **Do** keep froth shaping separate from ingredient quantities and preserve the approved selector.
- **Do** use 300 ml for capacity-bar height and current liquid total for adjacent ingredient shares; keep sugar separate.
- **Do** place carousel names above centred photographic cups and details below, as approved in H.
- **Do** keep ingredient colours and units consistent across the shelf, blend readout, carousel and focus tray.
- **Do** preserve the current drink when entering or leaving focus mode.
- **Do** distinguish source evidence, rendered screenshots and native-device testing.

### Don't:
- **Don't** restore the stale Befrothed claim that there is no surrounding interface; this build has an approved mixing table and carousel.
- **Don't** describe synthetic artwork as a camera photograph or illustrative recipes as standard stall ratios.
- **Don't** claim sensory, nutritional, fluid-physics or chemistry accuracy from the visual model.
- **Don't** infer the original photograph's recipe or physical fill from its illustrative 180 ml ledger.
- **Don't** retain the superseded claim that G selection is pending: H is explicitly approved.
- **Don't** claim v0.3.0 is deployed before exact publication evidence is recorded.
- **Don't** treat desktop or emulated mobile captures as proof of native phone performance, sustained frame rate or physical touch latency.
