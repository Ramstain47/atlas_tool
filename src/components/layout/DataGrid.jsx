import { useState, useCallback, useRef, useEffect } from "react";
import { T, F } from "../../constants/theme";
import { QBadge } from "../ui/QBadge";
import { formatValue } from "../../utils/format";

// 估算标签宽度（中文字符约 14px，加上 padding 和边框约 16px）
function estimateTagWidth(name, hasValue) {
  const charWidth = name.match(/[\u4e00-\u9fa5]/) ? 13 : 8;
  const padding = 14; // 左右 padding + 边框
  const valueWidth = hasValue ? 40 : 0; // 数值大概宽度
  return name.length * charWidth + padding + valueWidth;
}

export function DataGrid({
  sys,
  groupedItems,
  collapsedGroups,
  setCollapsedGroups,
  selectedIds,
  setSelectedIds,
  multiSelectMode,
  setMultiSelectMode,
  attrMap,
  computed,
  attrResults,
  setManualOverride,
  mountAttrToItems,
  showToast,
  draggedAttr,
}) {
  // 记录每个条目是否展开属性详情
  const [expandedItems, setExpandedItems] = useState(new Set());
  // 拖拽悬停的条目ID
  const [dragOverItemId, setDragOverItemId] = useState(null);
  // 属性列容器宽度（用于计算能显示几个标签）
  const attrColRef = useRef(null);
  const [colWidth, setColWidth] = useState(200);

  const toggleGroup = (star) =>
    setCollapsedGroups((prev) => {
      const n = new Set(prev);
      n.has(star) ? n.delete(star) : n.add(star);
      return n;
    });

  const toggleSelect = (id, e) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (e?.shiftKey || e?.ctrlKey || e?.metaKey) {
        n.has(id) ? n.delete(id) : n.add(id);
      } else {
        if (n.has(id) && n.size === 1) n.clear();
        else {
          n.clear();
          n.add(id);
        }
      }
      return n;
    });
  };

  const selectAllInGroup = (star) => {
    const ids = groupedItems[star]?.map((it) => it.id) || [];
    setSelectedIds((prev) => {
      const all = ids.every((id) => prev.has(id));
      const n = new Set(prev);
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    });
  };

  const toggleItemExpand = (itemId) => {
    setExpandedItems((prev) => {
      const n = new Set(prev);
      n.has(itemId) ? n.delete(itemId) : n.add(itemId);
      return n;
    });
  };

  // 展开所有条目
  const expandAllItems = () => {
    const allIds = new Set();
    Object.values(groupedItems).forEach((items) => {
      items.forEach((item) => {
        if (item.attrs && item.attrs.length > 0) {
          allIds.add(item.id);
        }
      });
    });
    setExpandedItems(allIds);
  };

  // 收起所有条目
  const collapseAllItems = () => {
    setExpandedItems(new Set());
  };

  // 监听属性列宽度变化
  useEffect(() => {
    if (!attrColRef.current) return;
    
    const updateWidth = () => {
      if (attrColRef.current) {
        setColWidth(attrColRef.current.clientWidth);
      }
    };
    
    updateWidth();
    
    // 监听窗口大小变化
    window.addEventListener("resize", updateWidth);
    
    // 使用 ResizeObserver 监听容器变化
    const observer = new ResizeObserver(updateWidth);
    observer.observe(attrColRef.current);
    
    return () => {
      window.removeEventListener("resize", updateWidth);
      observer.disconnect();
    };
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverItemId(itemId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOverItemId(null);
  }, []);

  const handleDrop = useCallback((e, itemId) => {
    e.preventDefault();
    setDragOverItemId(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "attr" && data.attr) {
        // 挂载属性到该条目
        const ok = mountAttrToItems(data.attr.key, new Set([itemId]));
        if (ok) {
          showToast(`已为 ${itemId} 挂载 ${data.attr.name}`, "green");
        }
      }
    } catch (err) {
      console.error("拖拽数据解析失败:", err);
    }
  }, [mountAttrToItems, showToast]);

  // 格式化带符号的数值
  const formatSignedValue = (value, valueType) => {
    if (value === undefined || value === null || value === "") return "—";
    const num = Number(value);
    if (isNaN(num)) return "—";
    const sign = num >= 0 ? "+" : "";
    return sign + formatValue(num, valueType);
  };

  // 获取条目挂载的属性列表（带计算值）
  const getItemAttrList = (item) => {
    if (!item.attrs || item.attrs.length === 0) return [];
    return item.attrs.map((attrKey) => {
      const ad = attrMap[attrKey];
      const result = computed && attrResults[attrKey];
      const autoVal = result?.values?.[item.star]?.final;
      const ok = `${item.id}_${attrKey}`;
      const ov = sys.manualOverrides[ok];
      const isManual = ov !== undefined && ov !== null;
      const rawValue = isManual ? ov : autoVal;
      return {
        key: attrKey,
        name: ad?.name || attrKey,
        valueType: ad?.valueType || 1,
        attrId: ad?.attrId,
        value: rawValue,
        isManual,
        hasValue: computed && autoVal !== undefined,
      };
    });
  };

  return (
    <div
      style={{
        flex: "0 0 60%",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${T.border.subtle}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600 }}>图鉴数据表</span>
          <span
            style={{
              fontSize: 9,
              color: T.text.muted,
              background: T.bg.elevated,
              padding: "1px 5px",
              borderRadius: 8,
              fontFamily: F.mono,
            }}
          >
            {sys.items.length}
          </span>
          {selectedIds.size > 0 && (
            <span style={{ fontSize: 9, color: multiSelectMode ? T.accent.yellow : T.accent.blue, fontWeight: 600 }}>
              已选{selectedIds.size}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <button
            onClick={() => {
              if (multiSelectMode) {
                setMultiSelectMode(false);
                setSelectedIds(new Set());
              } else {
                setMultiSelectMode(true);
              }
            }}
            style={{
              padding: "2px 8px",
              borderRadius: 3,
              border: `1px solid ${multiSelectMode ? T.accent.yellow + "60" : T.border.default}`,
              background: multiSelectMode ? `${T.accent.yellow}15` : "transparent",
              color: multiSelectMode ? T.accent.yellow : T.text.secondary,
              fontSize: 9,
              cursor: "pointer",
              fontWeight: multiSelectMode ? 600 : 400,
            }}
          >
            {multiSelectMode ? "✓ 多选" : "多选"}
          </button>
          <div style={{ width: 1, height: 12, background: T.border.subtle }} />
          <button
            onClick={() => setCollapsedGroups(new Set())}
            style={{
              padding: "2px 6px",
              borderRadius: 3,
              border: `1px solid ${T.border.default}`,
              background: "transparent",
              color: T.text.secondary,
              fontSize: 9,
              cursor: "pointer",
            }}
          >
            展开
          </button>
          <button
            onClick={() => setCollapsedGroups(new Set(sys.qualities.map((q) => q.star)))}
            style={{
              padding: "2px 6px",
              borderRadius: 3,
              border: `1px solid ${T.border.default}`,
              background: "transparent",
              color: T.text.secondary,
              fontSize: 9,
              cursor: "pointer",
            }}
          >
            折叠
          </button>
        </div>
      </div>

      {!sys.generated ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 36, opacity: 0.25 }}>📋</span>
          <span style={{ fontSize: 12, color: T.text.muted }}>配置品质后点击「生成底表」</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 74px 68px 38px 1fr 60px",
              alignItems: "center",
              padding: "4px 10px",
              background: T.bg.surface,
              borderBottom: `1px solid ${T.border.subtle}`,
              position: "sticky",
              top: 0,
              zIndex: 2,
              fontSize: 8,
              color: T.text.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontWeight: 600,
            }}
          >
            <span></span>
            <span>ID</span>
            <span>品质</span>
            <span>叠</span>
            <span>挂载属性</span>
            <span style={{ textAlign: "center", display: "flex", gap: 4, justifyContent: "center" }}>
              <button
                onClick={expandAllItems}
                style={{
                  padding: "1px 4px",
                  fontSize: 7,
                  border: `1px solid ${T.accent.blue}40`,
                  background: `${T.accent.blue}10`,
                  color: T.accent.blue,
                  borderRadius: 2,
                  cursor: "pointer",
                }}
                title="展开全部"
              >
                全展
              </button>
              <button
                onClick={collapseAllItems}
                style={{
                  padding: "1px 4px",
                  fontSize: 7,
                  border: `1px solid ${T.border.default}`,
                  background: "transparent",
                  color: T.text.secondary,
                  borderRadius: 2,
                  cursor: "pointer",
                }}
                title="收起全部"
              >
                全收
              </button>
            </span>
          </div>

          {Object.entries(groupedItems).map(([star, items]) => {
            const qTh = T.quality[star] || T.quality[1];
            const isC = collapsedGroups.has(Number(star));
            const qD = sys.qualities.find((q) => q.star === Number(star));
            const groupAllSel = items.length > 0 && items.every((it) => selectedIds.has(it.id));
            return (
              <div key={star}>
                {/* Quality Group Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    background: qTh.bg,
                    borderBottom: `1px solid ${qTh.border}`,
                    borderLeft: `3px solid ${qTh.color}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={groupAllSel}
                    onChange={() => selectAllInGroup(Number(star))}
                    style={{ accentColor: qTh.color, width: 11, height: 11, cursor: "pointer" }}
                  />
                  <span
                    onClick={() => toggleGroup(Number(star))}
                    style={{
                      cursor: "pointer",
                      fontSize: 8,
                      color: T.text.muted,
                      transform: isC ? "rotate(-90deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                    }}
                  >
                    ▼
                  </span>
                  <QBadge star={Number(star)} />
                  <span style={{ fontSize: 9, color: T.text.secondary }}>
                    {items.length}个 · 叠{qD?.maxStack} · 权重{qD?.weight}
                  </span>
                  <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono, marginLeft: "auto" }}>
                    {sys.code}
                    {String(star).padStart(2, "0")}xxx
                  </span>
                </div>

                {/* Items */}
                {!isC &&
                  items.map((item, idx) => {
                    const isSel = selectedIds.has(item.id);
                    const isExpanded = expandedItems.has(item.id);
                    const itemAttrs = getItemAttrList(item);
                    const hasAttrs = itemAttrs.length > 0;

                    const isDragOver = dragOverItemId === item.id && draggedAttr;
                    
                    return (
                      <div
                        key={item.id}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item.id)}
                        style={{
                          borderBottom: `1px solid ${T.border.subtle}`,
                          background: isDragOver 
                            ? `${T.accent.green}20` 
                            : isSel 
                              ? T.bg.active 
                              : idx % 2 === 0 
                                ? T.bg.app 
                                : T.bg.surface,
                          borderLeft: isDragOver ? `3px solid ${T.accent.green}` : "3px solid transparent",
                          transition: "background 0.15s, border-left 0.15s",
                        }}
                      >
                        {/* Item Row */}
                        <div
                          onClick={(e) => toggleSelect(item.id, e)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "32px 74px 68px 38px 1fr 60px",
                            alignItems: "center",
                            padding: "4px 10px",
                            fontSize: 10,
                            cursor: "pointer",
                          }}
                        >
                          <span onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={(e) => toggleSelect(item.id, e)}
                              style={{
                                accentColor: multiSelectMode ? T.accent.yellow : T.accent.blue,
                                width: 11,
                                height: 11,
                                cursor: "pointer",
                              }}
                            />
                          </span>
                          <span style={{ fontFamily: F.mono, color: T.text.secondary, fontSize: 9 }}>{item.id}</span>
                          <span>
                            <QBadge star={item.star} compact />
                          </span>
                          <span style={{ fontFamily: F.mono, color: T.text.secondary, textAlign: "center", fontSize: 10 }}>
                            {item.maxStack}
                          </span>

                          {/* 属性摘要（自适应显示） */}
                          <span ref={idx === 0 ? attrColRef : undefined} style={{ display: "flex", gap: 2, flexWrap: "nowrap", alignItems: "center", overflow: "hidden" }}>
                            {!hasAttrs ? (
                              <span style={{ color: T.text.muted, fontSize: 8 }}>未挂载</span>
                            ) : (
                              (() => {
                                // 动态计算能显示几个标签
                                let usedWidth = 0;
                                const gap = 2;
                                const moreWidth = 20; // "+n" 的宽度
                                let visibleCount = 0;
                                
                                for (let i = 0; i < itemAttrs.length; i++) {
                                  const a = itemAttrs[i];
                                  const tagWidth = estimateTagWidth(a.name, a.hasValue);
                                  const needed = usedWidth + tagWidth + (visibleCount > 0 ? gap : 0);
                                  const remaining = itemAttrs.length > i + 1 ? moreWidth : 0;
                                  
                                  if (needed + remaining <= colWidth) {
                                    usedWidth = needed;
                                    visibleCount++;
                                  } else {
                                    break;
                                  }
                                }
                                
                                return (
                                  <>
                                    {itemAttrs.slice(0, visibleCount).map((a) => (
                                      <span
                                        key={a.key}
                                        style={{
                                          padding: "1px 6px",
                                          borderRadius: 3,
                                          fontSize: 9,
                                          fontWeight: 500,
                                          background: `${T.accent.blue}15`,
                                          color: T.accent.blue,
                                          border: `1px solid ${T.accent.blue}30`,
                                          whiteSpace: "nowrap",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {a.name}
                                        {a.hasValue && (
                                          <span style={{ marginLeft: 4, color: T.accent.green, fontWeight: 600 }}>
                                            {formatSignedValue(a.value, a.valueType)}
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                    {itemAttrs.length > visibleCount && (
                                      <span style={{ fontSize: 8, color: T.text.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                                        +{itemAttrs.length - visibleCount}
                                      </span>
                                    )}
                                  </>
                                );
                              })()
                            )}
                          </span>

                          {/* 展开按钮 */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemExpand(item.id);
                            }}
                            style={{
                              textAlign: "center",
                              fontSize: 10,
                              color: hasAttrs ? T.accent.blue : T.text.muted,
                              cursor: hasAttrs ? "pointer" : "default",
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.15s",
                            }}
                          >
                            {hasAttrs ? "▼" : "—"}
                          </span>
                        </div>

                        {/* 展开的属性详情 */}
                        {isExpanded && hasAttrs && (
                          <div
                            style={{
                              padding: "6px 10px 8px 44px",
                              background: isSel ? `${T.accent.blue}05` : T.bg.elevated,
                              borderTop: `1px dashed ${T.border.subtle}`,
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {itemAttrs.map((a) => (
                                <div
                                  key={a.key}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 10,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: T.accent.blue,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span style={{ minWidth: 70, color: T.text.secondary }}>{a.name}</span>
                                  <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono }}>ID:{a.attrId}</span>

                                  {/* 数值显示/编辑 */}
                                  {computed && a.hasValue ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                                      <span
                                        style={{
                                          fontSize: 9,
                                          color: T.text.muted,
                                          padding: "0 4px",
                                          background: T.bg.input,
                                          borderRadius: 2,
                                        }}
                                      >
                                        {a.valueType === 2 ? "百分比" : a.valueType === 3 ? "小数" : "整数"}
                                      </span>
                                      <input
                                        value={a.isManual ? a.value : a.value || ""}
                                        onChange={(e) => setManualOverride(item.id, a.key, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          width: 70,
                                          padding: "2px 4px",
                                          background: a.isManual ? `${T.accent.yellow}12` : T.bg.input,
                                          border: `1px solid ${a.isManual ? T.accent.yellow + "40" : T.border.subtle}`,
                                          borderRadius: 3,
                                          color: a.isManual ? T.accent.yellow : T.accent.green,
                                          fontSize: 10,
                                          fontFamily: F.mono,
                                          fontWeight: 600,
                                          textAlign: "center",
                                          outline: "none",
                                        }}
                                        title={a.isManual ? "手动覆盖值" : "自动计算值"}
                                      />
                                      <span style={{ fontSize: 9, color: T.text.muted, minWidth: 50 }}>
                                        {formatValue(a.value, a.valueType)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ marginLeft: "auto", fontSize: 9, color: T.text.muted }}>
                                      {computed ? "未计算" : "—"}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
