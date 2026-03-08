// SystemConfig component
import { T, F } from "../../constants/theme";
import { QBadge } from "../ui/QBadge";
import { Inp } from "../ui/Inp";

export function SystemConfig({
  sys,
  configCollapsed,
  setConfigCollapsed,
  updateSystem,
  updateQuality,
  removeQuality,
  handleGenerate,
  setShowAddQuality,
  setNewQStar,
}) {
  return (
    <div style={{ background: T.bg.surface, borderBottom: `1px solid ${T.border.subtle}`, flexShrink: 0 }}>
      <button
        onClick={() => setConfigCollapsed(!configCollapsed)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: T.text.secondary,
          fontSize: 10,
          fontFamily: F.sans,
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text.primary }}>系统配置</span>
          <span style={{ color: T.text.muted, fontSize: 10 }}>
            {sys.name} · 段:{sys.code} · {sys.qualities.length}品质 · {sys.items.length}图鉴
          </span>
        </span>
        <span
          style={{
            transform: configCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: 8,
          }}
        >
          ▼
        </span>
      </button>
      {!configCollapsed && (
        <div style={{ padding: "0 14px 10px", display: "flex", gap: 8, overflowX: "auto", alignItems: "stretch" }}>
          <div
            style={{
              minWidth: 130,
              padding: 9,
              background: T.bg.elevated,
              borderRadius: 6,
              border: `1px solid ${T.border.subtle}`,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <Inp label="系统名称" value={sys.name} onChange={(v) => updateSystem({ name: v })} />
            <Inp
              label="系统ID段"
              value={sys.code}
              onChange={(v) => updateSystem({ code: v })}
              mono
            />
            <div
              style={{
                fontSize: 7,
                color: T.text.muted,
                padding: "2px 4px",
                background: T.bg.input,
                borderRadius: 2,
                lineHeight: 1.6,
              }}
            >
              ID:{" "}
              <span style={{ fontFamily: F.mono }}>
                <span style={{ color: T.text.primary }}>{sys.code}</span>
                <span style={{ color: T.quality[4]?.color }}>04</span>
                <span style={{ color: T.accent.blue }}>001</span>
              </span>
            </div>
          </div>
          {sys.qualities.map((q) => {
            const qT = T.quality[q.star] || T.quality[1];
            return (
              <div
                key={q.star}
                style={{
                  minWidth: 130,
                  padding: 9,
                  background: T.bg.elevated,
                  borderRadius: 6,
                  border: `1px solid ${qT.border}`,
                  borderTop: `2px solid ${qT.color}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <QBadge star={q.star} />
                  <button
                    onClick={() => removeQuality(q.star)}
                    style={{ background: "transparent", border: "none", color: T.text.muted, cursor: "pointer", fontSize: 9 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <Inp label="数量" value={q.count} onChange={(v) => updateQuality(q.star, "count", v)} mono />
                  <Inp label="堆叠" value={q.maxStack} onChange={(v) => updateQuality(q.star, "maxStack", v)} mono />
                  <Inp
                    label="权重"
                    value={q.weight}
                    onChange={(v) => updateQuality(q.star, "weight", v)}
                    mono
                    type="number"
                    step="0.01"
                  />
                  <Inp label="品质段" value={String(q.star).padStart(2, "0")} disabled mono />
                </div>
              </div>
            );
          })}
          <div
            onClick={() => {
              setNewQStar(String([1, 2, 3, 4, 5, 6].find((s) => !sys.qualities.find((q) => q.star === s)) || 1));
              setShowAddQuality(true);
            }}
            style={{
              minWidth: 55,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              background: T.bg.elevated,
              borderRadius: 6,
              border: `1px dashed ${T.border.default}`,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 10, color: T.text.muted }}>+</span>
          </div>
          <div style={{ minWidth: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={handleGenerate}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                background: `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: `0 2px 8px ${T.accent.blue}40`,
              }}
            >
              ⚡ 生成底表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
