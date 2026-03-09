import { useState, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { T } from "../../constants/theme";

export function SelectAttrModal({ open, onClose, availableAttrs, onSelect, onSelectMultiple }) {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // 切换单个选择
  const toggleSelection = useCallback((key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // 全选
  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(availableAttrs.map((a) => a.key)));
  }, [availableAttrs]);

  // 取消全选
  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  // 反选
  const invertSelection = useCallback(() => {
    setSelectedKeys((prev) => {
      const next = new Set();
      availableAttrs.forEach((a) => {
        if (!prev.has(a.key)) {
          next.add(a.key);
        }
      });
      return next;
    });
  }, [availableAttrs]);

  // 批量添加
  const handleBatchAdd = useCallback(() => {
    if (selectedKeys.size === 0) return;
    const selectedAttrs = availableAttrs.filter((a) => selectedKeys.has(a.key));
    onSelectMultiple(selectedAttrs);
    setSelectedKeys(new Set());
  }, [selectedKeys, availableAttrs, onSelectMultiple]);

  // 单个添加（保持原有功能）
  const handleSingleAdd = useCallback(
    (attr) => {
      onSelect(attr);
    },
    [onSelect]
  );

  return (
    <Modal open={open} onClose={onClose} title="从属性管理器添加" width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {availableAttrs.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.text.muted }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 11 }}>没有可添加的属性</div>
            <div style={{ fontSize: 9, marginTop: 4 }}>属性管理器中的所有属性已在当前系统属性池中</div>
          </div>
        ) : (
          <>
            {/* 工具栏 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: T.bg.elevated,
                borderRadius: 6,
                border: `1px solid ${T.border.subtle}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, color: T.text.secondary }}>
                  已选 <strong style={{ color: T.accent.blue }}>{selectedKeys.size}</strong> / {availableAttrs.length}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={selectAll}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 3,
                    border: `1px solid ${T.border.default}`,
                    background: "transparent",
                    color: T.text.secondary,
                    fontSize: 8,
                    cursor: "pointer",
                  }}
                >
                  全选
                </button>
                <button
                  onClick={deselectAll}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 3,
                    border: `1px solid ${T.border.default}`,
                    background: "transparent",
                    color: T.text.secondary,
                    fontSize: 8,
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={invertSelection}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 3,
                    border: `1px solid ${T.border.default}`,
                    background: "transparent",
                    color: T.text.secondary,
                    fontSize: 8,
                    cursor: "pointer",
                  }}
                >
                  反选
                </button>
              </div>
            </div>

            <div style={{ fontSize: 9, color: T.text.secondary }}>选择要添加到当前系统属性池的属性（点击行可多选）：</div>

            {/* 属性列表 */}
            <div style={{ maxHeight: 320, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
              {availableAttrs.map((attr) => {
                const vtLabel = attr.valueType === 2 ? "百分比" : attr.valueType === 3 ? "小数" : "整数";
                const isSelected = selectedKeys.has(attr.key);

                return (
                  <div
                    key={attr.key}
                    onClick={() => toggleSelection(attr.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 8px",
                      background: isSelected ? `${T.accent.blue}10` : T.bg.input,
                      borderRadius: 4,
                      border: `1px solid ${isSelected ? T.accent.blue + "50" : T.border.subtle}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = T.bg.surface;
                        e.currentTarget.style.borderColor = T.border.default;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = T.bg.input;
                        e.currentTarget.style.borderColor = T.border.subtle;
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(attr.key)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 14,
                        height: 14,
                        marginRight: 8,
                        accentColor: T.accent.blue,
                        cursor: "pointer",
                      }}
                    />

                    <span
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 600,
                        color: isSelected ? T.accent.blue : T.text.primary,
                      }}
                    >
                      {attr.name}
                    </span>
                    <span style={{ fontSize: 8, color: T.text.muted, fontFamily: "monospace", marginRight: 8 }}>{attr.key}</span>
                    <span
                      style={{
                        fontSize: 8,
                        color: T.text.muted,
                        padding: "1px 4px",
                        background: T.bg.elevated,
                        borderRadius: 2,
                        marginRight: 8,
                      }}
                    >
                      ID:{attr.attrId}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        color: T.text.muted,
                        padding: "1px 4px",
                        background: T.bg.elevated,
                        borderRadius: 2,
                        marginRight: 12,
                      }}
                    >
                      {vtLabel}
                    </span>

                    {/* 单个添加按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleAdd(attr);
                      }}
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

            {/* 底部批量操作按钮 */}
            {selectedKeys.size > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: `${T.accent.blue}10`,
                  borderRadius: 6,
                  border: `1px solid ${T.accent.blue}40`,
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 10, color: T.text.secondary }}>
                  已选择 <strong style={{ color: T.accent.blue }}>{selectedKeys.size}</strong> 个属性
                </span>
                <button
                  onClick={handleBatchAdd}
                  style={{
                    padding: "5px 16px",
                    borderRadius: 4,
                    border: "none",
                    background: `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: `0 2px 8px ${T.accent.blue}40`,
                  }}
                >
                  批量添加
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
