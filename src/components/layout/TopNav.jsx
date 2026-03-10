import { T, F } from "../../constants/theme";

export function TopNav({
  systems,
  activeSystemId,
  setActiveSystemId,
  deleteSystem,
  setShowNewSystem,
  setShowAttrManager,
  setShowLoadManager,
  setShowSaveManager,
  setShowTemplateManager,
  computed,
  showToast,
  setShowExportConfirm,
  setShowGlobalAnalysis,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        height: 42,
        background: T.bg.surface,
        borderBottom: `1px solid ${T.border.subtle}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
            }}
          >
            📖
          </div>
          <span style={{ fontSize: 12, fontWeight: 700 }}>图鉴数值配置</span>
        </div>
        <div style={{ width: 1, height: 16, background: T.border.subtle }} />
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {systems.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
              <button
                onClick={() => {
                  setActiveSystemId(s.id);
                }}
                style={{
                  padding: "3px 9px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: activeSystemId === s.id ? 600 : 400,
                  color: activeSystemId === s.id ? T.accent.blue : T.text.secondary,
                  background: activeSystemId === s.id ? `${T.accent.blue}15` : "transparent",
                }}
              >
                {s.name}
                <span
                  style={{
                    marginLeft: 3,
                    fontSize: 8,
                    padding: "0 3px",
                    borderRadius: 2,
                    background: T.bg.elevated,
                    color: T.text.muted,
                    fontFamily: F.mono,
                  }}
                >
                  {s.code}
                </span>
              </button>
              {systems.length > 1 && activeSystemId === s.id && (
                <button
                  onClick={() => deleteSystem(s.id)}
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -5,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: T.bg.elevated,
                    border: `1px solid ${T.border.subtle}`,
                    color: T.text.muted,
                    fontSize: 7,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowNewSystem(true)}
            style={{
              padding: "3px 7px",
              borderRadius: 3,
              border: `1px dashed ${T.border.default}`,
              cursor: "pointer",
              fontSize: 9,
              color: T.text.muted,
              background: "transparent",
            }}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <button
          onClick={() => setShowGlobalAnalysis(true)}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: `1px solid ${T.accent.blue}50`,
            background: `${T.accent.blue}10`,
            color: T.accent.blue,
            fontSize: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📊 全局分析
        </button>
        <button
          onClick={() => setShowAttrManager(true)}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: `1px solid ${T.accent.purple}50`,
            background: `${T.accent.purple}10`,
            color: T.accent.purple,
            fontSize: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📋 属性管理器
        </button>
        <button
          onClick={() => setShowTemplateManager(true)}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: `1px solid ${T.accent.orange}50`,
            background: `${T.accent.orange}10`,
            color: T.accent.orange,
            fontSize: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📝 模板管理
        </button>
        <div style={{ width: 1, height: 16, background: T.border.subtle }} />
        <button
          onClick={() => setShowLoadManager(true)}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: `1px solid ${T.border.default}`,
            background: "transparent",
            color: T.text.secondary,
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          📂 读档
        </button>
        <button
          onClick={() => setShowSaveManager(true)}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: `1px solid ${T.accent.green}50`,
            background: `${T.accent.green}10`,
            color: T.accent.green,
            fontSize: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          💾 存档
        </button>
        <button
          onClick={() => {
            if (!computed) {
              showToast("请先执行自动分配", "yellow");
              return;
            }
            setShowExportConfirm(true);
          }}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: "none",
            background: T.accent.blue,
            color: "#fff",
            fontSize: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📤 导出
        </button>
      </div>
    </div>
  );
}
