// ══════════════════════════════════════════════════════════
//  模板管理弹窗
// ══════════════════════════════════════════════════════════

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T } from "../../constants/theme";

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function TemplateItem({ template, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(template.name);

  const handleSaveRename = () => {
    if (onRename(template.id, editName)) {
      setIsEditing(false);
    }
  };

  const handleCancelRename = () => {
    setEditName(template.name);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: T.bg.elevated,
        borderRadius: 6,
        marginBottom: 8,
      }}
    >
      {isEditing ? (
        <>
          <Inp
            value={editName}
            onChange={setEditName}
            placeholder="模板名称"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleSaveRename}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              border: "none",
              background: T.accent.green,
              color: "#fff",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            保存
          </button>
          <button
            onClick={handleCancelRename}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              border: "none",
              background: T.bg.hover,
              color: T.text.primary,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            取消
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.text.primary }}>
              {template.name}
            </div>
            <div style={{ fontSize: 11, color: T.text.secondary, marginTop: 2 }}>
              {template.qualities.length} 个品质 · {template.attrPool.length} 个属性 · {" "}
              {formatDate(template.createdAt)}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              border: "none",
              background: T.accent.blue,
              color: "#fff",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            重命名
          </button>
          <button
            onClick={() => onDelete(template.id)}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              border: "none",
              background: T.accent.red,
              color: "#fff",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            删除
          </button>
        </>
      )}
    </div>
  );
}

export function TemplateManagerModal({ open, onClose, templates, onDelete, onRename }) {
  return (
    <Modal open={open} onClose={onClose} title="模板管理" width={480}>
      <div style={{ maxHeight: 400, overflow: "auto" }}>
        {templates.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: T.text.secondary,
              fontSize: 13,
            }}
          >
            暂无模板
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
              在系统配置面板点击"保存为模板"可创建新模板
            </div>
          </div>
        ) : (
          templates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))
        )}
      </div>
    </Modal>
  );
}
