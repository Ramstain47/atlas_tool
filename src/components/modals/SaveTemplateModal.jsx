// ══════════════════════════════════════════════════════════
//  保存为模板弹窗
// ══════════════════════════════════════════════════════════

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T } from "../../constants/theme";

export function SaveTemplateModal({ open, onClose, onSave, systemName, hasItems }) {
  const [name, setName] = useState(() => systemName ? `${systemName}-模板` : "");
  const [includeMount, setIncludeMount] = useState(false);

  const handleSave = () => {
    if (onSave(name, includeMount)) {
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
        {hasItems && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: T.text.primary,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={includeMount}
              onChange={(e) => setIncludeMount(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            包含属性挂载关系
            <span style={{ fontSize: 11, color: T.text.secondary }}>
              （使用此模板时将自动生成底表并挂载属性）
            </span>
          </label>
        )}
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
          {includeMount && (
            <div style={{ color: T.accent.blue }}>
              • 每个图鉴条目的属性挂载关系（按星级+序号）
            </div>
          )}
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
