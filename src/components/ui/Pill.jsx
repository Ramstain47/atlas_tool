import { T, F } from "../../constants/theme";

export function Pill({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3px 7px",
        background: T.bg.elevated,
        borderRadius: 4,
        border: `1px solid ${T.border.subtle}`,
        minWidth: 46,
      }}
    >
      <span style={{ fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || T.text.primary, fontFamily: F.mono }}>
        {value}
      </span>
    </div>
  );
}
