import { useState, useMemo } from "react";
import { T, F } from "../../constants/theme";
import { Modal } from "../ui/Modal";
import { useGlobalAnalysis } from "../../hooks/useGlobalAnalysis";
import { SvgPieChart } from "../charts/SvgPieChart";
import { BarChart } from "../charts/BarChart";
import { MiniBar } from "../ui/MiniBar";
import { formatValue } from "../../utils/format";

const TABS = ["总览", "属性分析", "系统分析"];

// Colors for systems (cycle through)
const SYS_COLORS = [T.accent.blue, T.accent.green, T.accent.purple, T.accent.orange, T.accent.yellow, T.accent.red];

function getSysColor(index) {
  return SYS_COLORS[index % SYS_COLORS.length];
}

export function GlobalAnalysisModal({ open, onClose, systems, globalAttrs }) {
  const [tab, setTab] = useState(0);
  const [selectedAttr, setSelectedAttr] = useState(null);
  const [selectedSysId, setSelectedSysId] = useState(null);

  const { attrTotals, sysTotals, skippedSystems, readySystems, allAttrKeys } = useGlobalAnalysis(systems, globalAttrs, open);

  // Build attr info map from globalAttrs
  const attrInfoMap = useMemo(() => {
    const m = {};
    for (const a of globalAttrs) m[a.key] = a;
    // Also check system attrPools for attrs not in globalAttrs
    for (const sys of systems) {
      for (const a of sys.attrPool || []) {
        if (!m[a.key]) m[a.key] = a;
      }
    }
    return m;
  }, [globalAttrs, systems]);

  // System color map
  const sysColorMap = useMemo(() => {
    const m = {};
    readySystems.forEach((s, i) => { m[s.id] = getSysColor(i); });
    return m;
  }, [readySystems]);

  // Auto-select first attr/sys
  const activeAttr = selectedAttr && allAttrKeys.includes(selectedAttr) ? selectedAttr : allAttrKeys[0] || null;
  const activeSysId = selectedSysId && sysTotals[selectedSysId] ? selectedSysId : readySystems[0]?.id || null;

  const vtLabel = (vt) => vt === 2 ? "百分比" : vt === 3 ? "小数" : "整数";

  return (
    <Modal open={open} onClose={onClose} title="全局属性分析" width={900}>
      {/* Skipped systems warning */}
      {skippedSystems.length > 0 && (
        <div style={{
          padding: "6px 10px",
          marginBottom: 12,
          borderRadius: 5,
          background: `${T.accent.yellow}10`,
          border: `1px solid ${T.accent.yellow}30`,
          fontSize: 10,
          color: T.accent.yellow,
        }}>
          以下系统未配置属性或未生成底表，已跳过：{skippedSystems.map((s) => s.name).join("、")}
        </div>
      )}

      {readySystems.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: T.text.muted, fontSize: 12 }}>
          没有可分析的系统，请先在系统中配置属性并执行自动分配
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 4,
                  border: "none",
                  fontSize: 11,
                  fontWeight: tab === i ? 600 : 400,
                  color: tab === i ? T.accent.blue : T.text.secondary,
                  background: tab === i ? `${T.accent.blue}15` : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 0 && (
            <OverviewTab
              attrTotals={attrTotals}
              sysTotals={sysTotals}
              readySystems={readySystems}
              allAttrKeys={allAttrKeys}
              attrInfoMap={attrInfoMap}
              sysColorMap={sysColorMap}
              onCellClick={(attrKey, sysId) => {
                if (attrKey) { setSelectedAttr(attrKey); setTab(1); }
                else if (sysId) { setSelectedSysId(sysId); setTab(2); }
              }}
            />
          )}
          {tab === 1 && (
            <AttrAnalysisTab
              activeAttr={activeAttr}
              setSelectedAttr={setSelectedAttr}
              allAttrKeys={allAttrKeys}
              attrTotals={attrTotals}
              attrInfoMap={attrInfoMap}
              readySystems={readySystems}
              sysColorMap={sysColorMap}
              vtLabel={vtLabel}
            />
          )}
          {tab === 2 && (
            <SysAnalysisTab
              activeSysId={activeSysId}
              setSelectedSysId={setSelectedSysId}
              sysTotals={sysTotals}
              readySystems={readySystems}
              attrInfoMap={attrInfoMap}
              sysColorMap={sysColorMap}
              vtLabel={vtLabel}
              attrTotals={attrTotals}
              allAttrKeys={allAttrKeys}
            />
          )}
        </>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════
