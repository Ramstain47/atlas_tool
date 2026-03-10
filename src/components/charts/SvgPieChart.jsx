import { useState } from "react";
import { T, F } from "../../constants/theme";

export function SvgPieChart({ data, size = 180, centerText }) {
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ color: T.text.muted, fontSize: 11 }}>暂无数据</div>;

  const r = size / 2;
  const cx = r, cy = r;
  const ir = r * 0.55; // donut hole

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const largeArc = angle > Math.PI ? 1 : 0;

    const x1o = cx + r * Math.cos(startAngle);
    const y1o = cy + r * Math.sin(startAngle);
    const x2o = cx + r * Math.cos(endAngle);
    const y2o = cy + r * Math.sin(endAngle);
    const x1i = cx + ir * Math.cos(endAngle);
    const y1i = cy + ir * Math.sin(endAngle);
    const x2i = cx + ir * Math.cos(startAngle);
    const y2i = cy + ir * Math.sin(startAngle);

    const path = [
      `M ${x1o} ${y1o}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${ir} ${ir} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");

    const pct = ((d.value / total) * 100).toFixed(1);
    return { ...d, path, pct, index: i };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg
        width={size}
        height={size}
        style={{ flexShrink: 0 }}
      >
        {slices.map((s) => (
          <path
            key={s.index}
            d={s.path}
            fill={s.color}
            opacity={hovered === null || hovered === s.index ? 1 : 0.3}
            stroke={T.bg.elevated}
            strokeWidth={1.5}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {hovered !== null && slices[hovered] ? (
          <>
            <text
              x={cx} y={cy - 6}
              textAnchor="middle"
              fill={T.text.primary}
              fontSize={11}
              fontFamily={F.sans}
              fontWeight={600}
            >
              {slices[hovered].label}
            </text>
            <text
              x={cx} y={cy + 10}
              textAnchor="middle"
              fill={slices[hovered].color}
              fontSize={13}
              fontFamily={F.mono}
              fontWeight={700}
            >
              {slices[hovered].pct}%
            </text>
          </>
        ) : centerText ? (
          <text
            x={cx} y={cy + 4}
            textAnchor="middle"
            fill={T.text.secondary}
            fontSize={11}
            fontFamily={F.mono}
            fontWeight={600}
          >
            {centerText}
          </text>
        ) : null}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {slices.map((s) => (
          <div
            key={s.index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              cursor: "pointer",
              opacity: hovered === null || hovered === s.index ? 1 : 0.4,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: T.text.secondary, minWidth: 50 }}>{s.label}</span>
            <span style={{ color: T.text.primary, fontFamily: F.mono, fontWeight: 600 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
