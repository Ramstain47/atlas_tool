import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Inp } from "../ui/Inp";
import { T } from "../../constants/theme";

export function NewSystemModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = () => {
    if (onCreate(name, code)) {
      setName("");
      setCode("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="新建系统">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Inp label="系统名称" value={name} onChange={setName} placeholder="如：公会商店" />
        <Inp label="系统ID段 (3位)" value={code} onChange={setCode} placeholder="如：102" mono />
        <button
          onClick={handleCreate}
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
          创建
        </button>
      </div>
    </Modal>
  );
}
