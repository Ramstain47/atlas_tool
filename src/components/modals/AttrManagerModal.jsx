// ══════════════════════════════════════════════════════════
//  属性管理器弹窗（紧凑布局 + 拖拽支持）
// ══════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T, F } from "../../constants/theme";
import * as XLSX from "xlsx";

const VALUE_TYPE_LABELS = { 1: "整数", 2: "百分比", 3: "小数" };

export function AttrManagerModal({ open, onClose, globalAttrs, setGlobalAttrs, showToast, onDragStart }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ key: "", name: "", attrId: "", valueType: "1" });

  const filtered = useMemo(() => {
    if (!search.trim()) return globalAttrs;
    const q = search.toLowerCase();
    return globalAttrs.filter(
      (a) => a.name.toLowerCase().includes(q) || a.key.toLowerCase().includes(q) || String(a.attrId).includes(q)
    );
  }, [globalAttrs, search]);

  const handleImportExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const newAttrs = [];
        const errors = [];

        jsonData.forEach((row, idx) => {
          const name = row["name"] || row["属性名称"];
          const id = row["id"] || row["数字id"] || row["attrId"];
          const type = row["attr_type"] || row["数值类型"] || row["valueType"];

          if (!name || !id) {
            errors.push(`第 ${idx + 1} 行: 缺少名称或ID`);
            return;
          }

          const attrId = Number(id);
          const valueType = Number(type) || 1;

          if (isNaN(attrId)) {
            errors.push(`第 ${idx + 1} 行: ID必须是数字`);
            return;
          }

          const key = `attr_${attrId}`;

          if (globalAttrs.find((a) => a.attrId === attrId || a.key === key)) {
            errors.push(`第 ${idx + 1} 行: ID ${attrId} 或 key 已存在`);
            return;
          }

          newAttrs.push({ key, attrId, name: String(name).trim(), valueType });
        });

        if (newAttrs.length > 0) {
          setGlobalAttrs((prev) => [...prev, ...newAttrs]);
          showToast(`成功导入 ${newAttrs.length} 个属性`, "green");
        }

        if (errors.length > 0) {
          console.warn("Excel导入问题:", errors);
          if (newAttrs.length === 0) {
            showToast(`导入失败: ${errors[0]}`, "red");
          }
        }
      } catch (err) {
        showToast("Excel解析失败", "red");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    const data = globalAttrs.map((a) => ({
      name: a.name,
      id: a.attrId,
      attr_type: a.valueType,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "属性列表");
    XLSX.writeFile(wb, "属性管理器导出.xlsx");
    showToast("已导出到Excel", "green");
  };

  const handleAdd = () => {
    const key = form.key.trim().toLowerCase();
    const name = form.name.trim();
    const attrId = Number(form.attrId);

    if (!key || !name || !attrId) {
      showToast("请填写完整信息", "red");
      return;
    }

    if (globalAttrs.find((a) => a.key === key)) {
      showToast("属性key已存在", "red");
      return;
    }
    if (globalAttrs.find((a) => a.attrId === attrId)) {
      showToast("属性ID已存在", "red");
      return;
    }

    setGlobalAttrs((prev) => [...prev, { key, attrId, name, valueType: Number(form.valueType) || 1 }]);
    setForm({ key: "", name: "", attrId: "", valueType: "1" });
    showToast("属性已添加到管理器", "green");
  };

  const handleUpdate = () => {
    if (!editing) return;
    const name = form.name.trim();
    const attrId = Number(form.attrId);

    if (!name || !attrId) {
      showToast("请填写完整信息", "red");
      return;
    }

    const existing = globalAttrs.find((a) => a.attrId === attrId && a.key !== editing);
    if (existing) {
      showToast("属性ID已存在", "red");
      return;
    }

    setGlobalAttrs((prev) =>
      prev.map((a) => (a.key === editing ? { ...a, name, attrId, valueType: Number(form.valueType) || 1 } : a))
    );
    setEditing(null);
    setForm({ key: "", name: "", attrId: "", valueType: "1" });
    showToast("属性已更新", "green");
  };

  const handleDelete = (key) => {
    setGlobalAttrs((prev) => prev.filter((a) => a.key !== key));
    showToast("属性已从管理器删除", "yellow");
  };

  const startEdit = (attr) => {
    setEditing(attr.key);
    setForm({
      key: attr.key,
      name: attr.name,
      attrId: String(attr.attrId),
      valueType: String(attr.valueType),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ key: "", name: "", attrId: "", valueType: "1" });
  };

  // 拖拽开始
  const handleDragStart = (e, attr) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "attr", attr }));
    e.dataTransfer.effectAllowed = "copy";
    // 调用外部回调，用于设置全局拖拽状态
    if (onDragStart) onDragStart(attr);
  };

  const handleDragEnd = () => {
    if (onDragStart) onDragStart(null);
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setEditing(null); cancelEdit(); }} title="属性管理器" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            placeholder="搜索属性..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "5px 8px",
              background: T.bg.input,
              border: `1px solid ${T.border.subtle}`,
              borderRadius: 4,
              color: T.text.primary,
              fontSize: 11,
              outline: "none",
            }}
          />
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".xlsx,.xls";
              input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) handleImportExcel(file);
              };
              input.click();
            }}
            style={{
              padding: "5px 10px",
              borderRadius: 4,
              border: `1px solid ${T.accent.blue}60`,
              background: `${T.accent.blue}10`,
              color: T.accent.blue,
              fontSize: 10,
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            📥 导入
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              padding: "5px 10px",
              borderRadius: 4,
              border: `1px solid ${T.accent.green}60`,
              background: `${T.accent.green}10`,
              color: T.accent.green,
              fontSize: 10,
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            📤 导出
          </button>
        </div>

        {/* Add/Edit Form */}
        <div style={{ padding: 10, background: T.bg.input, borderRadius: 6, border: `1px solid ${T.border.subtle}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.text.secondary, marginBottom: 8 }}>
            {editing ? "编辑属性" : "添加新属性"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: editing ? "1fr 1fr 70px 80px" : "1fr 1fr 70px 80px 70px",
              gap: 6,
            }}
          >
            <Inp
              label="Key"
              value={form.key}
              onChange={(v) => setForm((p) => ({ ...p, key: v }))}
              mono
              placeholder="atk"
              disabled={editing}
            />
            <Inp label="名称" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="攻击力" />
            <Inp label="ID" value={form.attrId} onChange={(v) => setForm((p) => ({ ...p, attrId: v }))} mono placeholder="1001" />
            <div>
              <label
                style={{
                  fontSize: 8,
                  color: T.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  display: "block",
                  marginBottom: 2,
                }}
              >
                类型
              </label>
              <select
                value={form.valueType}
                onChange={(e) => setForm((p) => ({ ...p, valueType: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "4px 3px",
                  background: T.bg.elevated,
                  border: `1px solid ${T.border.subtle}`,
                  borderRadius: 3,
                  color: T.text.primary,
                  fontSize: 10,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="1">整数</option>
                <option value="2">百分比</option>
                <option value="3">小数</option>
              </select>
            </div>
            {!editing ? (
              <button
                onClick={handleAdd}
                style={{
                  alignSelf: "flex-end",
                  padding: "5px 8px",
                  borderRadius: 4,
                  border: "none",
                  background: T.accent.blue,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                添加
              </button>
            ) : (
              <div style={{ display: "flex", gap: 4, alignSelf: "flex-end" }}>
                <button
                  onClick={handleUpdate}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    borderRadius: 4,
                    border: "none",
                    background: T.accent.blue,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: "5px 8px",
                    borderRadius: 4,
                    border: `1px solid ${T.border.default}`,
                    background: "transparent",
                    color: T.text.secondary,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attributes List - 紧凑网格布局 */}
        <div style={{ maxHeight: 320, overflow: "auto" }}>
          {/* 表头 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "20px 80px 1fr 50px 50px 70px",
              gap: 6,
              padding: "4px 8px",
              background: T.bg.surface,
              borderRadius: 4,
              marginBottom: 4,
              fontSize: 9,
              color: T.text.muted,
              fontWeight: 600,
            }}
          >
            <span></span>
            <span>Key</span>
            <span>名称</span>
            <span>ID</span>
            <span>类型</span>
            <span style={{ textAlign: "center" }}>操作</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: T.text.muted, fontSize: 11 }}>
              {search ? "未找到匹配的属性" : "暂无属性，请添加或导入"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filtered.map((attr) => (
                <div
                  key={attr.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, attr)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px 80px 1fr 50px 50px 70px",
                    gap: 6,
                    alignItems: "center",
                    padding: "4px 8px",
                    background: T.bg.input,
                    borderRadius: 3,
                    fontSize: 10,
                    cursor: "grab",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.bg.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = T.bg.input; }}
                >
                  {/* 拖拽手柄 */}
                  <span
                    style={{
                      color: T.text.muted,
                      fontSize: 11,
                      cursor: "grab",
                      userSelect: "none",
                    }}
                    title="拖拽到图鉴以挂载"
                  >
                    ⋮⋮
                  </span>
                  <span style={{ fontFamily: F.mono, color: T.text.secondary, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {attr.key}
                  </span>
                  <span style={{ fontWeight: 600, color: T.text.primary, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {attr.name}
                  </span>
                  <span style={{ fontFamily: F.mono, color: T.text.muted, fontSize: 9 }}>{attr.attrId}</span>
                  <span style={{ fontSize: 8, color: T.text.secondary }}>{VALUE_TYPE_LABELS[attr.valueType] || "整数"}</span>
                  <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                    <button
                      onClick={() => startEdit(attr)}
                      style={{
                        padding: "1px 5px",
                        borderRadius: 2,
                        border: `1px solid ${T.border.default}`,
                        background: "transparent",
                        color: T.text.secondary,
                        fontSize: 8,
                        cursor: "pointer",
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(attr.key)}
                      style={{
                        padding: "1px 5px",
                        borderRadius: 2,
                        border: `1px solid ${T.accent.red}40`,
                        background: `${T.accent.red}10`,
                        color: T.accent.red,
                        fontSize: 8,
                        cursor: "pointer",
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ fontSize: 9, color: T.text.muted, textAlign: "center" }}>
          共 {globalAttrs.length} 个属性 {search && `(搜索到 ${filtered.length} 个)`}
          <span style={{ marginLeft: 8, opacity: 0.7 }}>⋮⋮ 拖拽属性到图鉴以快速挂载</span>
        </div>
      </div>
    </Modal>
  );
}
