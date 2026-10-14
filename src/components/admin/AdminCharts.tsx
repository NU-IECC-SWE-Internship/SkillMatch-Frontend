import type { ReactNode } from "react";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

const TAU = Math.PI * 2;

/** Donut chart with a centred total and a legend underneath. */
export function DonutChart({
  segments,
  centerLabel,
  size = 150,
  thickness = 20,
}: {
  segments: Segment[];
  centerLabel: string;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = TAU * radius;
  let offset = 0;

  return (
    <div className="admin-donut">
      <div className="admin-donut-figure" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel}: ${total}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--sm-tint-strong)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((segment) => {
              if (!segment.value) return null;
              const length = (segment.value / total) * circumference;
              const gap = segments.filter((s) => s.value).length > 1 ? 2 : 0;
              const circle = (
                <circle
                  key={segment.label}
                  className="admin-donut-arc"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(length - gap, 0)} ${circumference}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                >
                  <title>{`${segment.label}: ${segment.value}`}</title>
                </circle>
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="admin-donut-center">
          <strong>{total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <ul className="admin-chart-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className="admin-legend-dot" style={{ background: segment.color }} />
            <span className="admin-legend-label">{segment.label}</span>
            <strong>{segment.value}</strong>
            <span className="admin-legend-pct">
              {total ? `${Math.round((segment.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small progress ring used inside the KPI cards. */
export function RingGauge({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = TAU * radius;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="admin-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--sm-tint-strong)" strokeWidth={stroke} />
        <circle
          className="admin-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="admin-ring-value">{Math.round(pct)}%</span>
    </div>
  );
}

/** Tiny area sparkline for KPI cards. */
export function Sparkline({ values, color, width = 96, height = 40 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const points = values.map((value, index) => [index * step, height - 3 - (value / max) * (height - 6)]);
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg className="admin-sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Vertical column chart with gridlines. */
export function ColumnChart({
  data,
  color = "var(--sm-accent)",
  height = 220,
}: {
  data: { label: string; value: number; tooltip?: string }[];
  color?: string;
  height?: number;
}) {
  const showValues = data.length <= 16;
  const rawMax = Math.max(1, ...data.map((item) => item.value));
  const tick = Math.max(1, Math.ceil(rawMax / 4));
  const max = tick * 4;
  const ticks = [4, 3, 2, 1, 0].map((n) => n * tick);

  return (
    <div className="admin-columns" style={{ height }}>
      <div className="admin-columns-axis">
        {ticks.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
      <div className="admin-columns-plot">
        <div className="admin-columns-grid" aria-hidden="true">
          {ticks.map((value) => (
            <span key={value} />
          ))}
        </div>
        <div className="admin-columns-bars" style={{ gap: data.length > 16 ? 3 : 8 }}>
          {data.map((item, index) => (
            <div key={`${item.label}-${index}`} className="admin-columns-col" title={item.tooltip ?? `${item.label}: ${item.value}`}>
              <div className="admin-columns-track">
                <div
                  className="admin-columns-bar"
                  style={{
                    height: `${(item.value / max) * 100}%`,
                    background: color,
                    animationDelay: `${index * (0.4 / data.length)}s`,
                  }}
                >
                  {showValues && item.value > 0 && <span className="admin-columns-value">{item.value}</span>}
                </div>
              </div>
              <span className="admin-columns-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Paired horizontal bars, e.g. teachers vs learners per skill. */
export function PairedBars({
  rows,
  series,
}: {
  rows: { key: string | number; label: ReactNode; values: [number, number] }[];
  series: [Segment["label"], Segment["label"]];
}) {
  const max = Math.max(1, ...rows.flatMap((row) => row.values));
  const colors = ["var(--sm-primary)", "#93b4f8"];

  return (
    <div className="admin-paired">
      <ul className="admin-chart-legend inline">
        {series.map((label, index) => (
          <li key={label}>
            <span className="admin-legend-dot" style={{ background: colors[index] }} />
            <span className="admin-legend-label">{label}</span>
          </li>
        ))}
      </ul>
      {rows.map((row) => (
        <div key={row.key} className="admin-paired-row">
          <div className="admin-paired-label">{row.label}</div>
          <div className="admin-paired-bars">
            {row.values.map((value, index) => (
              <div key={index} className="admin-paired-line" title={`${series[index]}: ${value}`}>
                <div
                  className="admin-paired-fill"
                  style={{ width: `${(value / max) * 100}%`, background: colors[index] }}
                />
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
