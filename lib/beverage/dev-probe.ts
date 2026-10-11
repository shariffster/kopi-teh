/** Development-only browser probe. Bundled out of production; drives real input listeners. */
import type { LatteScene } from './scene';
interface Registry {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
}
export function registerProbe(
  context: Registry,
  canvas: HTMLCanvasElement,
  scene: LatteScene,
  signal: AbortSignal,
) {
  if (signal.aborted) return;
  void context.registerTool(
    {
      name: 'inspect_latte_development',
      description:
        'Read local development simulation diagnostics. Does not alter the beverage.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        ...scene.diagnostics(),
        field: scene.inspectForTest(),
      }),
    },
    { signal },
  );
  void context.registerTool(
    {
      name: 'exercise_latte_input',
      description:
        'Development-only input verification. Dispatch a timed synthetic mouse or touch gesture through the actual Pointer Events listeners; captures are still verified with native dragging separately.',
      inputSchema: {
        type: 'object',
        properties: {
          gesture: {
            type: 'string',
            enum: [
              'gentle',
              'fast',
              'stir',
              'hold',
              'tap',
              'degrade',
              'context_loss',
              'mask_fault',
              'mask_restore',
            ],
          },
          pointerType: { type: 'string', enum: ['mouse', 'touch'] },
          repetitions: { type: 'integer', minimum: 1, maximum: 6 },
        },
        required: ['gesture', 'pointerType'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (raw: unknown) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
          throw new Error('Expected a gesture.');
        const p = raw as Record<string, unknown>;
        if (
          Object.keys(p).some(
            (k) => !['gesture', 'pointerType', 'repetitions'].includes(k),
          )
        )
          throw new Error('Unknown option.');
        if (
          ![
            'gentle',
            'fast',
            'stir',
            'hold',
            'tap',
            'degrade',
            'context_loss',
            'mask_fault',
            'mask_restore',
          ].includes(String(p.gesture)) ||
          !['mouse', 'touch'].includes(String(p.pointerType))
        )
          throw new Error('Unsupported gesture or pointer.');
        const repetitions =
          p.repetitions === undefined ? 1 : Number(p.repetitions);
        if (
          !Number.isInteger(repetitions) ||
          repetitions < 1 ||
          repetitions > 6
        )
          throw new Error('Repetitions must be 1–6.');
        if (!scene.diagnostics().ready) throw new Error('Latte not ready.');
        if (p.gesture === 'mask_fault' || p.gesture === 'mask_restore') {
          scene.maskForTest(p.gesture === 'mask_fault');
          return {
            ...scene.diagnostics(),
            maskTest: p.gesture === 'mask_fault',
          };
        }
        if (p.gesture === 'context_loss') {
          const extension = canvas
            .getContext('webgl2')
            ?.getExtension('WEBGL_lose_context');
          if (!extension) throw new Error('Context-loss probe unavailable.');
          extension.loseContext();
          await new Promise((resolve) => setTimeout(resolve, 80));
          return scene.diagnostics();
        }
        if (p.gesture === 'degrade') {
          scene.degradeForTest();
          return scene.diagnostics();
        }
        const r = canvas.getBoundingClientRect();
        const fire = (type: string, x: number, y: number) => {
          if (signal.aborted) throw new Error('Probe canceled.');
          canvas.dispatchEvent(
            new PointerEvent(type, {
              pointerId: 99,
              pointerType: String(p.pointerType),
              isPrimary: true,
              bubbles: true,
              cancelable: true,
              button: 0,
              buttons: type === 'pointerup' ? 0 : 1,
              clientX: r.left + r.width * x,
              clientY: r.top + r.height * y,
              pressure: 0.5,
            }),
          );
        };
        const pause = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms));
        for (let run = 0; run < repetitions; run++) {
          if (p.gesture === 'tap' || p.gesture === 'hold') {
            fire('pointerdown', 0.51, 0.46);
            await pause(p.gesture === 'hold' ? 2800 : 65);
            fire('pointerup', 0.51, 0.46);
          } else {
            const stir = p.gesture === 'stir',
              steps = stir ? 100 : p.gesture === 'gentle' ? 90 : 12;
            const point = (i: number) =>
              stir
                ? {
                    x: 0.5 + Math.cos((i / steps) * Math.PI * 4) * 0.22,
                    y: 0.5 + Math.sin((i / steps) * Math.PI * 4) * 0.22,
                  }
                : { x: 0.34 + (i / steps) * 0.3, y: 0.43 + (i / steps) * 0.1 };
            let v = point(0);
            fire('pointerdown', v.x, v.y);
            for (let i = 1; i <= steps; i++) {
              await pause(p.gesture === 'fast' ? 8 : 16);
              v = point(i);
              fire('pointermove', v.x, v.y);
            }
            fire('pointerup', v.x, v.y);
          }
          await pause(50);
        }
        return {
          ...scene.diagnostics(),
          syntheticPointerType: p.pointerType,
          gesture: p.gesture,
        };
      },
    },
    { signal },
  );
}
