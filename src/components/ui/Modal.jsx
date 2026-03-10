import { T } from "../../constants/theme";

export function Modal({ open, onClose, title, children, width }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          background: T.bg.elevated,
          borderRadius: 10,
          border: `1px solid ${T.border.default}`,
          padding: 18,
          width: width || 380,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: T.text.muted,
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
