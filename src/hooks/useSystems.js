import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { saveSystems } from "../utils/storage";
import { createDefaultSystem } from "../constants/app";
import { computeAttribute } from "../utils/compute";
import { generateItems, generatePreviewIds } from "../utils/format";

export function useSystems(showToast, setComputed, initialData = null) {
  const [systems, setSystems] = useState(() => {
    // 如果提供了初始数据（从存档加载），使用它
    if (initialData?.systems) return initialData.systems;
    // 否则返回空数组，等待用户选择存档
    return [];
  });

  const [activeSystemId, setActiveSystemId] = useState(() => {
    if (initialData?.systems?.[0]?.id) return initialData.systems[0].id;
    return "";
  });
  const [computed, setComputedState] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    saveSystems(systems);
  }, [systems]);

  const activeSystem = useMemo(
    () => systems.find((s) => s.id === activeSystemId) || systems[0] || { qualities: [], items: [], attrPool: [], attrConfigs: {}, manualOverrides: {}, generated: false },
    [systems, activeSystemId]
  );

  const updateSystem = useCallback(
    (updater) => {
      setSystems((prev) =>
        prev.map((s) =>
          s.id === activeSystemId
            ? typeof updater === "function"
              ? updater(s)
              : { ...s, ...updater }
            : s
        )
      );
      setComputed(false);
    },
    [activeSystemId, setComputed]
  );

  // use ref to avoid circular dependencies
  const updateSystemRef = useRef(updateSystem);
  useEffect(() => {
    updateSystemRef.current = updateSystem;
  }, [updateSystem]);

  const addSystem = useCallback(
    (name, code, template = null) => {
      if (!name.trim() || !code.trim()) {
        showToast("请填写名称和ID段", "red");
        return false;
      }
      if (systems.find((s) => s.code === code.trim())) {
        showToast("ID段已存在", "red");
        return false;
      }
      const ns = createDefaultSystem(name.trim(), code.trim());
      
      // 如果提供了模板，应用模板配置
      if (template) {
        ns.qualities = template.qualities.map((q) => ({ ...q }));
        ns.attrPool = template.attrPool.map((a) => ({ ...a }));
        ns.attrConfigs = { ...template.attrConfigs };
      }
      
      setSystems((prev) => [...prev, ns]);
      setActiveSystemId(ns.id);
      setComputed(false);
      
      if (template) {
        showToast(`系统 "${name.trim()}" 已使用模板创建`, "green");
      } else {
        showToast(`系统 "${name.trim()}" 已创建`, "green");
      }
      return true;
    },
    [systems, showToast, setComputed]
  );

  const deleteSystem = useCallback(
    (sysId) => {
      if (systems.length <= 1) {
        showToast("至少保留一个系统", "red");
        return false;
      }
      setSystems((prev) => prev.filter((s) => s.id !== sysId));
      if (activeSystemId === sysId) {
        setActiveSystemId(systems.find((s) => s.id !== sysId)?.id || "");
      }
      showToast("系统已删除", "green");
      return true;
    },
    [systems, activeSystemId, showToast]
  );

  // Quality CRUD
  const addQuality = useCallback(
    (star, count, maxStack, weight) => {
      const s = Number(star);
      if (activeSystem.qualities.find((q) => q.star === s)) {
        showToast("该品质已存在", "red");
        return false;
      }
      updateSystem((sys) => ({
        ...sys,
        qualities: [
          ...sys.qualities,
          { star: s, count: Number(count) || 1, maxStack: Number(maxStack) || 1, weight: parseFloat(weight) || 1 },
        ].sort((a, b) => a.star - b.star),
      }));
      return true;
    },
    [activeSystem, updateSystem, showToast]
  );

  const removeQuality = useCallback(
    (star) => {
      updateSystem((sys) => ({
        ...sys,
        qualities: sys.qualities.filter((q) => q.star !== star),
      }));
      showToast("品质已移除", "yellow");
    },
    [updateSystem, showToast]
  );

  const updateQuality = useCallback(
    (star, field, value) => {
      const parsed = field === "weight" ? parseFloat(value) || 0 : Number(value) || 0;
      const clamped = field === "weight" ? Math.round(parsed * 100) / 100 : parsed;
      updateSystem((sys) => ({
        ...sys,
        qualities: sys.qualities.map((q) => (q.star === star ? { ...q, [field]: clamped } : q)),
      }));
    },
    [updateSystem]
  );

  // 检测重新生成是否会导致挂载属性丢失
  const checkRegenerateImpact = useCallback(() => {
    const { qualities, code, items } = activeSystem;
    if (items.length === 0) return { willLose: false, losingIds: [] };

    // 获取当前有挂载属性的条目ID
    const currentWithAttrs = items
      .filter((it) => (it.attrs || []).length > 0)
      .map((it) => it.id);

    if (currentWithAttrs.length === 0) return { willLose: false, losingIds: [] };

    // 预览新配置会生成的ID
    const previewIds = generatePreviewIds(qualities, code);

    // 检测哪些有属性的条目会丢失
    const losingIds = currentWithAttrs.filter((id) => !previewIds.has(id));

    return {
      willLose: losingIds.length > 0,
      losingIds,
      losingCount: losingIds.length,
    };
  }, [activeSystem]);

  // 实际执行生成（带属性恢复）
  const doGenerate = useCallback(() => {
    if (activeSystem.qualities.length === 0) {
      showToast("请先添加品质层级", "red");
      return;
    }

    // 保存现有条目的属性映射
    const attrsMap = new Map();
    activeSystem.items.forEach((item) => {
      if ((item.attrs || []).length > 0) {
        attrsMap.set(item.id, item.attrs);
      }
    });

    // 生成新条目
    const newItems = generateItems(activeSystem.qualities, activeSystem.code);

    // 恢复属性（如果能匹配到ID），同时更新 maxStack
    const finalItems = newItems.map((item) => {
      const attrs = attrsMap.get(item.id) || [];
      return {
        ...item,
        attrs,
      };
    });

    updateSystem({ items: finalItems, generated: true });
    setComputed(false);
    showToast(`已生成 ${finalItems.length} 个图鉴`, "green");
  }, [activeSystem, updateSystem, showToast, setComputed]);

  // Item generation with check
  const handleGenerate = useCallback(
    (onConfirmRequired) => {
      if (activeSystem.qualities.length === 0) {
        showToast("请先添加品质层级", "red");
        return { needConfirm: false };
      }

      const check = checkRegenerateImpact();

      if (check.willLose) {
        // 需要确认，返回检测信息，由调用方处理弹窗
        if (onConfirmRequired) {
          onConfirmRequired(check);
        }
        return { needConfirm: true, check };
      }

      // 安全，直接执行
      doGenerate();
      return { needConfirm: false };
    },
    [activeSystem, checkRegenerateImpact, doGenerate, showToast]
  );

  // Attribute pool management
  const addAttrToPool = useCallback(
    (attr) => {
      if (activeSystem.attrPool.find((a) => a.key === attr.key)) {
        showToast("属性已在当前系统属性池中", "yellow");
        return false;
      }
      updateSystem((sys) => ({ ...sys, attrPool: [...sys.attrPool, { ...attr }] }));
      showToast(`属性 "${attr.name}" 已添加到属性池`, "green");
      return true;
    },
    [activeSystem, updateSystem, showToast]
  );

  const removeFromPool = useCallback(
    (key, usedAttrs) => {
      if (usedAttrs.includes(key)) {
        showToast("该属性已被挂载到图鉴，无法移除", "red");
        return false;
      }
      updateSystem((sys) => ({ ...sys, attrPool: sys.attrPool.filter((a) => a.key !== key) }));
      showToast("属性已从属性池移除", "green");
      return true;
    },
    [updateSystem, showToast]
  );

  // Attribute mounting
  const mountAttrToItems = useCallback(
    (attrKey, itemIds) => {
      if (itemIds.size === 0) {
        showToast("请先在左侧选择图鉴", "yellow");
        return false;
      }
      updateSystem((sys) => ({
        ...sys,
        items: sys.items.map((it) => {
          if (!itemIds.has(it.id)) return it;
          const attrs = it.attrs || [];
          if (attrs.includes(attrKey)) return it;
          return { ...it, attrs: [...attrs, attrKey] };
        }),
      }));
      return true;
    },
    [updateSystem, showToast]
  );

  const unmountAttrFromItems = useCallback(
    (attrKey, itemIds) => {
      if (itemIds.size === 0) {
        showToast("请先在左侧选择图鉴", "yellow");
        return false;
      }
      updateSystem((sys) => ({
        ...sys,
        items: sys.items.map((it) => {
          if (!itemIds.has(it.id)) return it;
          const attrs = it.attrs || [];
          return { ...it, attrs: attrs.filter((a) => a !== attrKey) };
        }),
      }));
      return true;
    },
    [updateSystem, showToast]
  );

  // Attr config
  const updateAttrConfig = useCallback(
    (attr, field, value) => {
      updateSystem((sys) => ({
        ...sys,
        attrConfigs: {
          ...sys.attrConfigs,
          [attr]: {
            ...(sys.attrConfigs[attr] || { limit: 0, unit: 1, mode: "round" }),
            [field]: value,
          },
        },
      }));
    },
    [updateSystem]
  );

  const setManualOverride = useCallback(
    (itemId, attr, value) => {
      updateSystem((sys) => ({
        ...sys,
        manualOverrides: {
          ...sys.manualOverrides,
          [`${itemId}_${attr}`]: value === "" ? undefined : Number(value),
        },
      }));
    },
    [updateSystem]
  );

  const clearAllOverrides = useCallback(() => {
    updateSystem({ manualOverrides: {} });
    showToast("已清除所有手动覆盖", "green");
  }, [updateSystem, showToast]);

  // Computations
  const attrMap = useMemo(() => {
    const m = {};
    (activeSystem.attrPool || []).forEach((a) => {
      m[a.key] = a;
    });
    return m;
  }, [activeSystem.attrPool]);

  const usedAttrs = useMemo(() => {
    const set = new Set();
    (activeSystem.items || []).forEach((it) => (it.attrs || []).forEach((a) => set.add(a)));
    return Array.from(set);
  }, [activeSystem.items]);

  const mountCounts = useMemo(() => {
    const counts = {};
    (activeSystem.items || []).forEach((it) => {
      (it.attrs || []).forEach((a) => {
        if (!counts[a]) counts[a] = {};
        counts[a][it.star] = (counts[a][it.star] || 0) + 1;
      });
    });
    return counts;
  }, [activeSystem.items]);

  // Ensure attrConfigs exist
  useEffect(() => {
    const missing = usedAttrs.filter((a) => !activeSystem.attrConfigs[a]);
    if (missing.length > 0) {
      setTimeout(() => {
        updateSystemRef.current((s) => {
          const next = { ...s.attrConfigs };
          missing.forEach((a) => {
            next[a] = { limit: 0, unit: 1, mode: "round" };
          });
          return { ...s, attrConfigs: next };
        });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedAttrs]);

  const attrResults = useMemo(() => {
    if (!computed) return {};
    const r = {};
    for (const attr of usedAttrs) {
      const cfg = activeSystem.attrConfigs[attr];
      if (!cfg) continue;
      r[attr] = computeAttribute(
        attr,
        activeSystem.items,
        activeSystem.qualities,
        Number(cfg.limit) || 0,
        Number(cfg.unit) || 1,
        cfg.mode || "round"
      );
    }
    return r;
  }, [computed, usedAttrs, activeSystem]);

  const actualTotals = useMemo(() => {
    if (!computed) return {};
    const totals = {};
    for (const attr of usedAttrs) {
      const r = attrResults[attr];
      if (!r) continue;
      let total = 0;
      for (const item of activeSystem.items) {
        if (!(item.attrs || []).includes(attr)) continue;
        const ok = `${item.id}_${attr}`;
        const ov = activeSystem.manualOverrides[ok];
        const av = r.values[item.star]?.final || 0;
        total += (ov !== undefined && ov !== null ? ov : av) * item.maxStack;
      }
      totals[attr] = total;
    }
    return totals;
  }, [computed, usedAttrs, attrResults, activeSystem]);

  const handleCompute = useCallback(() => {
    if (usedAttrs.length === 0) {
      showToast("请先为图鉴挂载属性", "red");
      return;
    }
    setComputedState(true);
    setComputed(true);
    showToast("计算完成", "green");
  }, [usedAttrs, showToast, setComputed]);

  const groupedItems = useMemo(() => {
    const g = {};
    (activeSystem?.qualities || []).forEach((q) => {
      g[q.star] = [];
    });
    (activeSystem?.items || []).forEach((it) => {
      if (g[it.star]) g[it.star].push(it);
    });
    return g;
  }, [activeSystem]);

  return {
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
    checkRegenerateImpact,
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
  };
}