//  Tab 1: Overview
// ════════════════════════════════════════
function OverviewTab({ attrTotals, sysTotals, readySystems, allAttrKeys, attrInfoMap, sysColorMap, onCellClick }) {
  const [hoveredCell, setHoveredCell] = useState(null); // { row, col }
  const totalSystems = readySystems.length;
  const totalAttrs = allAttrKeys.length;

  // Count attrs by valueType
  const vtCounts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 };
    for (const ak of allAttrKeys) {
      const vt = (attrInfoMap[ak] || {}).valueType || 1;
      c[vt] = (c[vt] || 0) + 1;
    }
    return c;
  }, [allAttrKeys, attrInfoMap]);

  // Per-attribute ranges for heatmap coloring
  const attrRanges = useMemo(() => {
    const ranges = {};
    for (const ak of allAttrKeys) {
      const vals = Object.values(attrTotals[ak]?.bySys || {}).map((v) => v?.total || 0);
      const min = Math.min(...vals, 0);
      const max = Math.max(...vals, 1);
      ranges[ak] = { min, max };
    }
    return ranges;
  }, [allAttrKeys, attrTotals]);

  // Per-system column totals (sum of all attr totals for that system) — only meaningful within same valueType, show raw sum
  const sysSums = useMemo(() => {
    const m = {};
    for (const s of readySystems) {
      let sum = 0;
      for (const ak of allAttrKeys) {
        sum += attrTotals[ak]?.bySys?.[s.id]?.total || 0;
      }
      m[s.id] = sum;
    }
    return m;
  }, [readySystems, allAttrKeys, attrTotals]);

  const isRowHL = (ak) => hoveredCell && hoveredCell.row === ak;
  const isColHL = (sId) => hoveredCell && hoveredCell.col === sId;
  const hlBg = `${T.accent.blue}08`;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <SummaryCard label="参与系统" value={totalSystems} color={T.accent.blue} />
        <SummaryCard label="分析属性" value={totalAttrs} color={T.accent.green} />
        {vtCounts[1] > 0 && <SummaryCard label="整数属性" value={vtCounts[1]} color={T.accent.purple} />}
        {vtCounts[2] > 0 && <SummaryCard label="百分比属性" value={vtCounts[2]} color={T.accent.orange} />}
        {vtCounts[3] > 0 && <SummaryCard label="小数属性" value={vtCounts[3]} color={T.accent.yellow} />}
      </div>

      {/* Matrix heatmap */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ ...cellStyle, background: T.bg.surface, position: "sticky", left: 0, zIndex: 1, minWidth: 80 }}>属性 \ 系统</th>
              {readySystems.map((s) => (
                <th
                  key={s.id}
                  style={{
                    ...cellStyle,
                    background: isColHL(s.id) ? hlBg : T.bg.surface,
                    cursor: "pointer",
                    color: sysColorMap[s.id],
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textUnderlineOffset: 2,
                  }}
                  onClick={() => onCellClick(null, s.id)}
                >
                  {s.name}
                </th>
              ))}
              <th style={{ ...cellStyle, background: T.bg.surface, color: T.accent.yellow, minWidth: 80 }}>合计</th>
            </tr>
          </thead>
          <tbody>
            {allAttrKeys.map((ak) => {
              const info = attrInfoMap[ak] || {};
              const range = attrRanges[ak] || { min: 0, max: 1 };
              const attrTotal = attrTotals[ak]?.total || 0;

              // MiniBar segments for row-end
              const miniBarSegs = readySystems
                .filter((s) => (attrTotals[ak]?.bySys?.[s.id]?.total || 0) > 0)
                .map((s) => ({
                  label: s.name,
                  value: attrTotals[ak]?.bySys?.[s.id]?.total || 0,
                  color: sysColorMap[s.id],
                }));

              return (
                <tr key={ak}>
                  <td
                    style={{
                      ...cellStyle,
                      background: isRowHL(ak) ? hlBg : T.bg.surface,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      cursor: "pointer",
                      fontWeight: 600,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textUnderlineOffset: 2,
                    }}
                    onClick={() => onCellClick(ak, null)}
                  >
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: info.color || T.text.muted, marginRight: 4, verticalAlign: "middle" }} />
                    {info.name || ak}
                    <span style={{ marginLeft: 4, fontSize: 8, color: T.text.muted }}>{vtLabel(info.valueType)}</span>
                  </td>
                  {readySystems.map((s) => {
                    const val = attrTotals[ak]?.bySys?.[s.id]?.total || 0;
                    const opacity = range.max > range.min
                      ? 0.1 + 0.6 * ((val - range.min) / (range.max - range.min))
                      : 0.3;
                    const pct = attrTotal > 0 ? ((val / attrTotal) * 100).toFixed(1) : "0";
                    const isCross = isRowHL(ak) || isColHL(s.id);
                    return (
                      <td
                        key={s.id}
                        style={{
                          ...cellStyle,
                          background: isCross
                            ? hlBg
                            : val > 0
                              ? `${sysColorMap[s.id]}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`
                              : "transparent",
                          fontFamily: F.mono,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                        title={`${info.name || ak} @ ${s.name}: ${formatValue(val, info.valueType)} (${pct}%)`}
                        onClick={() => onCellClick(ak, null)}
                        onMouseEnter={() => setHoveredCell({ row: ak, col: s.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {val > 0 ? (
                          <div>
                            <div>{formatValue(val, info.valueType)}</div>
                            <div style={{ fontSize: 8, color: T.text.muted, fontWeight: 400 }}>{pct}%</div>
                          </div>
                        ) : "—"}
                      </td>
                    );
                  })}
                  <td style={{ ...cellStyle, textAlign: "center", minWidth: 80 }}>
                    <div style={{ fontFamily: F.mono, fontWeight: 700, color: T.accent.yellow, marginBottom: 3 }}>
                      {formatValue(attrTotal, info.valueType)}
                    </div>
                    <MiniBar segments={miniBarSegs} formatFn={(v) => formatValue(v, info.valueType)} />
                  </td>
                </tr>
              );
            })}
            {/* Column totals row */}
            <tr>
              <td style={{ ...cellStyle, background: T.bg.surface, position: "sticky", left: 0, zIndex: 1, fontWeight: 700, color: T.accent.yellow }}>
                合计
              </td>
              {readySystems.map((s) => (
                <td key={s.id} style={{ ...cellStyle, fontFamily: F.mono, fontWeight: 700, textAlign: "center", color: sysColorMap[s.id], background: isColHL(s.id) ? hlBg : "transparent" }}>
                  {sysSums[s.id] || 0}
                </td>
              ))}
              <td style={{ ...cellStyle, fontFamily: F.mono, fontWeight: 700, textAlign: "center", color: T.accent.yellow }}>
                {Object.values(sysSums).reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function vtLabel(vt) {
  return vt === 2 ? "%" : vt === 3 ? "dec" : "int";
}

const cellStyle = {
  padding: "5px 8px",
  border: `1px solid ${T.border.subtle}`,
  fontSize: 10,
  whiteSpace: "nowrap",
};

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      padding: "8px 14px",
      borderRadius: 6,
      background: `${color}10`,
      border: `1px solid ${color}30`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: 80,
    }}>
      <span style={{ fontSize: 9, color: T.text.muted, marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: F.mono, color }}>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════
//  Tab 2: Attribute Analysis
// ════════════════════════════════════════
function AttrAnalysisTab({ activeAttr, setSelectedAttr, allAttrKeys, attrTotals, attrInfoMap, readySystems, sysColorMap, vtLabel }) {
  if (!activeAttr) return <div style={{ color: T.text.muted, fontSize: 11 }}>暂无可分析的属性</div>;

  const info = attrInfoMap[activeAttr] || {};
  const data = attrTotals[activeAttr] || { total: 0, bySys: {} };
  const fmtV = (v) => formatValue(v, info.valueType);

  const pieData = readySystems
    .filter((s) => (data.bySys[s.id]?.total || 0) > 0)
    .map((s) => ({
      label: s.name,
      value: data.bySys[s.id]?.total || 0,
      color: sysColorMap[s.id],
    }));

  // Collect all quality stars across systems for this attribute
  const allStars = useMemo(() => {
    const stars = new Set();
    for (const s of readySystems) {
      const bq = data.bySys[s.id]?.byQuality || {};
      for (const star of Object.keys(bq)) stars.add(Number(star));
    }
    return [...stars].sort((a, b) => a - b);
  }, [readySystems, data.bySys]);

  // Stacked bar data: each system is a bar, segments are quality tiers
  const stackedBarData = readySystems.map((s) => {
    const bq = data.bySys[s.id]?.byQuality || {};
    return {
      label: s.name,
      segments: allStars.map((star) => ({
        value: bq[star] || 0,
        color: T.quality[star]?.color || T.text.muted,
        label: T.quality[star]?.label || `${star}星`,
      })),
    };
  });

  // Per-quality row totals for the matrix
  const qualityRowTotals = useMemo(() => {
    const m = {};
    for (const star of allStars) {
      let sum = 0;
      for (const s of readySystems) sum += data.bySys[s.id]?.byQuality?.[star] || 0;
      m[star] = sum;
    }
    return m;
  }, [allStars, readySystems, data.bySys]);

  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* Left: selector */}
      <div style={{ width: 150, flexShrink: 0, maxHeight: 420, overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: T.text.muted, marginBottom: 6 }}>选择属性</div>
        {allAttrKeys.map((ak) => {
          const ai = attrInfoMap[ak] || {};
          const akTotal = attrTotals[ak]?.total || 0;
          return (
            <div
              key={ak}
              onClick={() => setSelectedAttr(ak)}
              style={{
                padding: "5px 8px",
                borderRadius: 4,
                marginBottom: 2,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: ak === activeAttr ? 600 : 400,
                color: ak === activeAttr ? T.text.primary : T.text.secondary,
                background: ak === activeAttr ? `${T.accent.blue}15` : "transparent",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 2, background: ai.color || T.text.muted, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ai.name || ak}</span>
              <span style={{ fontSize: 8, fontFamily: F.mono, color: T.text.muted, flexShrink: 0 }}>{formatValue(akTotal, ai.valueType)}</span>
            </div>
          );
        })}
      </div>

      {/* Right: charts */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: info.color || T.text.muted }} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{info.name || activeAttr}</span>
          <span style={{
            fontSize: 8, padding: "1px 5px", borderRadius: 3,
            background: T.bg.active, color: T.text.muted,
          }}>
            {vtLabel(info.valueType)}
          </span>
          <span style={{ fontSize: 12, fontFamily: F.mono, fontWeight: 600, color: T.accent.blue, marginLeft: "auto" }}>
            总计: {fmtV(data.total)}
          </span>
        </div>

        {/* System pie + stacked bar */}
        <div style={{ display: "flex", gap: 20, marginBottom: 18, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, marginBottom: 8 }}>各系统占比</div>
            <SvgPieChart data={pieData} size={150} centerText={fmtV(data.total)} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: T.text.muted, marginBottom: 8 }}>各系统品质堆叠对比</div>
            <BarChart
              data={stackedBarData}
              stacked
              formatLabel={(v) => fmtV(v)}
            />
            {/* Quality legend */}
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {allStars.map((star) => {
                const qc = T.quality[star] || {};
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1, background: qc.color || T.text.muted }} />
                    <span style={{ color: T.text.muted }}>{qc.label || star}{qc.name || ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quality × System detail matrix */}
        {allStars.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, marginBottom: 8 }}>品质 × 系统明细</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={{ ...cellStyle, background: T.bg.surface, minWidth: 60 }}>品质</th>
                    {readySystems.map((s) => (
                      <th key={s.id} style={{ ...cellStyle, background: T.bg.surface, color: sysColorMap[s.id], textAlign: "center" }}>
                        {s.name}
                      </th>
                    ))}
                    <th style={{ ...cellStyle, background: T.bg.surface, color: T.accent.yellow, textAlign: "center" }}>合计</th>
                  </tr>
                </thead>
                <tbody>
                  {allStars.map((star) => {
                    const qc = T.quality[star] || {};
                    const rowTotal = qualityRowTotals[star] || 0;
                    return (
                      <tr key={star}>
                        <td style={{ ...cellStyle, fontWeight: 600 }}>
                          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 1, background: qc.color || T.text.muted, marginRight: 4, verticalAlign: "middle" }} />
                          <span style={{ color: qc.color || T.text.secondary }}>{qc.label || star}{qc.name || ""}</span>
                        </td>
                        {readySystems.map((s) => {
                          const val = data.bySys[s.id]?.byQuality?.[star] || 0;
                          const pct = rowTotal > 0 ? ((val / rowTotal) * 100).toFixed(1) : "0";
                          return (
                            <td key={s.id} style={{ ...cellStyle, fontFamily: F.mono, textAlign: "center" }}
                              title={`${qc.label || star} @ ${s.name}: ${fmtV(val)} (${pct}%)`}
                            >
                              {val > 0 ? fmtV(val) : "—"}
                            </td>
                          );
                        })}
                        <td style={{ ...cellStyle, fontFamily: F.mono, fontWeight: 700, textAlign: "center", color: T.accent.yellow }}>
                          {fmtV(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Column totals */}
                  <tr>
                    <td style={{ ...cellStyle, fontWeight: 700, color: T.accent.yellow }}>合计</td>
                    {readySystems.map((s) => (
                      <td key={s.id} style={{ ...cellStyle, fontFamily: F.mono, fontWeight: 700, textAlign: "center", color: sysColorMap[s.id] }}>
                        {fmtV(data.bySys[s.id]?.total || 0)}
                      </td>
                    ))}
                    <td style={{ ...cellStyle, fontFamily: F.mono, fontWeight: 700, textAlign: "center", color: T.accent.yellow }}>
                      {fmtV(data.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  Tab 3: System Analysis
// ════════════════════════════════════════
function SysAnalysisTab({ activeSysId, setSelectedSysId, sysTotals, readySystems, attrInfoMap, sysColorMap, vtLabel, attrTotals, allAttrKeys }) {
  if (!activeSysId) return <div style={{ color: T.text.muted, fontSize: 11 }}>暂无可分析的系统</div>;

  const sys = readySystems.find((s) => s.id === activeSysId);
  const data = sysTotals[activeSysId] || { total: 0, byAttr: {} };
  const attrKeys = Object.keys(data.byAttr);

  // Per-attribute: frequency (item count), value, global proportion
  const attrStats = useMemo(() => {
    const stats = [];
    for (const ak of attrKeys) {
      const info = attrInfoMap[ak] || {};
      const sysVal = data.byAttr[ak] || 0;
      const globalTotal = attrTotals?.[ak]?.total || 0;
      const globalPct = globalTotal > 0 ? (sysVal / globalTotal) * 100 : 0;

      // Count items that have this attribute mounted
      let freq = 0;
      if (sys?.items) {
        for (const item of sys.items) {
          if ((item.attrs || []).includes(ak)) freq++;
        }
      }

      stats.push({ key: ak, info, value: sysVal, freq, globalTotal, globalPct, vt: info.valueType || 1 });
    }
    return stats;
  }, [attrKeys, attrInfoMap, data.byAttr, attrTotals, sys, activeSysId]);

  const totalItems = sys?.items?.length || 0;

  // Group by valueType
  const groups = useMemo(() => {
    const g = { 1: [], 2: [], 3: [] };
    for (const s of attrStats) {
      g[s.vt] = g[s.vt] || [];
      g[s.vt].push(s);
    }
    return g;
  }, [attrStats]);

  const groupLabels = { 1: "整数属性", 2: "百分比属性", 3: "小数属性" };

  // Quality distribution for this system across all its attrs
  const qualityDist = useMemo(() => {
    const dist = {};
    for (const ak of attrKeys) {
      const bq = attrTotals?.[ak]?.bySys?.[activeSysId]?.byQuality || {};
      for (const [star, val] of Object.entries(bq)) {
        dist[star] = (dist[star] || 0) + val;
      }
    }
    return dist;
  }, [attrKeys, attrTotals, activeSysId]);

  const qualityStars = Object.keys(qualityDist).map(Number).sort((a, b) => a - b);
  const qualityTotal = Object.values(qualityDist).reduce((a, b) => a + b, 0);

  const qualityPieData = qualityStars
    .filter((star) => qualityDist[star] > 0)
    .map((star) => ({
      label: `${T.quality[star]?.label || star}${T.quality[star]?.name || ""}`,
      value: qualityDist[star],
      color: T.quality[star]?.color || T.text.muted,
    }));

  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* Left: selector */}
      <div style={{ width: 140, flexShrink: 0, maxHeight: 420, overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: T.text.muted, marginBottom: 6 }}>选择系统</div>
        {readySystems.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedSysId(s.id)}
            style={{
              padding: "5px 8px",
              borderRadius: 4,
              marginBottom: 2,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: s.id === activeSysId ? 600 : 400,
              color: s.id === activeSysId ? sysColorMap[s.id] : T.text.secondary,
              background: s.id === activeSysId ? `${sysColorMap[s.id]}15` : "transparent",
            }}
          >
            {s.name}
          </div>
        ))}
      </div>

      {/* Right: charts */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header with stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: sysColorMap[activeSysId] }}>
            {sys?.name || activeSysId}
          </span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: T.bg.active, color: T.text.muted }}>
            品质 {qualityStars.length} 级
          </span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: T.bg.active, color: T.text.muted }}>
            属性 {attrKeys.length} 个
          </span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: T.bg.active, color: T.text.muted }}>
            底表 {totalItems} 条
          </span>
        </div>

        {/* Attribute detail table — frequency + value + global proportion */}
        {Object.entries(groups).map(([vt, items]) => {
          if (items.length === 0) return null;
          const vtNum = Number(vt);
          const fmtV = (v) => formatValue(v, vtNum);
          const maxFreq = Math.max(...items.map((d) => d.freq), 1);

          return (
            <div key={vt} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text.secondary, marginBottom: 6 }}>
                {groupLabels[vt]}
              </div>

              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10, marginBottom: 6 }}>
                <thead>
                  <tr>
                    <th style={{ ...cellStyle, background: T.bg.surface, textAlign: "left", minWidth: 70 }}>属性</th>
                    <th style={{ ...cellStyle, background: T.bg.surface, textAlign: "center", minWidth: 50 }}>投放数</th>
                    <th style={{ ...cellStyle, background: T.bg.surface, textAlign: "center", minWidth: 60 }}>频次</th>
                    <th style={{ ...cellStyle, background: T.bg.surface, textAlign: "center", minWidth: 60 }}>本系统</th>
                    <th style={{ ...cellStyle, background: T.bg.surface, textAlign: "center", minWidth: 60 }}>全局总量</th>
                    <th style={{ ...cellStyle, background: T.bg.surface, textAlign: "center", minWidth: 80 }}>全局占比</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => {
                    const freqPct = totalItems > 0 ? ((d.freq / totalItems) * 100).toFixed(0) : "0";
                    const freqBarW = (d.freq / maxFreq) * 100;
                    return (
                      <tr key={d.key}>
                        {/* Attr name */}
                        <td style={{ ...cellStyle, fontWeight: 600 }}>
                          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: d.info.color || T.text.muted, marginRight: 4, verticalAlign: "middle" }} />
                          {d.info.name || d.key}
                        </td>
                        {/* Frequency count */}
                        <td style={{ ...cellStyle, textAlign: "center", fontFamily: F.mono }}>
                          {d.freq}/{totalItems}
                        </td>
                        {/* Frequency bar */}
                        <td style={{ ...cellStyle, padding: "4px 6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ flex: 1, height: 8, background: T.bg.input, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{
                                width: `${freqBarW}%`,
                                height: "100%",
                                background: d.info.color || T.accent.blue,
                                borderRadius: 2,
                                transition: "width 0.3s",
                              }} />
                            </div>
                            <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono, flexShrink: 0 }}>{freqPct}%</span>
                          </div>
                        </td>
                        {/* System value */}
                        <td style={{ ...cellStyle, textAlign: "center", fontFamily: F.mono, fontWeight: 600, color: sysColorMap[activeSysId] }}>
                          {fmtV(d.value)}
                        </td>
                        {/* Global total */}
                        <td style={{ ...cellStyle, textAlign: "center", fontFamily: F.mono, color: T.text.secondary }}>
                          {fmtV(d.globalTotal)}
                        </td>
                        {/* Global proportion — highlighted */}
                        <td style={{ ...cellStyle, textAlign: "center", padding: "4px 6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ flex: 1, height: 10, background: T.bg.input, borderRadius: 2, overflow: "hidden", position: "relative" }}>
                              <div style={{
                                width: `${Math.min(d.globalPct, 100)}%`,
                                height: "100%",
                                background: sysColorMap[activeSysId],
                                borderRadius: 2,
                                transition: "width 0.3s",
                              }} />
                            </div>
                            <span style={{
                              fontSize: 9,
                              fontFamily: F.mono,
                              fontWeight: 700,
                              color: d.globalPct > 50 ? T.accent.yellow : d.globalPct > 30 ? sysColorMap[activeSysId] : T.text.secondary,
                              flexShrink: 0,
                              minWidth: 32,
                              textAlign: "right",
                            }}>
                              {d.globalPct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Quality distribution overview */}
        {qualityStars.length > 0 && (
          <div style={{
            marginTop: 4,
            padding: "10px 12px",
            borderRadius: 6,
            background: T.bg.surface,
            border: `1px solid ${T.border.subtle}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text.secondary, marginBottom: 10 }}>
              品质分布总览
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <SvgPieChart data={qualityPieData} size={140} centerText={String(qualityTotal)} />
            </div>

            {/* Quality detail pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {qualityStars.map((star) => {
                const val = qualityDist[star] || 0;
                if (val === 0) return null;
                const qc = T.quality[star] || {};
                const pct = qualityTotal > 0 ? ((val / qualityTotal) * 100).toFixed(1) : "0";
                return (
                  <div key={star} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "3px 8px", borderRadius: 4,
                    background: qc.bg || T.bg.input,
                    border: `1px solid ${qc.border || T.border.subtle}`,
                    fontSize: 10,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: qc.color || T.text.muted }} />
                    <span style={{ color: T.text.secondary }}>{qc.label || star}{qc.name || ""}</span>
                    <span style={{ fontFamily: F.mono, fontWeight: 600, color: qc.color || T.text.primary }}>
                      {val}
                    </span>
                    <span style={{ color: T.text.muted }}>({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
