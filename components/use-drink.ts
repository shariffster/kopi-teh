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
  recipeFromPreset,
  type DrinkRecipe,
  type IngredientAddition,
  type IngredientKind,
} from '@/lib/drink-recipe';

type Snapshot = { recipe: DrinkRecipe; preset: string | null };
// The inherited latte is artwork. Its editable amounts are an illustrative starting recipe.
const ORIGINAL_RECIPE = recipeFromPreset(
  DRINK_PRESETS.find((p) => p.id === 'kopi')!,
);
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
  const [recipe, setRecipe] = useState<DrinkRecipe>({ ...ORIGINAL_RECIPE });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    'original',
  );
  const [served, setServed] = useState(false);
  const [pouring, setPouring] = useState<IngredientKind | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [draining, setDraining] = useState(false);
  const [drawingFroth, setDrawingFroth] = useState(false);
  const preparationId = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [generation, setGeneration] = useState(0);
  const readyRef = useRef(false);
  const recipeRef = useRef<DrinkRecipe>({ ...ORIGINAL_RECIPE });
  const presetRef = useRef<string | null>('original');
  const servedRef = useRef(false);
  const preparingRef = useRef(false);
  const started = useRef(false);
  const history = useRef<Snapshot[]>([]);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pourReleaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const releaseStream = useCallback(() => {
    if (pourReleaseTimer.current !== null)
      clearInterval(pourReleaseTimer.current);
    const finish = () => {
      if (
        !readyRef.current ||
        !scene.current ||
        !scene.current.diagnostics().drink.pouring
      ) {
        if (pourReleaseTimer.current !== null)
          clearInterval(pourReleaseTimer.current);
        pourReleaseTimer.current = null;
        if (!preparingRef.current) setPouring(null);
      }
    };
    pourReleaseTimer.current = setInterval(finish, 40);
  }, []);
  const stopPour = useCallback(() => {
    if (holdTimer.current !== null) clearInterval(holdTimer.current);
    holdTimer.current = null;
    if (!preparingRef.current) releaseStream();
  }, [releaseStream]);
  const cancelPreparation = useCallback(() => {
    preparationId.current += 1;
    if (pourReleaseTimer.current !== null)
      clearInterval(pourReleaseTimer.current);
    pourReleaseTimer.current = null;
    setDraining(false);
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
      let rejected = 0;
      const advance = () => {
        if (!readyRef.current || !scene.current) return;
        if (scene.current.diagnostics().drink.pouring) return;
        const dose = sequence[index];
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
          index += 1;
          rejected = 0;
          publishRecipe(next);
          setPouring(dose.kind);
        } else if (accepted <= 0) {
          index += 1;
        } else if (++rejected >= 3) {
          if (sequenceTimer.current !== null)
            clearInterval(sequenceTimer.current);
          sequenceTimer.current = null;
          preparingRef.current = false;
          setPreparing(false);
          setPouring(null);
          setError('The pour paused. Reload the cup to continue.');
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
      setPouring(kind);
      releaseStream();
      return true;
    },
    [publishPreset, publishRecipe, releaseStream, remember],
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

  const replaceCup = useCallback(
    (target: Snapshot) => {
      const engine = scene.current;
      if (!readyRef.current || !engine) return false;
      stopPour();
      cancelPreparation();
      unserve();
      engine.setFrothDrawing(false);
      setDrawingFroth(false);
      preparingRef.current = true;
      setPreparing(true);
      setDraining(true);
      const id = preparationId.current;
      void engine.transitionToEmpty().then((completed) => {
        if (
          !completed ||
          id !== preparationId.current ||
          engine !== scene.current ||
          !readyRef.current
        )
          return;
        setDraining(false);
        publishPreset(target.preset);
        if (target.preset === 'original') {
          engine.restoreOriginal(target.recipe, true);
          publishRecipe(target.recipe);
          preparingRef.current = false;
          setPreparing(false);
        } else {
          publishRecipe({ ...EMPTY_RECIPE });
          applySequence(recipeSequence(target.recipe));
        }
      });
      return true;
    },
    [
      applySequence,
      cancelPreparation,
      publishPreset,
      publishRecipe,
      stopPour,
      unserve,
    ],
  );
  const choosePreset = useCallback(
    (id: string): boolean => {
      if (!readyRef.current || !scene.current) return false;
      const preset = DRINK_PRESETS.find((item) => item.id === id);
      if (id !== 'empty' && id !== 'original' && !preset) return false;
      remember();
      return replaceCup({
        recipe:
          id === 'original'
            ? ORIGINAL_RECIPE
            : preset
              ? recipeFromPreset(preset)
              : { ...EMPTY_RECIPE },
        preset: id,
      });
    },
    [remember, replaceCup],
  );
  const undo = useCallback((): boolean => {
    const previous = history.current.at(-1);
    if (
      !readyRef.current ||
      preparingRef.current ||
      !scene.current ||
      !previous
    )
      return false;
    history.current.pop();
    setCanUndo(history.current.length > 0);
    return replaceCup(previous);
  }, [replaceCup]);
  const setFrothDrawing = useCallback(
    (enabled: boolean) => {
      if (
        !scene.current ||
        !readyRef.current ||
        preparingRef.current ||
        servedRef.current
      )
        return;
      if (
        enabled &&
        recipeRef.current.condensed + recipeRef.current.evaporated <= 0
      )
        return;
      stopPour();
      scene.current.setFrothDrawing(enabled);
      setDrawingFroth(enabled);
    },
    [stopPour],
  );
  const designFroth = useCallback(
    (design: 'heart' | 'rosetta') => {
      if (
        !scene.current ||
        !readyRef.current ||
        preparingRef.current ||
        servedRef.current
      )
        return false;
      stopPour();
      scene.current.setFrothDrawing(false);
      setDrawingFroth(false);
      return scene.current.applyFrothDesign(design);
    },
    [stopPour],
  );

  const serve = useCallback((): boolean => {
    if (
      !readyRef.current ||
      preparingRef.current ||
      !totalLiquidMl(recipeRef.current)
    )
      return false;
    stopPour();
    scene.current?.setFrothDrawing(false);
    setDrawingFroth(false);
    servedRef.current = true;
    setServed(true);
    return true;
  }, [stopPour]);
  const retry = useCallback(() => {
    scene.current?.setFrothDrawing(false);
    setDrawingFroth(false);
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
    setDrawingFroth(false);
    readyRef.current = false;
    setReady(false);
    const engine = new LatteScene(canvasRef.current, photoRef.current, {
      onInteract: () => {},
      onError: (message) => {
        if (disposed) return;
        setDrawingFroth(false);
        readyRef.current = false;
        setReady(false);
        stopPour();
        cancelPreparation();
        setError(message);
      },
      onResetRequest: () => {
        choosePreset('empty');
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
        if (firstStart || presetRef.current === 'original') {
          engine.restoreOriginal(ORIGINAL_RECIPE);
          publishRecipe({ ...ORIGINAL_RECIPE });
          publishPreset('original');
        } else {
          engine.resetDrink('empty');
          publishRecipe({ ...EMPTY_RECIPE });
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
    choosePreset,
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
    draining,
    drawingFroth,
    setFrothDrawing,
    designFroth,
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
