import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T } from "../../constants/theme";

export function AddQualityModal({ open, onClose, onAdd, qualities, star, setStar, count, setCount, stack, setStack, weight, setWeight }) {
  const handleAdd = () => {
    if (onAdd(star, count, stack, weight)) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="添加品质">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 9, color: T.text.muted, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
            品质等级
          </label>
          <div style={{ display: "flex", gap: 3 }}>
            {[1, 2, 3, 4, 5, 6].map((s) => {
              const exists = qualities.find((q) => q.star === s);
              return (
                <button
                  key={s}
                  onClick={() => !exists && setStar(String(s))}
                  disabled={!!exists}
                  style={{
                    padding: "4px 7px",
                    borderRadius: 3,
                    border: `1px solid ${Number(star) === s ? T.quality[s].color : T.border.subtle}`,
                    background: Number(star) === s ? T.quality[s].bg : "transparent",
                    color: exists ? T.text.muted : T.quality[s].color,
                    fontSize: 10,
                    cursor: exists ? "not-allowed" : "pointer",
                    opacity: exists ? 0.3 : 1,
                    fontWeight: 600,
                  }}
                >
                  {T.quality[s].label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <Inp label="图鉴数量" value={count} onChange={setCount} mono />
          <Inp label="堆叠数" value={stack} onChange={setStack} mono />
          <Inp label="属性权重" value={weight} onChange={setWeight} mono type="number" step="0.01" />
        </div>
        <button
          onClick={handleAdd}
          style={{
            padding: "8px",
            borderRadius: 6,
            border: "none",
            background: T.accent.blue,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          添加
        </button>
      </div>
    </Modal>
  );
}
