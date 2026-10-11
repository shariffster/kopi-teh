'use client';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import type { IngredientKind } from '@/lib/drink-recipe';

const colours: Record<IngredientKind, [string, string, string]> = {
  coffee: ['#a86b36', '#382010', '#dfad70'],
  tea: ['#c7843f', '#71300e', '#efd196'],
  water: ['#d4e6df', '#7a9d95', '#ffffff'],
  condensed: ['#f2ddb2', '#cfad73', '#fff9e7'],
  evaporated: ['#ede0c4', '#c6b28e', '#fffdf1'],
  sugar: ['#fff9e9', '#d2c9b6', '#ffffff'],
};

/** A transient source and falling material, registered to the simulation's impact point. */
export function IngredientPour({ kind }: { kind: IngredientKind | null }) {
  const [presentation, setPresentation] = useState({
    current: kind,
    visible: kind,
  });
  const uid = useId().replace(/:/g, '');
  if (presentation.current !== kind) {
    setPresentation({ current: kind, visible: kind ?? presentation.visible });
  }
  useEffect(() => {
    if (kind) return;
    const timer = setTimeout(
      () => setPresentation({ current: null, visible: null }),
      360,
    );
    return () => clearTimeout(timer);
  }, [kind]);
  const shown = presentation.visible;
  const leaving = !kind;
  if (!shown) return null;
  const [body, shade, shine] = colours[shown];
  const sugar = shown === 'sugar';
  const milk = shown === 'condensed' || shown === 'evaporated';
  const id = (name: string) => `${uid}-${name}`;
  return (
    <svg
      className={`ingredient-pour pour-${shown} ${leaving ? 'is-leaving' : 'is-flowing'}`}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ '--stream-colour': body } as CSSProperties}
    >
      <defs>
        <linearGradient id={id('ceramic')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a49a87" />
          <stop offset=".18" stopColor="#e2dac8" />
          <stop offset=".48" stopColor="#fff8e8" />
          <stop offset=".76" stopColor="#d9ceba" />
          <stop offset="1" stopColor="#9c8b70" />
        </linearGradient>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7e827c" />
          <stop offset=".22" stopColor="#f8f5e9" />
          <stop offset=".38" stopColor="#aaa99d" />
          <stop offset=".61" stopColor="#eeeada" />
          <stop offset=".79" stopColor="#7e7b70" />
          <stop offset="1" stopColor="#e9e4d4" />
        </linearGradient>
        <radialGradient id={id('interior')} cx=".4" cy=".25" r=".8">
          <stop offset="0" stopColor={body} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
        <linearGradient id={id('stream')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade} stopOpacity=".55" />
          <stop offset=".4" stopColor={body} />
          <stop offset=".64" stopColor={shine} stopOpacity=".85" />
          <stop offset="1" stopColor={body} stopOpacity=".76" />
        </linearGradient>
        <filter id={id('shadow')} x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow
            dx="9"
            dy="18"
            stdDeviation="12"
            floodColor="#281606"
            floodOpacity=".24"
          />
        </filter>
      </defs>
      {!sugar && (
        <g className="falling-liquid">
          <path
            className="stream-shadow"
            d="M374 203 C394 294 417 365 421 450"
          />
          <path
            className="stream-body"
            d={
              milk
                ? 'M371 201 C388 296 424 355 421 448 L415 450 C410 365 378 302 362 205 Z'
                : 'M371 201 C391 312 416 360 421 449 L417 450 C410 360 381 309 364 204 Z'
            }
            fill={`url(#${id('stream')})`}
          />
          <path
            className="stream-highlight"
            d="M367 206 C387 311 413 365 419 446"
            stroke={shine}
          />
        </g>
      )}
      {sugar ? (
        <>
          <g
            className="pour-source sugar-spoon"
            filter={`url(#${id('shadow')})`}
          >
            <image
              href="/assets/pouring/sugar-spoon-v1.png"
              x="-8.7"
              y="-121.4"
              width="390"
              height="390"
            />
          </g>
          <g className="falling-sugar">
            {Array.from({ length: 34 }, (_, i) => (
              <rect
                key={i}
                className="sugar-grain"
                x="0"
                y="0"
                width={3 + (i % 4)}
                height={3 + ((i * 3) % 4)}
                rx=".7"
                fill={i % 4 ? '#fff9e7' : '#d8cbb1'}
                style={
                  {
                    '--grain-x': `${352 + ((i * 17) % 37)}px`,
                    '--grain-drift': `${39 + ((i * 13) % 24)}px`,
                    '--grain-delay': `${-((i * 37) % 430)}ms`,
                    '--grain-turn': `${i * 43}deg`,
                  } as CSSProperties
                }
              />
            ))}
          </g>
        </>
      ) : (
        <g
          className={`pour-source pouring-jug ${milk ? 'milk-jug' : ''}`}
          filter={`url(#${id('shadow')})`}
        >
          <image
            href="/assets/pouring/pitcher-v1.png"
            x="48.35"
            y="-24.25"
            width="350"
            height="350"
          />
        </g>
      )}
    </svg>
  );
}
