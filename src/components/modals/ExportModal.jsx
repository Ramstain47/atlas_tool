import { Modal } from "../ui/Modal";
import { T, F } from "../../constants/theme";

export function ExportModal({ open, onClose, systems, onExport }) {
  return (
    <Modal open={open} onClose={onClose} title="导出确认" width={460}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {systems
          .filter((s) => s.items.length > 0)
          .map((s) => {
            const sa = new Set();
            s.items.forEach((it) => (it.attrs || []).forEach((a) => sa.add(a)));
            return (
              <div key={s.id} style={{ padding: 8, background: T.bg.input, borderRadius: 5, border: `1px solid ${T.border.subtle}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  {s.name} <span style={{ fontFamily: F.mono, color: T.text.muted, fontSize: 9 }}>({s.code})</span>
                </div>
                <div style={{ fontSize: 9, color: T.text.secondary }}>
                  图鉴: {s.items.length} · 属性: {Array.from(sa).map((a) => s.attrPool.find((x) => x.key === a)?.name || a).join(", ") || "无"}
                </div>
              </div>
            );
          })}
        <div style={{ fontSize: 9, color: T.text.muted }}>导出为 CSV（Excel可直接打开）</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              borderRadius: 5,
              border: `1px solid ${T.border.default}`,
              background: "transparent",
              color: T.text.secondary,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            取消
          </button>
          <button
            onClick={onExport}
            style={{
              padding: "6px 12px",
              borderRadius: 5,
              border: "none",
              background: T.accent.blue,
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            确认导出
          </button>
        </div>
      </div>
    </Modal>
  );
}
