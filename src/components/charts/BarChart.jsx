import { useState } from "react";
import { T, F } from "../../constants/theme";

/**
 * BarChart — 水平柱状图
 *
 * 普通模式: data = [{ label, value, color }]
 * 堆叠模式: stacked=true, data = [{ label, segments: [{ value, color, label }] }]
 */
export function BarChart({ data, formatLabel, stacked = false }) {
  const [hovered, setHovered] = useState(null);
  const [hoveredSeg, setHoveredSeg] = useState(null);

  if (data.length === 0) return <div style={{ color: T.text.muted, fontSize: 11 }}>暂无数据</div>;

  if (stacked) {
    const max = Math.max(...data.map((d) => (d.segments || []).reduce((s, x) => s + x.value, 0)), 1);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
        {data.map((d, i) => {
          const total = (d.segments || []).reduce((s, x) => s + x.value, 0);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: hovered === null || hovered === i ? 1 : 0.4,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => { setHovered(null); setHoveredSeg(null); }}
            >
              <span style={{ fontSize: 10, color: T.text.secondary, minWidth: 60, textAlign: "right", flexShrink: 0 }}>
                {d.label}
              </span>
              <div style={{ flex: 1, height: 16, background: T.bg.input, borderRadius: 3, overflow: "hidden", display: "flex", position: "relative" }}>
                {(d.segments || []).map((seg, j) => {
                  const w = total > 0 ? (seg.value / max) * 100 : 0;
                  const isSegHovered = hovered === i && hoveredSeg === j;
                  return (
                    <div
                      key={j}
                      style={{
                        width: `${w}%`,
                        height: "100%",
                        background: seg.color,
                        opacity: hoveredSeg === null || isSegHovered ? 1 : 0.5,
                        transition: "width 0.3s, opacity 0.15s",
                        minWidth: seg.value > 0 ? 1 : 0,
                      }}
                      title={`${seg.label}: ${formatLabel ? formatLabel(seg.value) : seg.value} (${total > 0 ? ((seg.value / total) * 100).toFixed(1) : 0}%)`}
                      onMouseEnter={() => setHoveredSeg(j)}
                      onMouseLeave={() => setHoveredSeg(null)}
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: 10, color: T.text.primary, fontFamily: F.mono, fontWeight: 600, minWidth: 50, textAlign: "right", flexShrink: 0 }}>
                {formatLabel ? formatLabel(total) : total}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Normal mode
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: hovered === null || hovered === i ? 1 : 0.4,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <span style={{ fontSize: 10, color: T.text.secondary, minWidth: 60, textAlign: "right", flexShrink: 0 }}>
            {d.label}
          </span>
          <div style={{ flex: 1, height: 16, background: T.bg.input, borderRadius: 3, overflow: "hidden", position: "relative" }}>
            <div
              style={{
                height: "100%",
                width: `${(d.value / max) * 100}%`,
                background: d.color,
                borderRadius: 3,
                transition: "width 0.3s",
                minWidth: d.value > 0 ? 2 : 0,
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: T.text.primary, fontFamily: F.mono, fontWeight: 600, minWidth: 50, textAlign: "right", flexShrink: 0 }}>
            {formatLabel ? formatLabel(d.value) : d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
