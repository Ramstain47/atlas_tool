import { Modal } from "../ui/Modal";
import { T } from "../../constants/theme";

export function SaveManagerModal({ open, onClose, maxSlots, saveSlots, getSlotInfo, onSave }) {
  return (
    <Modal open={open} onClose={onClose} title="💾 存档管理" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 10, color: T.text.secondary, marginBottom: 4 }}>选择存档位置进行保存（最多 {maxSlots} 个栏位）：</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            maxHeight: 400,
            overflow: "auto",
            padding: 4,
          }}
        >
          {Array.from({ length: maxSlots }, (_, i) => {
            const slot = saveSlots[i];
            const info = getSlotInfo(slot);
            const isEmpty = !slot;

            return (
              <div
                key={i}
                onClick={() => {
                  onSave(i);
                  onClose();
                }}
                style={{
                  padding: 10,
                  background: isEmpty ? T.bg.input : `${T.accent.green}08`,
                  borderRadius: 6,
                  border: `1px solid ${isEmpty ? T.border.subtle : T.accent.green + "40"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minHeight: 80,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.accent.green;
                  e.currentTarget.style.background = `${T.accent.green}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isEmpty ? T.border.subtle : T.accent.green + "40";
                  e.currentTarget.style.background = isEmpty ? T.bg.input : `${T.accent.green}08`;
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? T.text.muted : T.accent.green }}>存档 {i + 1}</span>
                  {isEmpty && (
                    <span
                      style={{
                        fontSize: 8,
                        color: T.text.muted,
                        padding: "1px 4px",
                        background: T.bg.elevated,
                        borderRadius: 2,
                      }}
                    >
                      空
                    </span>
                  )}
                </div>

                {isEmpty ? (
                  <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <span style={{ fontSize: 20, color: T.text.muted }}>+</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 9, color: T.text.secondary }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span>系统:</span>
                      <span style={{ color: T.text.primary }}>{slot.systems?.length || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span>图鉴:</span>
                      <span style={{ color: T.text.primary }}>{info?.totalItems || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span>属性:</span>
                      <span style={{ color: T.text.primary }}>{info?.totalAttrs || 0}</span>
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        paddingTop: 4,
                        borderTop: `1px solid ${T.border.subtle}`,
                        color: T.text.muted,
                        fontSize: 8,
                      }}
                    >
                      {info?.time}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 8, color: T.text.muted, textAlign: "center", marginTop: 4 }}>提示：点击栏位即可保存，已有数据的栏位将被覆盖</div>
      </div>
    </Modal>
  );
}
