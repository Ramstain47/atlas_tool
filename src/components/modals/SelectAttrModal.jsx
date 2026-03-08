import { Modal } from "../ui/Modal";
import { T } from "../../constants/theme";

export function SelectAttrModal({ open, onClose, availableAttrs, onSelect }) {
  return (
    <Modal open={open} onClose={onClose} title="从属性管理器添加" width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {availableAttrs.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.text.muted }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 11 }}>没有可添加的属性</div>
            <div style={{ fontSize: 9, marginTop: 4 }}>属性管理器中的所有属性已在当前系统属性池中</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 9, color: T.text.secondary, marginBottom: 4 }}>选择要添加到当前系统属性池的属性：</div>
            <div style={{ maxHeight: 350, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
              {availableAttrs.map((attr) => {
                const vtLabel = attr.valueType === 2 ? "百分比" : attr.valueType === 3 ? "小数" : "整数";
                return (
                  <div
                    key={attr.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 8px",
                      background: T.bg.input,
                      borderRadius: 4,
                      border: `1px solid ${T.border.subtle}`,
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600 }}>{attr.name}</span>
                    <span style={{ fontSize: 8, color: T.text.muted, fontFamily: "monospace", marginRight: 8 }}>{attr.key}</span>
                    <span style={{ fontSize: 8, color: T.text.muted, padding: "1px 4px", background: T.bg.elevated, borderRadius: 2, marginRight: 8 }}>
                      ID:{attr.attrId}
                    </span>
                    <span style={{ fontSize: 8, color: T.text.muted, padding: "1px 4px", background: T.bg.elevated, borderRadius: 2, marginRight: 12 }}>
                      {vtLabel}
                    </span>
                    <button
                      onClick={() => onSelect(attr)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 3,
                        border: `1px solid ${T.accent.green}60`,
                        background: `${T.accent.green}15`,
                        color: T.accent.green,
                        fontSize: 9,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      添加
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
