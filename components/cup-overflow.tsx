'use client';
import { useId, type CSSProperties } from 'react';
import type { OverflowEvent } from '@/lib/beverage/scene';

// A thin wet footprint can cover more saucer than the brief, deeper run feeding it.
const poolOutline =
  'M568 10 C588 3 598 -13 618 -16 C636 -20 646 -31 668 -26 C681 -23 690 -29 703 -19 C715 -10 708 0 718 10 C727 22 712 36 698 35 C680 36 676 48 655 45 C634 42 627 49 610 37 C594 27 581 31 568 20Z';

export function CupOverflow({ spills }: { spills: OverflowEvent[] }) {
  const uid = useId().replace(/:/g, '');
  if (!spills.length) return null;
  return (
    <svg
      className="cup-overflow"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {spills.map((spill) => {
        const id = `${uid}-${spill.id}`;
        const rgb = spill.color.map((c) =>
          Math.round(Math.max(0, Math.min(1, c)) * 255),
        );
        const colour = `rgb(${rgb.join(',')})`;
        const light = `rgb(${rgb.map((c) => Math.round(c * 0.82 + 255 * 0.18)).join(',')})`;
        // Only the lateral wet footprint varies with volume; the rim stays registered.
        const width = Math.max(
          0.65,
          Math.min(1.2, Math.sqrt(spill.amountMl / 8)),
        );
        return (
          <g
            key={spill.id}
            className="spill"
            transform={`translate(500 500) rotate(${(spill.angle * 180) / Math.PI})`}
            style={{ '--spill-colour': colour } as CSSProperties}
          >
            <defs>
              <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={colour} stopOpacity=".8" />
                <stop offset=".25" stopColor={light} />
                <stop offset=".66" stopColor={colour} />
                <stop offset="1" stopColor={colour} stopOpacity=".65" />
              </linearGradient>
              <radialGradient id={`${id}-pool`} cx=".32" cy=".45" r=".75">
                <stop offset="0" stopColor={colour} stopOpacity=".93" />
                <stop offset=".6" stopColor={light} stopOpacity=".82" />
                <stop offset=".92" stopColor={colour} stopOpacity=".64" />
                <stop offset="1" stopColor={colour} stopOpacity=".4" />
              </radialGradient>
            </defs>
            <g transform={`scale(1 ${width})`}>
              <path
                className="spill-shadow"
                d="M486 4 C512 -3 537 10 555 18 C582 31 606 17 635 20"
              />
              <path
                className="spill-run"
                d="M484 0 C510 -7 536 6 554 14 C581 27 605 13 635 16"
                pathLength="1"
                stroke={`url(#${id}-ribbon)`}
              />
              <path
                className="spill-lip"
                d="M480 -13 C494 -17 508 -15 521 -7 C534 0 546 1 558 6 L558 18 C542 22 526 10 514 10 C501 11 489 15 480 10Z"
                fill={`url(#${id}-ribbon)`}
                style={{ transformOrigin: '480px 0px' }}
              />
              <path
                className="spill-glint"
                d="M490 -7 C514 -10 535 3 551 8 C572 19 593 13 613 12"
                pathLength="1"
              />
              <g
                className="spill-pool"
                style={{ transformOrigin: '568px 16px' }}
              >
                <path
                  d={poolOutline}
                  fill="#3c2316"
                  opacity=".12"
                  transform="translate(1 3)"
                />
                <path
                  d={poolOutline}
                  fill={`url(#${id}-pool)`}
                  stroke={colour}
                  strokeOpacity=".48"
                  strokeWidth="1.2"
                />
                <path
                  d="M628 -13 C642 -17 653 -24 667 -20 M682 34 C693 29 700 33 708 23"
                  stroke="#fff9e7"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity=".4"
                />
                <path
                  d="M608 32 C626 44 638 37 653 41"
                  stroke={colour}
                  strokeWidth="1.7"
                  fill="none"
                  opacity=".3"
                />
              </g>
              <g
                className="spill-beads"
                fill={colour}
                style={{ transformOrigin: '600px 10px' }}
              >
                <ellipse cx="690" cy="-39" rx="5" ry="3" opacity=".68" />
                <ellipse cx="726" cy="31" rx="3.5" ry="2.6" opacity=".52" />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
