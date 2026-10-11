# Latte assets

`scene.jpg` is the v0.1 synthetic photographic-style scene, generated once with the built-in image_gen tool. It is not a camera photograph, a stock licensed photograph, or a final commissioned asset. The returned original was 1254 × 1254, despite a 2048 × 2048 prompt. This copy is a quality-94 JPEG conversion of that original; no subject retouching was performed.

## Replacement contract

The manifest uses normalized image coordinates with a top-left origin. `liquid.center` locates the beverage; `liquid.radius` gives the x/y radii. This near-overhead image has a slight ellipse. The shader uses the same coordinates to crop its initial pigment, and the compositor leaves a narrow static meniscus.

- Replace `scene.jpg` at its stable path to replace the complete scene.
- Adjust `imageSize`, `liquid.center`, and `liquid.radius` to register another photograph.
- Set `liquid.texture` to a separate square photograph/render of the liquid to replace the coffee, milk pattern and crema without changing the surrounding scene or simulation. It must fill the same normalized liquid domain with a matching edge tone.
- Null foam/crema/microdetail/normal entries describe future optional asset roles. They are not separately loaded in v0.1. Currently the seed's photographed pixels supply these appearances. Merely dropping files into those reserved roles does not activate them.
- Keep cups and scene perspective overhead. V0.1's geometric ellipse is deliberately inset into the observed liquid boundary; a separately authored alpha matte would better accommodate irregular ceramics later.

The loader, simulation, and compositing are independent. A new registered scene or liquid seed needs no simulation rewrite.

## Generation prompt

Use case: photorealistic-natural.
Asset type: premium photographic background for an interactive latte liquid illusion.
Primary request: ONE exceptional photorealistic high-end editorial photograph, 2048x2048 square, exact 90-degree overhead view of a single ivory-white fine ceramic cappuccino/latte cup on a subtle circular matching saucer.
Scene/backdrop: warm neutral matte taupe plaster/limestone tabletop with very restrained grain and ample clean negative space at all edges.
Composition/framing: camera optical axis straight down, no perspective tilt. The circular liquid surface is precisely centered at 50% of image width and 50% of image height, with a diameter approximately 49% of total image width. Cup outer rim is a complete visible perfect circle approximately 55% of image width. Saucer diameter approximately 71% of image width. Cup handle at 3 o'clock. Keep all cup and saucer fully inside the frame.
Subject details: rich amber hazelnut crema with gorgeous intricate naturally poured white rosetta/tulip latte art facing the viewer; fine realistic microfoam and tiny bubbles. The latte art should be beautiful and artisanal, the coffee luscious and believable.
Style/medium: real high-end food/editorial photography, premium tangible ceramic and coffee textures, sharp focus across the whole cup.
Lighting/mood: soft natural morning side light from the upper left, delicate stable shadows extending to the lower right; warm calm restrained elegance.
Constraints: literal photographic scene only. Liquid surface must be circular and exact overhead, precisely centered. No text, UI, logos, watermark, spoons, plants, hands, steam, extra props, illustration, CGI or 3D/plastic look. Generate a single image, no variants or contact sheet.
