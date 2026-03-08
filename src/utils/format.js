// ══════════════════════════════════════════════════════════
//  格式化工具
// ══════════════════════════════════════════════════════════

// type 1: integer (raw value), type 2: percentage (val/10000), type 3: decimal (val/100)
export function formatValue(raw, valueType) {
  if (raw === null || raw === undefined || raw === "" || raw === "—") return "—";
  const n = Number(raw);
  if (isNaN(n)) return "—";
  if (valueType === 2) {
    const pct = (n / 10000) * 100;
    return pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(2).replace(/\.?0+$/, "")}%`;
  }
  if (valueType === 3) {
    const d = n / 100;
    return d % 1 === 0 ? String(d) : d.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }
  return String(n);
}

// ID Builder
export function buildId(sysCode, star, seq) {
  return `${sysCode}${String(star).padStart(2, "0")}${String(seq).padStart(3, "0")}`;
}

// 生成图鉴项目
export function generateItems(quals, sysCode) {
  const items = [];
  for (const q of quals) {
    for (let i = 0; i < q.count; i++) {
      items.push({
        id: buildId(sysCode, q.star, i + 1),
        star: q.star,
        maxStack: q.maxStack,
        attrs: [],
      });
    }
  }
  return items;
}

// 预览生成所有ID（用于检测是否有挂载属性丢失）
export function generatePreviewIds(quals, sysCode) {
  const ids = new Set();
  for (const q of quals) {
    for (let i = 0; i < q.count; i++) {
      ids.add(buildId(sysCode, q.star, i + 1));
    }
  }
  return ids;
}
