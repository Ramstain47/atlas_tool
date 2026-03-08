// ══════════════════════════════════════════════════════════
//  核心计算算法
// ══════════════════════════════════════════════════════════

export function computeAttribute(attrKey, items, quals, limitTarget, unit, roundMode) {
  if (limitTarget === 0) {
    const values = {};
    quals.forEach((q) => {
      const count = items.filter((i) => i.star === q.star && (i.attrs || []).includes(attrKey)).length;
      if (count > 0)
        values[q.star] = {
          raw: 0,
          final: 0,
          count,
          stack: q.maxStack,
          weight: q.weight,
          limitQ: 0,
        };
    });
    return { values, actual: 0, error: 0 };
  }

  const aq = {};
  for (const item of items) {
    if (!(item.attrs || []).includes(attrKey)) continue;
    if (!aq[item.star]) aq[item.star] = { count: 0, stack: 0, weight: 0 };
    aq[item.star].count++;
    const qd = quals.find((q) => q.star === item.star);
    if (qd) {
      aq[item.star].stack = qd.maxStack;
      aq[item.star].weight = qd.weight;
    }
  }

  const wT = Object.values(aq).reduce((s, v) => s + v.weight, 0);
  if (wT === 0) return { values: {}, actual: 0, error: 0 };

  const values = {};
  let actual = 0;
  for (const [star, info] of Object.entries(aq)) {
    if (info.count === 0 || info.stack === 0) continue;
    const lq = limitTarget * (info.weight / wT);
    const raw = lq / (info.count * info.stack);
    let fin;
    if (roundMode === "ceil") fin = Math.ceil(raw / unit) * unit;
    else if (roundMode === "floor") fin = Math.floor(raw / unit) * unit;
    else fin = Math.round(raw / unit) * unit;
    values[star] = { raw, final: fin, count: info.count, stack: info.stack, weight: info.weight, limitQ: lq };
    actual += fin * info.count * info.stack;
  }
  return { values, actual, error: actual - limitTarget };
}
