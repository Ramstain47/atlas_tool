import { useState, useMemo, useCallback } from "react";
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
//  主应用
// ══════════════════════════════════════════════════════════
export default function App() {
  // ── Hooks ──
  const { toast, showToast } = useToast();
  const { globalAttrs, setGlobalAttrs } = useGlobalAttrs(showToast);
  const { saveSlots, maxSlots, handleSaveToSlot, handleLoadFromSlot, handleDeleteSlot, getSlotInfo } = useSaveSlots(showToast);

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
  } = useSystems(showToast, setComputedUI);

  // ── Computed Values ──
  const valueColumns = useMemo(() => usedAttrs.slice(0, 4), [usedAttrs]);

  const availableForSelection = useMemo(() => {
    const poolKeys = new Set(activeSystem.attrPool.map((a) => a.key));
    return globalAttrs.filter((a) => !poolKeys.has(a.key));
  }, [globalAttrs, activeSystem.attrPool]);

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
          setActiveSystemId(data.systems[0]?.id || "sys1");
        }
        if (data.globalAttrs && Array.isArray(data.globalAttrs)) {
          setGlobalAttrs(data.globalAttrs);
        }
        setComputedUI(false);
        setShowLoadManager(false);
      }
    },
    [handleLoadFromSlot, setSystems, setGlobalAttrs, setActiveSystemId]
  );

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
          valueColumns={valueColumns}
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
        open={showSelectFromManager}
        onClose={() => setShowSelectFromManager(false)}
        availableAttrs={availableForSelection}
        onSelect={handleMountAttr}
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
