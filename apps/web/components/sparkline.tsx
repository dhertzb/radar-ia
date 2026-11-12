"use client";
import * as d3 from "d3";
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2)
    return <div className="text-xs text-gray-500">Histórico indisponível</div>;
  const w = 180,
    h = 54,
    x = d3
      .scaleLinear()
      .domain([0, values.length - 1])
      .range([2, w - 2]),
    y = d3
      .scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .nice()
      .range([h - 3, 3]),
    line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(d3.curveMonotoneX);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Evolução dos fechamentos"
      className="w-full h-14"
    >
      <path
        d={line(values) ?? ""}
        fill="none"
        stroke="#1a7352"
        strokeWidth="2.5"
      />
      <circle
        cx={x(values.length - 1)}
        cy={y(values.at(-1)!)}
        r="3.5"
        fill="#df3b2f"
      />
    </svg>
  );
}
