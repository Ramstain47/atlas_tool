import { T, F } from "../../constants/theme";

export function Inp({ label, value, onChange, mono, placeholder, disabled, type, step }) {
  return (
    <div>
      {label && (
        <label
          style={{
            fontSize: 8,
            color: T.text.muted,
            textTransform: "uppercase",
            letterSpacing: 0.7,
            display: "block",
            marginBottom: 2,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type || "text"}
        step={step}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "4px 5px",
          background: disabled ? T.bg.elevated : T.bg.input,
          border: `1px solid ${T.border.subtle}`,
          borderRadius: 3,
          color: T.text.primary,
          fontSize: 12,
          fontFamily: mono ? F.mono : F.sans,
          outline: "none",
          boxSizing: "border-box",
          textAlign: mono ? "center" : "left",
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}
