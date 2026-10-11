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
              x="-97.7"
              y="-331.4"
              width="390"
              height="390"
            />
          </g>
          <g className="falling-sugar">
            {Array.from({ length: 56 }, (_, i) => {
              const sourceX = 260 + ((i * 17) % 39);
              const landingX = 408 + ((i * 11) % 25);
              return (
                <rect
                  key={i}
                  className="sugar-grain"
                  x="0"
                  y="0"
                  width={1.8 + ((i * 7) % 11) / 5}
                  height={1.5 + ((i * 3) % 9) / 5}
                  rx=".35"
                  fill={i % 5 ? '#fff9e7' : '#d8cbb1'}
                  stroke={i % 7 === 0 ? '#ffffff' : 'none'}
                  strokeWidth=".65"
                  style={
                    {
                      '--grain-x': `${sourceX}px`,
                      '--grain-arc-x': `${sourceX + 73}px`,
                      '--grain-fall-x': `${sourceX + 118}px`,
                      '--grain-land-x': `${landingX}px`,
                      '--grain-land-y': `${442 + ((i * 7) % 17)}px`,
                      '--grain-delay': `${(i * 17) % 140}ms`,
                      '--grain-time': `${480 + ((i * 13) % 100)}ms`,
                      '--grain-turn': `${i * 43}deg`,
                    } as CSSProperties
                  }
                />
              );
            })}
          </g>
          <g className="sugar-impact" fill="#fff9e7">
            {Array.from({ length: 6 }, (_, i) => (
              <circle
                key={i}
                cx={414 + ((i * 5) % 13)}
                cy={447 + ((i * 3) % 7)}
                r={0.8 + (i % 2) * 0.4}
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
