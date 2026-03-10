import { useState, useRef, useCallback } from "react";
import { T, F } from "../../constants/theme";
import { QBadge } from "../ui/QBadge";
import { Pill } from "../ui/Pill";
import { MiniBar } from "../ui/MiniBar";
import { Inp } from "../ui/Inp";
import { formatValue } from "../../utils/format";

export function AttrPanel({
  sys,
  usedAttrs,
  attrMap,
  mountCounts,
  selectedIds,
  setShowSelectFromManager,
  mountAttrToItems,
  unmountAttrFromItems,
  removeFromPool,
  reorderAttrPool,
  attrResults,
  actualTotals,
  computed,
  updateAttrConfig,
  handleCompute,
  clearAllOverrides,
  showToast,
  setSelectedIds,
  setMultiSelectMode,
  onDragStart,
}) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const handleRef = useRef(false);
  const scrollRef = useRef(null);

  const scrollToAttrConfig = useCallback((attrKey) => {
    const el = document.getElementById(`attr-config-${attrKey}`);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const targetTop = el.offsetTop - container.offsetTop;
      const start = container.scrollTop;
      const diff = targetTop - start;
      const duration = 200;
      let startTime = null;
      const step = (ts) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        container.scrollTop = start + diff * ease;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, []);

  return (
    <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 10px",
          background: T.bg.surface,
          borderBottom: `1px solid ${T.border.subtle}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600 }}>属性管理</span>
        {selectedIds.size > 0 && <span style={{ fontSize: 9, color: T.accent.blue, fontWeight: 600 }}>已选 {selectedIds.size} 个图鉴</span>}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* ── Attribute Pool ── */}
        <div style={{ padding: 8, background: T.bg.elevated, borderRadius: 6, border: `1px solid ${T.border.subtle}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: T.text.secondary, textTransform: "uppercase", letterSpacing: 1 }}>
              属性池 · 挂载操作
            </span>
            <button
              onClick={() => setShowSelectFromManager(true)}
              style={{
                padding: "1px 5px",
                borderRadius: 2,
                border: `1px dashed ${T.accent.purple}60`,
                background: `${T.accent.purple}10`,
                color: T.accent.purple,
                fontSize: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              + 从管理器添加
            </button>
          </div>
          {sys.attrPool.length === 0 ? (
            <div style={{ padding: 12, textAlign: "center", color: T.text.muted, fontSize: 10, background: T.bg.input, borderRadius: 4 }}>
              属性池为空，点击上方按钮从属性管理器添加属性
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
              {sys.attrPool.map((a, idx) => {
                const used = usedAttrs.includes(a.key);
                const totalCount = mountCounts[a.key] ? Object.values(mountCounts[a.key]).reduce((s, v) => s + v, 0) : 0;
                const selHas = Array.from(selectedIds).some((id) => (sys.items.find((it) => it.id === id)?.attrs || []).includes(a.key));
                const vtLabel = a.valueType === 2 ? "%" : a.valueType === 3 ? ".00" : "int";
                
                // 卡片区域拖拽 → 拖到 DataGrid 挂载
                const handleCardDragStart = (e) => {
                  if (handleRef.current) { e.preventDefault(); return; }
                  e.dataTransfer.setData("application/json", JSON.stringify({ type: "attr", attr: a }));
                  e.dataTransfer.effectAllowed = "copy";
                  if (onDragStart) onDragStart(a);
                };
                const handleCardDragEnd = () => {
                  if (onDragStart) onDragStart(null);
                };

                // 手柄拖拽 → 池内排序
                const handleHandleDragStart = (e) => {
                  handleRef.current = true;
                  e.stopPropagation();
                  e.dataTransfer.setData("text/plain", String(idx));
                  e.dataTransfer.effectAllowed = "move";
                  setDragIdx(idx);
                };
                const handleHandleDragEnd = () => {
                  handleRef.current = false;
                  if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
                    reorderAttrPool(dragIdx, overIdx);
                  }
                  setDragIdx(null);
                  setOverIdx(null);
                };

                const handleDragOver = (e) => {
                  if (dragIdx === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverIdx(idx);
                };
                const handleDrop = (e) => {
                  e.preventDefault();
                };

                const isDragging = dragIdx === idx;
                const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                const ac = attrMap[a.key]?.color || a.color || T.accent.blue;

                return (
                  <div
                    key={a.key}
                    draggable
                    onDragStart={handleCardDragStart}
                    onDragEnd={handleCardDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      padding: "4px 5px",
                      borderRadius: 4,
                      background: used ? `${ac}08` : T.bg.input,
                      border: `1px solid ${isOver ? ac : used ? ac + "20" : T.border.subtle}`,
                      opacity: isDragging ? 0.4 : 1,
                      transition: "border-color 0.15s, opacity 0.15s",
                    }}
                  >
                    {/* Row 1: handle + color dot + name + remove */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span
                        draggable
                        onDragStart={handleHandleDragStart}
                        onDragEnd={handleHandleDragEnd}
                        style={{ cursor: "grab", color: T.text.muted, fontSize: 10, lineHeight: 1, userSelect: "none", flexShrink: 0 }}
                        title="拖拽排序"
                      >⠿</span>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ac, flexShrink: 0 }} />
                      <span
                        onClick={used ? () => scrollToAttrConfig(a.key) : undefined}
                        style={{
                          fontSize: 9, fontWeight: 600,
                          color: used ? T.text.primary : T.text.muted,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                          cursor: used ? "pointer" : "default",
                          ...(used ? { textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2 } : {}),
                        }}
                        title={used ? "点击定位到属性配置" : ""}
                      >{a.name}</span>
                      <button
                        onClick={() => removeFromPool(a.key, usedAttrs)}
                        disabled={used}
                        style={{
                          padding: "0 3px",
                          border: "none",
                          background: "transparent",
                          color: !used ? T.text.muted : T.border.subtle,
                          fontSize: 9,
                          cursor: !used ? "pointer" : "not-allowed",
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                      >✕</button>
                    </div>
                    {/* Row 2: attrId + type + count */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 8 }}>
                      <span style={{ color: T.text.muted, fontFamily: F.mono }}>{a.attrId || "—"}</span>
                      <span style={{ color: T.text.muted, padding: "0 2px", background: T.bg.elevated, borderRadius: 2, fontSize: 7 }}>{vtLabel}</span>
                      {totalCount > 0 && <span style={{ color: T.accent.blue, fontFamily: F.mono, marginLeft: "auto" }}>×{totalCount}</span>}
                    </div>
                    {/* Row 3: mount/unmount buttons */}
                    <div style={{ display: "flex", gap: 2 }}>
                      <button
                        onClick={() => {
                          const ok = mountAttrToItems(a.key, selectedIds);
                          if (ok) {
                            showToast(`已为 ${selectedIds.size} 个图鉴挂载 ${a.name}`, "green");
                            setMultiSelectMode(false);
                            setSelectedIds(new Set());
                          }
                        }}
                        disabled={selectedIds.size === 0}
                        style={{
                          flex: 1,
                          padding: "1px 0",
                          borderRadius: 2,
                          border: `1px solid ${selectedIds.size > 0 ? T.accent.green + "60" : T.border.subtle}`,
                          background: selectedIds.size > 0 ? `${T.accent.green}15` : "transparent",
                          color: selectedIds.size > 0 ? T.accent.green : T.text.muted,
                          fontSize: 8,
                          cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                          fontWeight: 600,
                        }}
                      >挂载</button>
                      <button
                        onClick={() => {
                          const ok = unmountAttrFromItems(a.key, selectedIds);
                          if (ok) {
                            showToast(`已为 ${selectedIds.size} 个图鉴卸载 ${a.name}`, "green");
                            setMultiSelectMode(false);
                            setSelectedIds(new Set());
                          }
                        }}
                        disabled={selectedIds.size === 0 || !selHas}
                        style={{
                          flex: 1,
                          padding: "1px 0",
                          borderRadius: 2,
                          border: `1px solid ${selectedIds.size > 0 && selHas ? T.accent.red + "60" : T.border.subtle}`,
                          background: selectedIds.size > 0 && selHas ? `${T.accent.red}10` : "transparent",
                          color: selectedIds.size > 0 && selHas ? T.accent.red : T.text.muted,
                          fontSize: 8,
                          cursor: selectedIds.size > 0 && selHas ? "pointer" : "not-allowed",
                          fontWeight: 600,
                        }}
                      >卸载</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Attribute Config Cards ── */}
        {usedAttrs.map((attrKey) => {
          const ad = attrMap[attrKey] || { key: attrKey, name: attrKey, valueType: 1 };
          const cfg = sys.attrConfigs[attrKey] || { limit: 0, unit: 1, mode: "round" };
          const result = attrResults[attrKey];
          const actualTotal = actualTotals[attrKey];
          const limit = Number(cfg.limit) || 0;
          const error = computed && actualTotal !== undefined ? actualTotal - limit : null;
          const errorPct = limit > 0 && error !== null ? Math.abs((error / limit) * 100).toFixed(1) : 0;
          const errorColor =
            error === null
              ? T.text.muted
              : Math.abs(error) === 0
                ? T.accent.green
                : (Number(cfg.unit) || 1) >= Math.abs(error)
                  ? T.accent.green
                  : errorPct <= 3
                    ? T.accent.yellow
                    : T.accent.red;
          const mc = mountCounts[attrKey] || {};
          const vtLabel = ad.valueType === 2 ? "百分比" : ad.valueType === 3 ? "小数" : "整数";

          return (
            <div
              key={attrKey}
              id={`attr-config-${attrKey}`}
              style={{
                padding: 9,
                background: T.bg.elevated,
                borderRadius: 6,
                border: `1px solid ${T.border.subtle}`,
                borderLeft: `3px solid ${(attrMap[attrKey]?.color) || T.accent.blue}`,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{ad.name}</span>
                  <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono }}>
                    id:{ad.attrId} · {vtLabel}
                  </span>
                </div>
              </div>

              {/* Mount counts per quality */}
              <div style={{ display: "flex", gap: 3, marginBottom: 5, flexWrap: "wrap" }}>
                {sys.qualities.map((q) => {
                  const cnt = mc[q.star] || 0;
                  const qc = T.quality[q.star]?.color || "#888";
                  return (
                    <span
                      key={q.star}
                      style={{
                        fontSize: 8,
                        fontFamily: F.mono,
                        color: cnt > 0 ? qc : T.text.muted,
                        padding: "1px 4px",
                        borderRadius: 2,
                        background: cnt > 0 ? `${qc}15` : "transparent",
                        border: `1px solid ${cnt > 0 ? qc + "30" : "transparent"}`,
                        fontWeight: cnt > 0 ? 600 : 400,
                      }}
                    >
                      {T.quality[q.star]?.label?.slice(0, 1)}
                      {cnt > 0 ? cnt : 0}
                    </span>
                  );
                })}
              </div>

              {/* Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 5 }}>
                <Inp
                  label="期望上限"
                  value={cfg.limit}
                  onChange={(v) => updateAttrConfig(attrKey, "limit", Number(v) || 0)}
                  mono
                />
                <Inp
                  label="最小单元"
                  value={cfg.unit}
                  onChange={(v) => updateAttrConfig(attrKey, "unit", Number(v) || 1)}
                  mono
                />
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
                    取整
                  </label>
                  <select
                    value={cfg.mode || "round"}
                    onChange={(e) => updateAttrConfig(attrKey, "mode", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 3px",
                      background: T.bg.input,
                      border: `1px solid ${T.border.subtle}`,
                      borderRadius: 3,
                      color: T.text.primary,
                      fontSize: 9,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="round">四舍五入</option>
                    <option value="ceil">向上取整</option>
                    <option value="floor">向下取整</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              {computed && result && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
                    <Pill
                      label="实际"
                      value={actualTotal !== undefined ? (ad.valueType === 1 ? actualTotal : formatValue(actualTotal, ad.valueType)) : "—"}
                      color={errorColor}
                    />
                    <Pill
                      label="误差"
                      value={error === null ? "—" : error === 0 ? "0" : (error > 0 ? "+" : "") + error}
                      color={errorColor}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        padding: "2px 5px",
                        borderRadius: 3,
                        background: `${errorColor}15`,
                        border: `1px solid ${errorColor}30`,
                      }}
                    >
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: errorColor }} />
                      <span style={{ fontSize: 8, color: errorColor, fontWeight: 600 }}>{error === 0 ? "完美" : `${errorPct}%`}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 3 }}>
                    <MiniBar
                      segments={Object.entries(result.values).map(([s, v]) => ({
                        value: v.final * v.count * v.stack,
                        color: T.quality[s]?.color || "#888",
                        label: `${T.quality[s]?.label || s}: ${v.final * v.count * v.stack}`,
                      }))}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 3 }}>
                    {Object.entries(result.values).map(([s, v]) => {
                      const qc = T.quality[s]?.color || "#888";
                      return (
                        <div key={s} style={{ padding: "3px 4px", background: T.bg.input, borderRadius: 3, borderTop: `2px solid ${qc}` }}>
                          <div style={{ fontSize: 7, color: T.text.muted }}>{T.quality[s]?.label} 单次</div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: F.mono, color: qc }}>
                            {ad.valueType === 1 ? v.final : formatValue(v.final, ad.valueType)}
                          </div>
                          <div style={{ fontSize: 7, color: T.text.muted }}>
                            原始:{v.final} ×{v.count}×{v.stack}={v.final * v.count * v.stack}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {usedAttrs.length === 0 && sys.generated && (
          <div style={{ padding: 16, textAlign: "center", color: T.text.muted, fontSize: 11 }}>选择图鉴后使用上方属性池的「挂载」按钮分配属性</div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
          <button
            onClick={handleCompute}
            disabled={usedAttrs.length === 0}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              background: usedAttrs.length === 0 ? T.bg.elevated : `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`,
              color: usedAttrs.length === 0 ? T.text.muted : "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: usedAttrs.length === 0 ? "not-allowed" : "pointer",
              boxShadow: usedAttrs.length > 0 ? `0 3px 10px ${T.accent.blue}30` : "none",
            }}
          >
            ⚡ 执行自动分配
          </button>
          {computed && Object.keys(sys.manualOverrides).filter((k) => sys.manualOverrides[k] !== undefined).length > 0 && (
            <button
              onClick={clearAllOverrides}
              style={{
                padding: "8px 8px",
                borderRadius: 6,
                border: `1px solid ${T.accent.yellow}40`,
                background: `${T.accent.yellow}10`,
                color: T.accent.yellow,
                fontSize: 9,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ↺ 清除手动值
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
