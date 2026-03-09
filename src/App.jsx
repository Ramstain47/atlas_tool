import { useState, useMemo, useCallback } from "react";
import { createDefaultSystem } from "./constants/app";
import { T, F } from "./constants/theme";
import { useToast } from "./hooks/useToast";
import { useGlobalAttrs } from "./hooks/useGlobalAttrs";
import { useSaveSlots } from "./hooks/useSaveSlots";
import { useSystems } from "./hooks/useSystems";
import { TopNav } from "./components/layout/TopNav";
import { SystemConfig } from "./components/layout/SystemConfig";
import { DataGrid } from "./components/layout/DataGrid";
import { AttrPanel } from "./components/layout/AttrPanel";
import { NewSystemModal } from "./components/modals/NewSystemModal";
import { AddQualityModal } from "./components/modals/AddQualityModal";
import { ExportModal } from "./components/modals/ExportModal";
import { SelectAttrModal } from "./components/modals/SelectAttrModal";
import { AttrManagerModal } from "./components/modals/AttrManagerModal";
import { SaveManagerModal } from "./components/modals/SaveManagerModal";
import { LoadManagerModal } from "./components/modals/LoadManagerModal";

// ══════════════════════════════════════════════════════════
//  全局样式 - 清除浏览器默认边距
// ══════════════════════════════════════════════════════════
const globalStyles = document.createElement("style");
globalStyles.textContent = `* { margin: 0; padding: 0; box-sizing: border-box; } html, body, #root { width: 100%; height: 100%; overflow: hidden; }`;
document.head.appendChild(globalStyles);

