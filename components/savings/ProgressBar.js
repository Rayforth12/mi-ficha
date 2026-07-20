"use client";

export default function ProgressBar({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-2.5 rounded-full bg-[#EFE9DC] overflow-hidden">
      <div
        className="h-full rounded-full bg-green transition-all"
        style={{ width: clamped + "%" }}
      />
    </div>
  );
}
