import { useState, useEffect, useCallback } from "react";
import { loadSaveSlots, saveSaveSlots, formatSaveTime } from "../utils/storage";
import { MAX_SAVE_SLOTS } from "../constants/app";

export function useSaveSlots(showToast) {
  const [saveSlots, setSaveSlots] = useState(() => loadSaveSlots());

  // Persist to localStorage
  useEffect(() => {
    saveSaveSlots(saveSlots);
  }, [saveSlots]);

  const handleSaveToSlot = useCallback(
    (systems, globalAttrs, slotIndex) => {
      try {
        const saveData = {
          systems,
          globalAttrs,
          timestamp: Date.now(),
          version: "1.0",
        };

        setSaveSlots((prev) => {
          const next = [...prev];
          while (next.length <= slotIndex) {
            next.push(null);
          }
          next[slotIndex] = saveData;
          return next;
        });

        showToast(`已保存到存档 ${slotIndex + 1}`, "green");
        return true;
      } catch {
        showToast("保存失败", "red");
        return false;
      }
    },
    [showToast]
  );

  const handleLoadFromSlot = useCallback(
    (slotIndex) => {
      const slot = saveSlots[slotIndex];
      if (!slot) {
        showToast("该存档为空", "red");
        return null;
      }
      showToast(`已从存档 ${slotIndex + 1} 加载`, "green");
      return slot;
    },
    [saveSlots, showToast]
  );

  const handleDeleteSlot = useCallback(
    (slotIndex) => {
      setSaveSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      showToast(`已删除存档 ${slotIndex + 1}`, "yellow");
    },
    [showToast]
  );

  const getSlotInfo = useCallback((slot) => {
    if (!slot || !slot.systems) return null;
    const totalItems = slot.systems.reduce((sum, s) => sum + (s.items?.length || 0), 0);
    const totalAttrs = slot.globalAttrs?.length || 0;
    return { totalItems, totalAttrs, time: formatSaveTime(slot.timestamp) };
  }, []);

  return {
    saveSlots,
    maxSlots: MAX_SAVE_SLOTS,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleDeleteSlot,
    getSlotInfo,
  };
}
