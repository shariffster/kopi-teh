/** Developer-only tuning. All spatial units are fractions of the liquid diameter. */
export const LATTE_CONFIG = {
  force: 0.24,
  radius: 0.061,
  touchRadius: 0.078,
  maxSpeed: 0.95,
  dissipation: 0.32,
  viscosity: 0.055,
  curl: 9,
  holdVortex: 0.3,
  holdRampSeconds: 1.8,
  rippleStrength: 0.0045,
  rippleSpeed: 0.3,
  rippleDamping: 3.8,
  settling: {
    gentleSeconds: 8,
    vigorousSeconds: 24,
    fadeSeconds: 5,
    curlDecaySeconds: 0.9,
    detailViscosity: 0.05,
  },
  conservationGain: 0.045,
  materialRelief: 0.065,
  mixedContrast: 0.7,
  transportSpeed: 0.64,
  foam: {
    relaxation: 0.42,
    relief: 0.1,
    presence: 0.68,
    contactDepth: 0.24,
    contactFollow: 16,
  },
  // Pigment never recovers the source photograph. Reset seeds the chosen drink.
  pigmentRecovery: 0,
  edgeGuard: 0.018,
  resolution: {
    desktop: { flow: 192, pigment: 1024, foam: 512, pressure: 18, maxDpr: 2 },
    mobile: { flow: 128, pigment: 768, foam: 384, pressure: 12, maxDpr: 2 },
    low: { flow: 96, pigment: 512, foam: 256, pressure: 8, maxDpr: 1.5 },
  },
  frameBudgetMs: 20,
  degradationFrames: 60,
} as const;
export type Quality = keyof typeof LATTE_CONFIG.resolution;
export type Splat = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  spin: number;
  prod: number;
};
/** Active surface constraint, separate from impulses that move the liquid. */
export type SurfaceContact = {
  x: number;
  y: number;
  radius: number;
  directionX: number;
  directionY: number;
};
