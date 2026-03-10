// ══════════════════════════════════════════════════════════
//  新建系统弹窗（支持模板选择）
// ══════════════════════════════════════════════════════════

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T } from "../../constants/theme";

export function NewSystemModal({ open, onClose, onCreate, templates }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const handleCreate = () => {
    const template = selectedTemplateId
      ? templates.find((t) => t.id === selectedTemplateId)
      : null;

    if (onCreate(name, code, template)) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="新建系统">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Inp label="系统名称" value={name} onChange={setName} placeholder="如：公会商店" />
        <Inp label="系统ID段 (3位)" value={code} onChange={setCode} placeholder="如：102" mono />

        {templates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: T.text.secondary }}>使用模板（可选）</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: `1px solid ${T.border}`,
                background: T.bg.input,
                color: T.text.primary,
                fontSize: 12,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">使用默认配置</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedTemplateId && (() => {
              const tpl = templates.find((t) => t.id === selectedTemplateId);
              const hasMount = tpl?.starAttrMap;
              return (
                <div
                  style={{
                    fontSize: 11,
                    color: T.accent.blue,
                    background: `${T.accent.blue}15`,
                    padding: "6px 8px",
                    borderRadius: 4,
                  }}
                >
                  <div>将复制品质配置、属性池和计算参数</div>
                  {hasMount && (
                    <div style={{ marginTop: 2, color: T.accent.green }}>
                      将自动生成底表并挂载属性
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <button
          onClick={handleCreate}
          style={{
            padding: "8px",
            borderRadius: 6,
            border: "none",
            background: T.accent.blue,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          创建
        </button>
      </div>
    </Modal>
  );
}
