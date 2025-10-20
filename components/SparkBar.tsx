"use client";

type SparkBarProps = { values: number[]; max?: number };

export default function SparkBar({ values, max }: SparkBarProps) {
  const M = max ?? Math.max(1, ...values);
  const h = 40;
  const w = 180;
  const gap = 4;
  const barW = (w - gap * (values.length - 1)) / values.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      {values.map((v, i) => {
        const bh = Math.round((v / M) * (h - 4));
        const x = i * (barW + gap);
        return (
          <rect
            key={i}
            x={x}
            y={h - bh}
            width={barW}
            height={bh}
            rx="3"
            className="fill-neutral-300"
          />
        );
      })}
    </svg>
  );
}