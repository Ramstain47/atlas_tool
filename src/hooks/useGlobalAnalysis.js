import { useMemo } from "react";
import { computeAttribute } from "../utils/compute";

export function useGlobalAnalysis(systems, globalAttrs, enabled) {
  return useMemo(() => {
    if (!enabled) return { attrTotals: {}, sysTotals: {}, skippedSystems: [], allAttrKeys: [], readySystems: [] };

    const attrTotals = {}; // { [attrKey]: { total, bySys: { [sysId]: value } } }
    const sysTotals = {};  // { [sysId]: { total, byAttr: { [attrKey]: value } } }
    const skippedSystems = [];
    const readySystems = [];
    const attrKeySet = new Set();

    for (const sys of systems) {
      // Skip systems that aren't ready
      if (!sys.generated || !sys.items?.length || !sys.attrConfigs || Object.keys(sys.attrConfigs).length === 0) {
        skippedSystems.push({ id: sys.id, name: sys.name });
        continue;
      }

      readySystems.push(sys);

      // Find used attrs for this system
      const usedAttrs = new Set();
      for (const item of sys.items) {
        for (const ak of item.attrs || []) usedAttrs.add(ak);
      }

      // Compute each attribute
      for (const attrKey of usedAttrs) {
        const cfg = sys.attrConfigs[attrKey];
        if (!cfg) continue;

        const result = computeAttribute(
          attrKey,
          sys.items,
          sys.qualities,
          Number(cfg.limit) || 0,
          Number(cfg.unit) || 1,
          cfg.mode || "round"
        );

        // Calculate actual total with manual overrides, also track per-quality
        let total = 0;
        const byQuality = {}; // { [star]: totalForThisTier }
        for (const item of sys.items) {
          if (!(item.attrs || []).includes(attrKey)) continue;
          const ok = `${item.id}_${attrKey}`;
          const ov = sys.manualOverrides?.[ok];
          const av = result.values[item.star]?.final || 0;
          const val = (ov !== undefined && ov !== null ? ov : av) * item.maxStack;
          total += val;
          byQuality[item.star] = (byQuality[item.star] || 0) + val;
        }

        attrKeySet.add(attrKey);

        // Accumulate into attrTotals
        if (!attrTotals[attrKey]) attrTotals[attrKey] = { total: 0, bySys: {} };
        attrTotals[attrKey].bySys[sys.id] = { total, byQuality };
        attrTotals[attrKey].total += total;

        // Accumulate into sysTotals
        if (!sysTotals[sys.id]) sysTotals[sys.id] = { total: 0, byAttr: {} };
        sysTotals[sys.id].byAttr[attrKey] = total;
        sysTotals[sys.id].total += total;
      }
    }

    return {
      attrTotals,
      sysTotals,
      skippedSystems,
      readySystems,
      allAttrKeys: [...attrKeySet],
    };
  }, [systems, globalAttrs, enabled]);
}
