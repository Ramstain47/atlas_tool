import { T } from "../../constants/theme";

export function MiniBar({ segments, formatFn }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        height: 5,
        borderRadius: 3,
        overflow: "hidden",
        background: T.bg.input,
        width: "100%",
      }}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{
            width: `${(seg.value / total) * 100}%`,
            background: seg.color,
            transition: "width 0.3s",
          }}
          title={`${seg.label}: ${formatFn ? formatFn(seg.value) : seg.value}`}
        />
      ))}
    </div>
  );
}
