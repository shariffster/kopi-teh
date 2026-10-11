'use client';
import { useId, type CSSProperties } from 'react';
import type { OverflowEvent } from '@/lib/beverage/scene';

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
        const light = `rgb(${rgb.map((c) => Math.round(c * 0.78 + 255 * 0.22)).join(',')})`;
        return (
          <g
            key={spill.id}
            className="spill"
            transform={`translate(500 500) rotate(${(spill.angle * 180) / Math.PI})`}
            style={{ '--spill-colour': colour } as CSSProperties}
          >
            <defs>
              <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={colour} stopOpacity=".68" />
                <stop offset=".28" stopColor={light} />
                <stop offset=".62" stopColor={colour} />
                <stop offset="1" stopColor="#2f1b0e" stopOpacity=".84" />
              </linearGradient>
              <radialGradient id={`${id}-pool`} cx=".4" cy=".34" r=".7">
                <stop offset="0" stopColor={light} stopOpacity=".86" />
                <stop offset=".74" stopColor={colour} stopOpacity=".94" />
                <stop offset="1" stopColor={colour} stopOpacity=".66" />
              </radialGradient>
            </defs>
            <path
              className="spill-shadow"
              d="M485 2 C509 -3 530 5 551 9 C578 16 599 8 625 14"
            />
            <path
              className="spill-run"
              d="M485 0 C509 -5 530 3 551 7 C578 14 599 6 625 12"
              pathLength="1"
              stroke={`url(#${id}-ribbon)`}
            />
            <path
              className="spill-glint"
              d="M493 -3 C515 -5 533 2 550 4 C570 10 591 5 605 8"
              pathLength="1"
            />
            <g className="spill-pool" style={{ transformOrigin: '552px 9px' }}>
              <path
                d="M548 4 C567 8 579 -4 594 -2 C608 2 613 -8 630 -3 C642 -2 650 5 645 14 C641 24 625 18 613 22 C598 27 581 17 567 17 C557 16 553 12 548 10Z"
                fill="#3c2316"
                opacity=".18"
                transform="translate(2 3)"
              />
              <path
                d="M548 4 C567 8 579 -4 594 -2 C608 2 613 -8 630 -3 C642 -2 650 5 645 14 C641 24 625 18 613 22 C598 27 581 17 567 17 C557 16 553 12 548 10Z"
                fill={`url(#${id}-pool)`}
                stroke={colour}
                strokeWidth=".8"
              />
              <path
                d="M610 0 C617 -5 626 -3 630 -2"
                stroke="#fff9e7"
                strokeWidth=".7"
                strokeLinecap="round"
                fill="none"
                opacity=".32"
              />
              <path
                d="M635 26 Q625 31 614 22"
                stroke="#f1ddbc"
                strokeWidth=".8"
                fill="none"
                opacity=".24"
              />
            </g>
            <ellipse
              className="spill-lip"
              cx="489"
              cy="0"
              rx="9"
              ry="12"
              fill={`url(#${id}-pool)`}
            />
          </g>
        );
      })}
    </svg>
  );
}
