"use client";

export default function DualRangeSlider({
  min,
  max,
  step = 1000,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
}) {
  const [low, high] = value;

  const handleLowChange = (next: number) => {
    onChange([Math.min(next, high), high]);
  };

  const handleHighChange = (next: number) => {
    onChange([low, Math.max(next, low)]);
  };

  const lowPercent = ((low - min) / (max - min)) * 100;
  const highPercent = ((high - min) / (max - min)) * 100;

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-marigold-dark"
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(event) => handleLowChange(Number(event.target.value))}
          className="range-thumb pointer-events-none absolute top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
          aria-label="Minimum stipend"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(event) => handleHighChange(Number(event.target.value))}
          className="range-thumb pointer-events-none absolute top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
          aria-label="Maximum stipend"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-medium text-ink-soft">
        <span>₹{low.toLocaleString("en-IN")}</span>
        <span>₹{high.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