// ══════════════════════════════════════════════════════════
//  启动存档选择界面
// ══════════════════════════════════════════════════════════
function BootScreen({ saveSlots, maxSlots, getSlotInfo, onLoad, onNew, onLoadAutoSave }) {
  const hasAnySave = saveSlots.some((s) => s !== null);
  const hasAutoSave = localStorage.getItem("codex_systems") !== null;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: T.bg.app,
        color: T.text.primary,
        fontFamily: F.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>📚 图鉴数值配置工具</div>
        <div style={{ fontSize: 12, color: T.text.secondary }}>选择存档开始或创建新的配置</div>
      </div>

      {/* 快捷操作区域 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          justifyContent: "center",
        }}
      >
        {/* 新建配置选项 */}
        <div
          onClick={onNew}
          style={{
            padding: "14px 32px",
            background: `${T.accent.green}10`,
            borderRadius: 8,
            border: `2px dashed ${T.accent.green}50`,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 120,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${T.accent.green}20`;
            e.currentTarget.style.borderColor = T.accent.green;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${T.accent.green}10`;
            e.currentTarget.style.borderColor = `${T.accent.green}50`;
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>+</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.accent.green }}>新建配置</div>
          <div style={{ fontSize: 8, color: T.text.muted, marginTop: 2 }}>从默认模板开始</div>
        </div>

        {/* 自动保存恢复 */}
        {hasAutoSave && (
          <div
            onClick={onLoadAutoSave}
            style={{
              padding: "14px 32px",
              background: `${T.accent.yellow}10`,
              borderRadius: 8,
              border: `2px dashed ${T.accent.yellow}50`,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 120,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${T.accent.yellow}20`;
              e.currentTarget.style.borderColor = T.accent.yellow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${T.accent.yellow}10`;
              e.currentTarget.style.borderColor = `${T.accent.yellow}50`;
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>💾</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.accent.yellow }}>自动保存</div>
            <div style={{ fontSize: 8, color: T.text.muted, marginTop: 2 }}>恢复上次数据</div>
          </div>
        )}
      </div>

      {/* 存档槽位网格 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 10,
          maxWidth: 700,
          width: "90%",
          maxHeight: 380,
          overflow: "auto",
          padding: 4,
        }}
      >
        {Array.from({ length: maxSlots }, (_, i) => {
          const slot = saveSlots[i];
          const info = getSlotInfo(slot);
          const isEmpty = !slot;

          return (
            <div
              key={i}
              onClick={() => !isEmpty && onLoad(i)}
              style={{
                padding: 12,
                background: isEmpty ? T.bg.input : T.bg.elevated,
                borderRadius: 8,
                border: `2px solid ${isEmpty ? T.border.subtle : T.accent.blue + "50"}`,
                cursor: isEmpty ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 100,
                opacity: isEmpty ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isEmpty) {
                  e.currentTarget.style.borderColor = T.accent.blue;
                  e.currentTarget.style.background = `${T.accent.blue}10`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isEmpty) {
                  e.currentTarget.style.borderColor = T.accent.blue + "50";
                  e.currentTarget.style.background = T.bg.elevated;
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? T.text.muted : T.accent.blue }}>
                  存档 {i + 1}
                </span>
                {isEmpty && (
                  <span
                    style={{
                      fontSize: 8,
                      color: T.text.muted,
                      padding: "1px 4px",
                      background: T.bg.surface,
                      borderRadius: 2,
                    }}
                  >
                    空
                  </span>
                )}
              </div>

              {isEmpty ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <span style={{ fontSize: 9, color: T.text.muted }}>无数据</span>
                </div>
              ) : (
                <div style={{ fontSize: 9, color: T.text.secondary }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span>系统:</span>
                    <span style={{ color: T.text.primary }}>{slot.systems?.length || 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span>图鉴:</span>
                    <span style={{ color: T.text.primary }}>{info?.totalItems || 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>属性:</span>
                    <span style={{ color: T.text.primary }}>{info?.totalAttrs || 0}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 4,
                      borderTop: `1px solid ${T.border.subtle}`,
                      color: T.text.muted,
                      fontSize: 8,
                      textAlign: "center",
                    }}
                  >
                    {info?.time}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasAnySave && !hasAutoSave && (
        <div style={{ marginTop: 24, fontSize: 10, color: T.text.muted, textAlign: "center" }}>
          欢迎使用！点击「新建配置」开始使用，或从自动保存恢复数据
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  主应用
// ══════════════════════════════════════════════════════════
export default function App() {
  // ── Hooks ──
  const { toast, showToast } = useToast();
  const { globalAttrs, setGlobalAttrs } = useGlobalAttrs(showToast);
  const { saveSlots, maxSlots, handleSaveToSlot, handleLoadFromSlot, handleDeleteSlot, getSlotInfo } = useSaveSlots(showToast);

  // ── Boot State ──
  const [booted, setBooted] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // ── UI State ──
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [, setComputedUI] = useState(false);

  // ── Modal State ──
  const [showNewSystem, setShowNewSystem] = useState(false);
  const [showAddQuality, setShowAddQuality] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showAttrManager, setShowAttrManager] = useState(false);
  const [showSelectFromManager, setShowSelectFromManager] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showLoadManager, setShowLoadManager] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [regenCheckInfo, setRegenCheckInfo] = useState(null);

  // ── Form State ──
  const [newQStar, setNewQStar] = useState("2");
  const [newQCount, setNewQCount] = useState("10");
  const [newQStack, setNewQStack] = useState("10");
  const [newQWeight, setNewQWeight] = useState("1");

  // ── Systems Hook ──
  const {
    systems,
    setSystems,
    activeSystemId,
    setActiveSystemId,
    activeSystem,
    updateSystem,
    addSystem,
    deleteSystem,
    addQuality,
    removeQuality,
    updateQuality,
    handleGenerate,
    doGenerate,
    addAttrToPool,
    removeFromPool,
    mountAttrToItems,
    unmountAttrFromItems,
    updateAttrConfig,
    setManualOverride,
    clearAllOverrides,
    attrMap,
    usedAttrs,
    mountCounts,
    attrResults,
    actualTotals,
    computed,
    handleCompute,
    groupedItems,
  } = useSystems(showToast, setComputedUI, initialData);

  // ── Computed Values ──

  const availableForSelection = useMemo(() => {
    const poolKeys = new Set((activeSystem?.attrPool || []).map((a) => a.key));
    return globalAttrs.filter((a) => !poolKeys.has(a.key));
  }, [globalAttrs, activeSystem?.attrPool]);

  // ── Event Handlers ──
  const handleAddSystem = useCallback(
    (name, code) => {
      return addSystem(name, code);
    },
    [addSystem]
  );

  const handleAddQualitySubmit = useCallback(() => {
    return addQuality(newQStar, newQCount, newQStack, newQWeight);
  }, [addQuality, newQStar, newQCount, newQStack, newQWeight]);

  const handleMountAttr = useCallback(
    (attr) => {
      if (addAttrToPool(attr)) {
        setShowSelectFromManager(false);
      }
    },
    [addAttrToPool]
  );

  // 批量添加属性到属性池
  const handleMountMultipleAttrs = useCallback(
    (attrs) => {
      let addedCount = 0;
      attrs.forEach((attr) => {
        if (addAttrToPool(attr)) {
          addedCount++;
        }
      });
      if (addedCount > 0) {
        showToast(`已添加 ${addedCount} 个属性到属性池`, "green");
        setShowSelectFromManager(false);
      }
    },
    [addAttrToPool, showToast]
  );

  const handleSaveSlot = useCallback(
    (slotIndex) => {
      handleSaveToSlot(systems, globalAttrs, slotIndex);
    },
    [handleSaveToSlot, systems, globalAttrs]
  );

  const handleLoadSlot = useCallback(
    (slotIndex) => {
      const data = handleLoadFromSlot(slotIndex);
      if (data) {
        if (data.systems && Array.isArray(data.systems)) {
          setSystems(data.systems);
          setActiveSystemId(data.systems[0]?.id || "");
        }
        if (data.globalAttrs && Array.isArray(data.globalAttrs)) {
          setGlobalAttrs(data.globalAttrs);
        }
        setComputedUI(false);
        // 如果是在启动界面，标记为已启动
        if (!booted) {
          setBooted(true);
        } else {
          // 如果在应用内，关闭读档管理器
          setShowLoadManager(false);
        }
      }
    },
    [handleLoadFromSlot, setSystems, setGlobalAttrs, setActiveSystemId, booted]
  );

  // 新建配置
  const handleNewConfig = useCallback(() => {
    setInitialData({
      systems: [{ ...createDefaultSystem("摸鱼宝库", "101"), id: "sys1" }],
      globalAttrs: [...globalAttrs],
    });
    setBooted(true);
    showToast("已创建新配置", "green");
  }, [globalAttrs, showToast]);

  // 从自动保存恢复
  const handleLoadAutoSave = useCallback(() => {
    const saved = localStorage.getItem("codex_systems");
    const savedAttrs = localStorage.getItem("codex_global_attrs");
    if (saved) {
      try {
        const systems = JSON.parse(saved);
        const globalAttrs = savedAttrs ? JSON.parse(savedAttrs) : [];
        setInitialData({ systems, globalAttrs });
        setBooted(true);
        showToast("已从自动保存恢复", "green");
      } catch {
        showToast("自动保存数据损坏", "red");
      }
    }
  }, [showToast]);

  // ── Generate Handlers ──
  const handleGenerateClick = useCallback(() => {
    handleGenerate((checkInfo) => {
      setRegenCheckInfo(checkInfo);
      setShowRegenConfirm(true);
    });
  }, [handleGenerate]);

  const handleConfirmRegenerate = useCallback(() => {
    doGenerate();
    setShowRegenConfirm(false);
    setRegenCheckInfo(null);
  }, [doGenerate]);

  const handleExport = useCallback(() => {
    const rows = [["id", "attr_id", "system", "quality", "max_stack", "reward"]];
    for (const s of systems) {
      for (const item of s.items) {
        const rewards = [];
        for (const attrKey of item.attrs) {
          const ad = s.attrPool.find((a) => a.key === attrKey);
          const r = attrResults[attrKey];
          const ok = `${item.id}_${attrKey}`;
          const ov = s.manualOverrides[ok];
          const av = r?.values?.[item.star]?.final || 0;
          const val = ov !== undefined && ov !== null ? ov : av;
          if (val > 0 || (item.attrs || []).includes(attrKey)) rewards.push(`${ad?.attrId || attrKey},${val}`);
        }
        rows.push([item.id, "", s.name, item.star, item.maxStack, rewards.join(";")]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codex_config.csv";
    a.click();
    URL.revokeObjectURL(url);
    setShowExportConfirm(false);
    showToast("导出成功", "green");
  }, [systems, attrResults, showToast]);

  // ══════════════════════
  //  RENDER
  // ══════════════════════

  // 启动界面
  if (!booted) {
    return (
      <BootScreen
        saveSlots={saveSlots}
        maxSlots={maxSlots}
        getSlotInfo={getSlotInfo}
        onLoad={handleLoadSlot}
        onNew={handleNewConfig}
        onLoadAutoSave={handleLoadAutoSave}
      />
    );
  }

  // 主应用界面
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: T.bg.app,
        color: T.text.primary,
        fontFamily: F.sans,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            padding: "7px 18px",
            borderRadius: 7,
            background: toast.type === "red" ? "#EF535020" : toast.type === "yellow" ? "#FFB30020" : "#4CAF5020",
            border: `1px solid ${toast.type === "red" ? T.accent.red : toast.type === "yellow" ? T.accent.yellow : T.accent.green}40`,
            color: toast.type === "red" ? T.accent.red : toast.type === "yellow" ? T.accent.yellow : T.accent.green,
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: "blur(8px)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ═══ TOP NAV ═══ */}
      <TopNav
        systems={systems}
        activeSystemId={activeSystemId}
        setActiveSystemId={setActiveSystemId}
        deleteSystem={deleteSystem}
        setShowNewSystem={setShowNewSystem}
        setShowAttrManager={setShowAttrManager}
        setShowLoadManager={setShowLoadManager}
        setShowSaveManager={setShowSaveManager}
        computed={computed}
        showToast={showToast}
        setShowExportConfirm={setShowExportConfirm}
      />

      {/* ═══ SYSTEM CONFIG ═══ */}
      <SystemConfig
        sys={activeSystem}
        configCollapsed={configCollapsed}
        setConfigCollapsed={setConfigCollapsed}
        updateSystem={updateSystem}
        updateQuality={updateQuality}
        removeQuality={removeQuality}
        handleGenerate={handleGenerateClick}
        setShowAddQuality={setShowAddQuality}
        setNewQStar={setNewQStar}
      />

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── LEFT: Data Grid ── */}
        <DataGrid
          sys={activeSystem}
          groupedItems={groupedItems}
          collapsedGroups={collapsedGroups}
          setCollapsedGroups={setCollapsedGroups}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          multiSelectMode={multiSelectMode}
          setMultiSelectMode={setMultiSelectMode}

          attrMap={attrMap}
          computed={computed}
          attrResults={attrResults}
          setManualOverride={setManualOverride}
        />

        {/* ── RIGHT: Attribute Dashboard ── */}
        <AttrPanel
          sys={activeSystem}
          usedAttrs={usedAttrs}
          attrMap={attrMap}
          mountCounts={mountCounts}
          selectedIds={selectedIds}
          setShowSelectFromManager={setShowSelectFromManager}
          mountAttrToItems={mountAttrToItems}
          unmountAttrFromItems={unmountAttrFromItems}
          removeFromPool={removeFromPool}
          attrResults={attrResults}
          actualTotals={actualTotals}
          computed={computed}
          updateAttrConfig={updateAttrConfig}
          handleCompute={handleCompute}
          clearAllOverrides={clearAllOverrides}
          showToast={showToast}
          setSelectedIds={setSelectedIds}
          setMultiSelectMode={setMultiSelectMode}
        />
      </div>

      {/* ═══ MODALS ═══ */}
      <NewSystemModal open={showNewSystem} onClose={() => setShowNewSystem(false)} onCreate={handleAddSystem} />

      <AddQualityModal
        open={showAddQuality}
        onClose={() => setShowAddQuality(false)}
        onAdd={handleAddQualitySubmit}
        qualities={activeSystem.qualities}
        star={newQStar}
        setStar={setNewQStar}
        count={newQCount}
        setCount={setNewQCount}
        stack={newQStack}
        setStack={setNewQStack}
        weight={newQWeight}
        setWeight={setNewQWeight}
      />

      <ExportModal open={showExportConfirm} onClose={() => setShowExportConfirm(false)} systems={systems} onExport={handleExport} />

      <SelectAttrModal
        key={showSelectFromManager ? "open" : "closed"}
        open={showSelectFromManager}
        onClose={() => setShowSelectFromManager(false)}
        availableAttrs={availableForSelection}
        onSelect={handleMountAttr}
        onSelectMultiple={handleMountMultipleAttrs}
      />

      <AttrManagerModal
        open={showAttrManager}
        onClose={() => setShowAttrManager(false)}
        globalAttrs={globalAttrs}
        setGlobalAttrs={setGlobalAttrs}
        showToast={showToast}
        onAddToPool={handleMountAttr}
      />

      <SaveManagerModal
        open={showSaveManager}
        onClose={() => setShowSaveManager(false)}
        maxSlots={maxSlots}
        saveSlots={saveSlots}
        getSlotInfo={getSlotInfo}
        onSave={handleSaveSlot}
      />

      <LoadManagerModal
        open={showLoadManager}
        onClose={() => setShowLoadManager(false)}
        maxSlots={maxSlots}
        saveSlots={saveSlots}
        getSlotInfo={getSlotInfo}
        onLoad={handleLoadSlot}
        onDelete={handleDeleteSlot}
      />

      {/* Regenerate Confirm Modal */}
      {showRegenConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
          }}
          onClick={() => setShowRegenConfirm(false)}
        >
          <div
            style={{
              background: T.bg.elevated,
              borderRadius: 10,
              border: `1px solid ${T.border.default}`,
              padding: 18,
              width: 360,
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>确认重新生成底表？</div>
            <div style={{ fontSize: 11, color: T.text.secondary, marginBottom: 16, lineHeight: 1.5 }}>
              有挂载属性的条目将丢失（{regenCheckInfo?.losingCount || 0}个），确认重新生成？
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRegenConfirm(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 5,
                  border: `1px solid ${T.border.default}`,
                  background: "transparent",
                  color: T.text.secondary,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmRegenerate}
                style={{
                  padding: "6px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: T.accent.red,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
