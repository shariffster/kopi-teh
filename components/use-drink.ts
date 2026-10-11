'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { LatteScene } from '@/lib/beverage/scene';
import {
  addIngredient,
  DRINK_PRESETS,
  EMPTY_RECIPE,
  totalLiquidMl,
  type DrinkRecipe,
  type IngredientAddition,
  type IngredientKind,
} from '@/lib/drink-recipe';

type Snapshot = { recipe: DrinkRecipe; preset: string | null };
type DevContext = Parameters<
  typeof import('@/lib/beverage/dev-probe').registerProbe
>[0];
const recipeSequence = (recipe: DrinkRecipe): IngredientAddition[] =>
  (['coffee', 'tea', 'condensed', 'evaporated', 'water', 'sugar'] as const)
    .filter((kind) => recipe[kind] > 0)
    .map((kind) => ({ kind, amount: recipe[kind] }));

export function useDrink(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  photoRef: RefObject<HTMLImageElement | null>,
) {
  const scene = useRef<LatteScene | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [recipe, setRecipe] = useState<DrinkRecipe>({ ...EMPTY_RECIPE });
  const [selectedPreset, setSelectedPreset] = useState<string | null>('kopi');
  const [served, setServed] = useState(false);
  const [pouring, setPouring] = useState<IngredientKind | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [generation, setGeneration] = useState(0);
  const readyRef = useRef(false);
  const recipeRef = useRef<DrinkRecipe>({ ...EMPTY_RECIPE });
  const presetRef = useRef<string | null>('kopi');
  const servedRef = useRef(false);
  const preparingRef = useRef(false);
  const started = useRef(false);
  const history = useRef<Snapshot[]>([]);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const publishRecipe = useCallback((next: DrinkRecipe) => {
    recipeRef.current = next;
    setRecipe(next);
  }, []);
  const publishPreset = useCallback((id: string | null) => {
    presetRef.current = id;
    setSelectedPreset(id);
  }, []);
  const unserve = useCallback(() => {
    servedRef.current = false;
    setServed(false);
  }, []);
  const stopPour = useCallback(() => {
    if (holdTimer.current !== null) clearInterval(holdTimer.current);
    holdTimer.current = null;
    if (!preparingRef.current) setPouring(null);
  }, []);
  const cancelPreparation = useCallback(() => {
    if (sequenceTimer.current !== null) clearInterval(sequenceTimer.current);
    sequenceTimer.current = null;
    preparingRef.current = false;
    setPreparing(false);
    setPouring(null);
  }, []);
  const remember = useCallback(() => {
    history.current.push({
      recipe: { ...recipeRef.current },
      preset: presetRef.current,
    });
    if (history.current.length > 200) history.current.shift();
    setCanUndo(true);
  }, []);

  // Preset and undo animations use the same ledger and clamping as hand pours.
  // Wait for the actual engine stream to end so slow devices cannot build a queue.
  const applySequence = useCallback(
    (sequence: readonly IngredientAddition[]) => {
      preparingRef.current = true;
      setPreparing(true);
      let index = 0;
      const advance = () => {
        if (!readyRef.current || !scene.current) return;
        if (scene.current.diagnostics().drink.pouring) return;
        const dose = sequence[index++];
        if (!dose) {
          if (sequenceTimer.current !== null)
            clearInterval(sequenceTimer.current);
          sequenceTimer.current = null;
          preparingRef.current = false;
          setPreparing(false);
          setPouring(null);
          return;
        }
        const next = addIngredient(recipeRef.current, dose.kind, dose.amount);
        const accepted = next[dose.kind] - recipeRef.current[dose.kind];
        if (accepted > 0 && scene.current.pourIngredient(dose.kind, accepted)) {
          publishRecipe(next);
          setPouring(dose.kind);
        }
      };
      sequenceTimer.current = setInterval(advance, 40);
      advance();
    },
    [publishRecipe],
  );

  const add = useCallback(
    (kind: IngredientKind, amount: number): boolean => {
      if (
        !readyRef.current ||
        preparingRef.current ||
        servedRef.current ||
        !scene.current
      )
        return false;
      const next = addIngredient(recipeRef.current, kind, amount);
      const accepted = next[kind] - recipeRef.current[kind];
      if (accepted <= 0 || !scene.current.pourIngredient(kind, accepted))
        return false;
      remember();
      publishRecipe(next);
      publishPreset(null);
      return true;
    },
    [publishPreset, publishRecipe, remember],
  );

  const startPour = useCallback(
    (kind: IngredientKind) => {
      stopPour();
      const amount = kind === 'sugar' ? 2 : 5;
      if (!add(kind, amount)) return;
      setPouring(kind);
      holdTimer.current = setInterval(() => {
        if (!add(kind, amount)) stopPour();
      }, 250);
    },
    [add, stopPour],
  );

  const choosePreset = useCallback(
    (id: string): boolean => {
      if (!readyRef.current || !scene.current) return false;
      const preset = DRINK_PRESETS.find((item) => item.id === id);
      if (id !== 'empty' && !preset) return false;
      if (!scene.current.resetDrink('empty')) return false;
      remember();
      stopPour();
      cancelPreparation();
      unserve();
      publishRecipe({ ...EMPTY_RECIPE });
      publishPreset(id);
      if (preset) applySequence(preset.sequence);
      return true;
    },
    [
      applySequence,
      cancelPreparation,
      publishPreset,
      publishRecipe,
      remember,
      stopPour,
      unserve,
    ],
  );

  const undo = useCallback((): boolean => {
    const previous = history.current.at(-1);
    if (
      !readyRef.current ||
      !scene.current ||
      !previous ||
      !scene.current.resetDrink('empty')
    )
      return false;
    history.current.pop();
    setCanUndo(history.current.length > 0);
    stopPour();
    cancelPreparation();
    unserve();
    publishRecipe({ ...EMPTY_RECIPE });
    publishPreset(previous.preset);
    applySequence(recipeSequence(previous.recipe));
    return true;
  }, [
    applySequence,
    cancelPreparation,
    publishPreset,
    publishRecipe,
    stopPour,
    unserve,
  ]);

  const serve = useCallback((): boolean => {
    if (
      !readyRef.current ||
      preparingRef.current ||
      !totalLiquidMl(recipeRef.current)
    )
      return false;
    stopPour();
    servedRef.current = true;
    setServed(true);
    return true;
  }, [stopPour]);
  const retry = useCallback(() => {
    stopPour();
    cancelPreparation();
    readyRef.current = false;
    setReady(false);
    setError('');
    setGeneration((value) => value + 1);
  }, [cancelPreparation, stopPour]);

  useEffect(() => {
    if (!canvasRef.current || !photoRef.current) return;
    let disposed = false;
    const lifecycle = new AbortController();
    readyRef.current = false;
    setReady(false);
    const engine = new LatteScene(canvasRef.current, photoRef.current, {
      onInteract: () => {},
      onError: (message) => {
        if (disposed) return;
        readyRef.current = false;
        setReady(false);
        stopPour();
        cancelPreparation();
        setError(message);
      },
      onReset: (base) => {
        stopPour();
        cancelPreparation();
        remember();
        unserve();
        publishRecipe(
          base === 'empty'
            ? { ...EMPTY_RECIPE }
            : { ...EMPTY_RECIPE, [base]: 140 },
        );
        publishPreset(base === 'empty' ? 'empty' : null);
      },
    });
    scene.current = engine;
    void engine
      .start()
      .then(() => {
        if (disposed) return;
        readyRef.current = true;
        setReady(true);
        setError('');
        const firstStart = !started.current;
        started.current = true;
        const previous = { ...recipeRef.current };
        engine.resetDrink('empty');
        publishRecipe({ ...EMPTY_RECIPE });
        if (firstStart) {
          publishPreset('kopi');
          applySequence(
            DRINK_PRESETS.find((item) => item.id === 'kopi')!.sequence,
          );
        } else {
          applySequence(recipeSequence(previous));
        }
        const modelContext = (
          document as Document & { modelContext?: DevContext }
        ).modelContext;
        if (process.env.NODE_ENV === 'development' && modelContext) {
          void import('@/lib/beverage/dev-probe')
            .then(({ registerProbe }) => {
              if (disposed || lifecycle.signal.aborted) return;
              registerProbe(
                modelContext,
                canvasRef.current!,
                engine,
                lifecycle.signal,
              );
              return modelContext.registerTool(
                {
                  name: 'inspect_drink_recipe',
                  description:
                    'Read the local Kopi/Teh ingredient ledger, engine amounts, and equality checks. Does not alter the cup.',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                    additionalProperties: false,
                  },
                  annotations: {
                    readOnlyHint: true,
                    untrustedContentHint: false,
                  },
                  execute: (input: unknown) => {
                    if (
                      !input ||
                      typeof input !== 'object' ||
                      Array.isArray(input) ||
                      Object.keys(input).length
                    )
                      throw new Error('Expected an empty object.');
                    const diagnostics = engine.diagnostics();
                    const ledger = { ...recipeRef.current };
                    const matches = (
                      Object.keys(EMPTY_RECIPE) as IngredientKind[]
                    ).every(
                      (kind) =>
                        ledger[kind] === diagnostics.drink.amounts[kind],
                    );
                    return {
                      recipe: ledger,
                      selectedPreset: presetRef.current,
                      served: servedRef.current,
                      preparing: preparingRef.current,
                      historyLength: history.current.length,
                      ledgerMatchesEngine: matches,
                      liquidMl: totalLiquidMl(ledger),
                      engine: diagnostics,
                    };
                  },
                },
                { signal: lifecycle.signal },
              );
            })
            .catch(() => {});
        }
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        readyRef.current = false;
        setReady(false);
        setError(
          cause instanceof Error
            ? cause.message
            : 'The cup could not be loaded. Please retry.',
        );
        engine.dispose();
      });
    window.addEventListener('blur', stopPour);
    window.addEventListener('pointerup', stopPour);
    window.addEventListener('pointercancel', stopPour);
    document.addEventListener('visibilitychange', stopPour);
    return () => {
      disposed = true;
      lifecycle.abort();
      readyRef.current = false;
      stopPour();
      cancelPreparation();
      window.removeEventListener('blur', stopPour);
      window.removeEventListener('pointerup', stopPour);
      window.removeEventListener('pointercancel', stopPour);
      document.removeEventListener('visibilitychange', stopPour);
      engine.dispose();
      if (scene.current === engine) scene.current = null;
    };
  }, [
    applySequence,
    cancelPreparation,
    canvasRef,
    generation,
    photoRef,
    publishPreset,
    publishRecipe,
    remember,
    stopPour,
    unserve,
  ]);

  return {
    ready,
    error,
    recipe,
    selectedPreset,
    served,
    pouring,
    preparing,
    canUndo,
    scene,
    add,
    startPour,
    stopPour,
    choosePreset,
    undo,
    serve,
    unserve,
    retry,
  };
}
