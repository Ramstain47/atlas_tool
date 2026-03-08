import { useState, useEffect, useCallback } from "react";
import { loadGlobalAttrs, saveGlobalAttrs } from "../utils/storage";

export function useGlobalAttrs(showToast) {
  const [globalAttrs, setGlobalAttrs] = useState(() => loadGlobalAttrs());

  // Persist to localStorage
  useEffect(() => {
    saveGlobalAttrs(globalAttrs);
  }, [globalAttrs]);

  const addToManager = useCallback(
    (form) => {
      const key = form.key.trim().toLowerCase();
      const name = form.name.trim();
      const attrId = Number(form.attrId);

      if (!key || !name || !attrId) {
        showToast("请填写完整信息", "red");
        return false;
      }

      if (globalAttrs.find((a) => a.key === key)) {
        showToast("属性key已存在", "red");
        return false;
      }
      if (globalAttrs.find((a) => a.attrId === attrId)) {
        showToast("属性ID已存在", "red");
        return false;
      }

      const newAttr = {
        key,
        attrId,
        name,
        valueType: Number(form.valueType) || 1,
      };

      setGlobalAttrs((prev) => [...prev, newAttr]);
      return true;
    },
    [globalAttrs, showToast]
  );

  const updateManagerAttr = useCallback(
    (key, form) => {
      const name = form.name.trim();
      const attrId = Number(form.attrId);

      if (!name || !attrId) {
        showToast("请填写完整信息", "red");
        return false;
      }

      const existing = globalAttrs.find((a) => a.attrId === attrId && a.key !== key);
      if (existing) {
        showToast("属性ID已存在", "red");
        return false;
      }

      setGlobalAttrs((prev) =>
        prev.map((a) =>
          a.key === key ? { ...a, name, attrId, valueType: Number(form.valueType) || 1 } : a
        )
      );
      return true;
    },
    [globalAttrs, showToast]
  );

  const deleteFromManager = useCallback(
    (key) => {
      setGlobalAttrs((prev) => prev.filter((a) => a.key !== key));
      showToast("属性已从管理器删除", "yellow");
    },
    [showToast]
  );

  return {
    globalAttrs,
    setGlobalAttrs,
    addToManager,
    updateManagerAttr,
    deleteFromManager,
  };
}
