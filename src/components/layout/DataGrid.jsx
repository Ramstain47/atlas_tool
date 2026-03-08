import { T, F } from "../../constants/theme";
import { QBadge } from "../ui/QBadge";
import { formatValue } from "../../utils/format";

export function DataGrid({
  sys,
  groupedItems,
  collapsedGroups,
  setCollapsedGroups,
  selectedIds,
  setSelectedIds,
  multiSelectMode,
  setMultiSelectMode,
  valueColumns,
  attrMap,
  computed,
  attrResults,
  setManualOverride,
}) {
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
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `32px 74px 68px 38px 1fr ${valueColumns.map(() => "62px").join(" ")}`,
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
            <span>属性</span>
            {valueColumns.map((a) => (
              <span key={a} style={{ textAlign: "center" }}>
                {attrMap[a]?.name?.slice(0, 3) || a}
              </span>
            ))}
          </div>

          {Object.entries(groupedItems).map(([star, items]) => {
            const qTh = T.quality[star] || T.quality[1];
            const isC = collapsedGroups.has(Number(star));
            const qD = sys.qualities.find((q) => q.star === Number(star));
            const groupAllSel = items.length > 0 && items.every((it) => selectedIds.has(it.id));
            return (
              <div key={star}>
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
                {!isC &&
                  items.map((item, idx) => {
                    const isSel = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => toggleSelect(item.id, e)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: `32px 74px 68px 38px 1fr ${valueColumns.map(() => "62px").join(" ")}`,
                          alignItems: "center",
                          padding: "3px 10px",
                          background: isSel ? T.bg.active : idx % 2 === 0 ? T.bg.app : T.bg.surface,
                          borderBottom: `1px solid ${T.border.subtle}`,
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
                        <span style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          {(item.attrs || []).length === 0 && <span style={{ color: T.text.muted, fontSize: 8 }}>未挂载</span>}
                          {(item.attrs || []).map((a) => (
                            <span
                              key={a}
                              style={{
                                padding: "0 3px",
                                borderRadius: 2,
                                fontSize: 8,
                                fontWeight: 500,
                                background: `${T.accent.blue}15`,
                                color: T.accent.blue,
                                border: `1px solid ${T.accent.blue}30`,
                              }}
                            >
                              {attrMap[a]?.name?.slice(0, 3) || a}
                            </span>
                          ))}
                        </span>
                        {valueColumns.map((attr) => {
                          if (!(item.attrs || []).includes(attr))
                            return (
                              <span key={attr} style={{ color: T.text.muted, fontSize: 9, textAlign: "center" }}>
                                —
                              </span>
                            );
                          const ad = attrMap[attr];
                          const autoVal = computed && attrResults[attr]?.values?.[item.star]?.final;
                          const ok = `${item.id}_${attr}`;
                          const ov = sys.manualOverrides[ok];
                          const isManual = ov !== undefined && ov !== null;
                          const rawDisplay = isManual ? ov : autoVal || "—";
                          const formatted = formatValue(rawDisplay, ad?.valueType || 1);
                          return (
                            <div key={attr} style={{ textAlign: "center" }}>
                              {computed ? (
                                <div style={{ position: "relative" }}>
                                  <input
                                    value={isManual ? ov : autoVal || ""}
                                    onChange={(e) => setManualOverride(item.id, attr, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      width: "100%",
                                      padding: "1px 2px",
                                      background: isManual ? `${T.accent.yellow}12` : "transparent",
                                      border: `1px solid ${isManual ? T.accent.yellow + "40" : "transparent"}`,
                                      borderRadius: 2,
                                      color: isManual ? T.accent.yellow : T.accent.green,
                                      fontSize: 10,
                                      fontFamily: F.mono,
                                      fontWeight: 600,
                                      textAlign: "center",
                                      outline: "none",
                                      boxSizing: "border-box",
                                    }}
                                    title={`原始值: ${rawDisplay} → 显示: ${formatted}`}
                                  />
                                  {ad?.valueType > 1 && <div style={{ fontSize: 7, color: T.text.muted, marginTop: -1 }}>{formatted}</div>}
                                </div>
                              ) : (
                                <span style={{ color: T.text.muted, fontSize: 9 }}>—</span>
                              )}
                            </div>
                          );
                        })}
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
