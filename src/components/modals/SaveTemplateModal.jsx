// ══════════════════════════════════════════════════════════
//  保存为模板弹窗
// ══════════════════════════════════════════════════════════

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T } from "../../constants/theme";

export function SaveTemplateModal({ open, onClose, onSave, systemName }) {
  const [name, setName] = useState(() => systemName ? `${systemName}-模板` : "");

  const handleSave = () => {
    if (onSave(name)) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="保存为模板">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, color: T.text.secondary }}>
          将当前系统的配置保存为模板，可在创建新系统时快速复用。
        </div>
        <Inp
          label="模板名称"
          value={name}
          onChange={setName}
          placeholder="如：标准装备配置"
        />
        <div
          style={{
            fontSize: 11,
            color: T.text.secondary,
            background: T.bg.elevated,
            padding: "8px 10px",
            borderRadius: 4,
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: 4 }}>将保存以下内容：</div>
          <div>• 品质层级配置（星级、数量、堆叠、权重）</div>
          <div>• 属性池配置</div>
          <div>• 计算参数（上限、单位、取整方式）</div>
          <div style={{ marginTop: 4, color: T.accent.yellow }}>
            • 图鉴条目和手动覆盖值不会被保存
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: "8px",
            borderRadius: 6,
            border: "none",
            background: T.accent.green,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          保存模板
        </button>
      </div>
    </Modal>
  );
}
