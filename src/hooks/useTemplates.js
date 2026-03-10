// ══════════════════════════════════════════════════════════
//  模板管理 Hook
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEY_TEMPLATES } from "../constants/app";

function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
}

export function useTemplates(showToast) {
  const [templates, setTemplates] = useState(loadTemplates);

  // Persist to localStorage
  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  const createTemplate = useCallback(
    (name, system) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        showToast("请输入模板名称", "red");
        return false;
      }

      // Check for duplicate names
      if (templates.some((t) => t.name === trimmedName)) {
        showToast("模板名称已存在，请使用其他名称", "red");
        return false;
      }

      const template = {
        id: "tpl_" + Date.now() + Math.random().toString(36).slice(2, 6),
        name: trimmedName,
        qualities: system.qualities.map((q) => ({ ...q })),
        attrPool: system.attrPool.map((a) => ({ ...a })),
        attrConfigs: { ...system.attrConfigs },
        createdAt: Date.now(),
      };

      setTemplates((prev) => [...prev, template]);
      showToast(`模板 "${trimmedName}" 已保存`, "green");
      return true;
    },
    [templates, showToast]
  );

  const deleteTemplate = useCallback(
    (id) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast("模板已删除", "green");
      return true;
    },
    [showToast]
  );

  const renameTemplate = useCallback(
    (id, newName) => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        showToast("请输入模板名称", "red");
        return false;
      }

      // Check for duplicate names (excluding self)
      if (templates.some((t) => t.id !== id && t.name === trimmedName)) {
        showToast("模板名称已存在，请使用其他名称", "red");
        return false;
      }

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name: trimmedName } : t))
      );
      showToast("模板已重命名", "green");
      return true;
    },
    [templates, showToast]
  );

  const getTemplateById = useCallback(
    (id) => {
      return templates.find((t) => t.id === id) || null;
    },
    [templates]
  );

  return {
    templates,
    createTemplate,
    deleteTemplate,
    renameTemplate,
    getTemplateById,
  };
}
