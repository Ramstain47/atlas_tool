import { T } from "../../constants/theme";

export function QBadge({ star, compact }) {
  const q = T.quality[star] || T.quality[1];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 3 : 4,
        padding: compact ? "1px 4px" : "2px 6px",
        borderRadius: 3,
        fontSize: compact ? 9 : 10,
        fontWeight: 600,
        color: q.color,
        background: q.bg,
        border: `1px solid ${q.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: compact ? 5 : 6,
          height: compact ? 5 : 6,
          borderRadius: "50%",
          background: q.color,
          flexShrink: 0,
        }}
      />
      {compact ? q.label : `${q.label}${q.name}`}
    </span>
  );
}
