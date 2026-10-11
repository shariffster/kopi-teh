export interface BeverageAsset {
  id: string;
  scene: string;
  imageSize: [number, number];
  liquid: {
    center: [number, number];
    radius: [number, number];
    texture: string | null;
    foamMask: string | null;
    cremaTexture: string | null;
    microdetailTexture: string | null;
    normalTexture: string | null;
  };
}
export async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  return image;
}
export async function loadAssets() {
  const response = await fetch('/assets/beverages/latte/manifest.json');
  if (!response.ok) throw new Error('The latte could not be loaded.');
  const manifest: BeverageAsset = await response.json();
  const [scene, liquid] = await Promise.all([
    loadImage(manifest.scene),
    manifest.liquid.texture
      ? loadImage(manifest.liquid.texture)
      : Promise.resolve(null),
  ]);
  return { manifest, scene, liquid };
}
