import { Modal } from "../ui/Modal";
import { T } from "../../constants/theme";

export function LoadManagerModal({ open, onClose, maxSlots, saveSlots, getSlotInfo, onLoad, onDelete }) {
  return (
    <Modal open={open} onClose={onClose} title="📂 读档管理" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 10, color: T.text.secondary, marginBottom: 4 }}>选择要读取的存档：</div>
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
                  !isEmpty && onLoad(i);
                }}
                style={{
                  padding: 10,
                  background: isEmpty ? T.bg.input : T.bg.elevated,
                  borderRadius: 6,
                  border: `1px solid ${isEmpty ? T.border.subtle : T.accent.blue + "40"}`,
                  cursor: isEmpty ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  minHeight: 80,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isEmpty ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isEmpty) {
                    e.currentTarget.style.borderColor = T.accent.blue;
                    e.currentTarget.style.background = `${T.accent.blue}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isEmpty) {
                    e.currentTarget.style.borderColor = T.accent.blue + "40";
                    e.currentTarget.style.background = T.bg.elevated;
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? T.text.muted : T.accent.blue }}>存档 {i + 1}</span>
                  {isEmpty && (
                    <span
                      style={{
                        fontSize: 8,
                        color: T.text.muted,
                        padding: "1px 4px",
                        background: T.bg.input,
                        borderRadius: 2,
                      }}
                    >
                      空
                    </span>
                  )}
                  {!isEmpty && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(i);
                      }}
                      style={{
                        padding: "1px 4px",
                        borderRadius: 2,
                        border: `1px solid ${T.accent.red}40`,
                        background: `${T.accent.red}10`,
                        color: T.accent.red,
                        fontSize: 7,
                        cursor: "pointer",
                      }}
                    >
                      删除
                    </button>
                  )}
                </div>

                {isEmpty ? (
                  <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <span style={{ fontSize: 10, color: T.text.muted }}>无数据</span>
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

        <div style={{ fontSize: 8, color: T.text.muted, textAlign: "center", marginTop: 4 }}>
          提示：点击有数据的栏位即可读取，点击删除按钮可清空存档
        </div>
      </div>
    </Modal>
  );
}
