import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

// ══════════════════════════════════════════════════════════
//  全局样式 - 清除浏览器默认边距
// ══════════════════════════════════════════════════════════
const globalStyles = document.createElement("style");
globalStyles.textContent = `* { margin: 0; padding: 0; box-sizing: border-box; } html, body, #root { width: 100%; height: 100%; overflow: hidden; }`;
document.head.appendChild(globalStyles);

// ══════════════════════════════════════════════════════════
//  图鉴数值自动化配置工具 v4 - With Global Attribute Manager
// ══════════════════════════════════════════════════════════

// ── Theme ──
const T = {
  bg: { app: "#0F1117", surface: "#161922", elevated: "#1C1F2E", hover: "#232738", active: "#2A2E42", input: "#12141C" },
  border: { subtle: "#2A2E42", default: "#353A50", focus: "#5B8DEF" },
  text: { primary: "#E8EAF0", secondary: "#8B90A0", muted: "#5A5F72" },
  accent: { blue: "#5B8DEF", green: "#4CAF50", yellow: "#FFB300", red: "#EF5350", purple: "#AB47BC" },
  quality: {
    1: { color: "#B0B8C8", bg: "#B0B8C810", border: "#B0B8C830", label: "白色", name: "普通" },
    2: { color: "#66BB6A", bg: "#66BB6A10", border: "#66BB6A30", label: "绿色", name: "优秀" },
    3: { color: "#42A5F5", bg: "#42A5F510", border: "#42A5F530", label: "蓝色", name: "精良" },
    4: { color: "#AB47BC", bg: "#AB47BC10", border: "#AB47BC30", label: "紫色", name: "史诗" },
    5: { color: "#FFA726", bg: "#FFA72610", border: "#FFA72630", label: "橙色", name: "传说" },
    6: { color: "#EF5350", bg: "#EF535010", border: "#EF535030", label: "红色", name: "神话" },
  },
};
const F = { mono: "'JetBrains Mono','Fira Code','SF Mono',monospace", sans: "'DM Sans','Noto Sans SC',system-ui,sans-serif" };

// ── Value type formatting ──
// type 1: integer (raw value), type 2: percentage (val/10000), type 3: decimal (val/100)
function formatValue(raw, valueType) {
  if (raw === null || raw === undefined || raw === "" || raw === "—") return "—";
  const n = Number(raw);
  if (isNaN(n)) return "—";
  if (valueType === 2) { const pct = n / 10000 * 100; return pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(2).replace(/\.?0+$/, "")}%`; }
  if (valueType === 3) { const d = n / 100; return d % 1 === 0 ? String(d) : d.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); }
  return String(n);
}

// ── ID Builder ──
function buildId(sysCode, star, seq) {
  return `${sysCode}${String(star).padStart(2, "0")}${String(seq).padStart(3, "0")}`;
}

// ── Core Algorithm ──
function computeAttribute(attrKey, items, quals, limitTarget, unit, roundMode) {
  if (limitTarget === 0) {
    const values = {};
    quals.forEach(q => {
      const count = items.filter(i => i.star === q.star && i.attrs.includes(attrKey)).length;
      if (count > 0) values[q.star] = { raw: 0, final: 0, count, stack: q.maxStack, weight: q.weight, limitQ: 0 };
    });
    return { values, actual: 0, error: 0 };
  }
  const aq = {};
  for (const item of items) {
    if (!item.attrs.includes(attrKey)) continue;
    if (!aq[item.star]) aq[item.star] = { count: 0, stack: 0, weight: 0 };
    aq[item.star].count++;
    const qd = quals.find(q => q.star === item.star);
    if (qd) { aq[item.star].stack = qd.maxStack; aq[item.star].weight = qd.weight; }
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

// ── Default global attributes (for attribute manager) ──
const DEFAULT_GLOBAL_ATTRS = [
  { key: "atk", attrId: 1001, name: "攻击力", valueType: 1 },
  { key: "hp", attrId: 1002, name: "生命值", valueType: 1 },
  { key: "def", attrId: 1003, name: "防御力", valueType: 1 },
  { key: "crit", attrId: 2001, name: "暴击率", valueType: 2 },
  { key: "crit_dmg", attrId: 2002, name: "暴击伤害", valueType: 2 },
  { key: "spd", attrId: 1004, name: "速度", valueType: 1 },
  { key: "dodge", attrId: 2003, name: "闪避率", valueType: 2 },
  { key: "hp_regen", attrId: 3001, name: "生命回复", valueType: 3 },
];

// ── localStorage keys ──
const STORAGE_KEY_ATTRS = "codex_global_attrs";
const STORAGE_KEY_SYSTEMS = "codex_systems";
const STORAGE_KEY_SAVE_SLOTS = "codex_save_slots";  // 存档槽位
const MAX_SAVE_SLOTS = 20;

// ── Load/Save global attributes ──
function loadGlobalAttrs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ATTRS);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [...DEFAULT_GLOBAL_ATTRS];
}

function saveGlobalAttrs(attrs) {
  try {
    localStorage.setItem(STORAGE_KEY_ATTRS, JSON.stringify(attrs));
  } catch {
    // ignore
  }
}

function createDefaultSystem(name, code) {
  return {
    id: "sys_" + Date.now() + Math.random().toString(36).slice(2, 6),
    name, code,
    qualities: [
      { star: 3, count: 20, maxStack: 10, weight: 1 },
      { star: 4, count: 10, maxStack: 10, weight: 2 },
      { star: 5, count: 6, maxStack: 5, weight: 2 },
      { star: 6, count: 3, maxStack: 3, weight: 3 },
    ],
    items: [],
    attrPool: [], // 属性池初始为空，需从管理器添加
    attrConfigs: {},
    generated: false,
    manualOverrides: {},
  };
}

function generateItems(quals, sysCode) {
  const items = [];
  for (const q of quals) {
    for (let i = 0; i < q.count; i++) {
      items.push({ id: buildId(sysCode, q.star, i + 1), star: q.star, maxStack: q.maxStack, attrs: [] });
    }
  }
  return items;
}

// ── Shared UI ──
function QBadge({ star, compact }) {
  const q = T.quality[star] || T.quality[1];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: compact ? 3 : 4, padding: compact ? "1px 4px" : "2px 6px", borderRadius: 3, fontSize: compact ? 9 : 10, fontWeight: 600, color: q.color, background: q.bg, border: `1px solid ${q.border}`, whiteSpace: "nowrap" }}>
      <span style={{ width: compact ? 5 : 6, height: compact ? 5 : 6, borderRadius: "50%", background: q.color, flexShrink: 0 }} />
      {compact ? q.label : `${q.label}${q.name}`}
    </span>
  );
}

function Pill({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 7px", background: T.bg.elevated, borderRadius: 4, border: `1px solid ${T.border.subtle}`, minWidth: 46 }}>
      <span style={{ fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || T.text.primary, fontFamily: F.mono }}>{value}</span>
    </div>
  );
}

function MiniBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", background: T.bg.input, width: "100%" }}>
      {segments.map((seg, i) => <div key={i} style={{ width: `${(seg.value / total) * 100}%`, background: seg.color, transition: "width 0.3s" }} title={`${seg.label}: ${seg.value}`} />)}
    </div>
  );
}

function Modal({ open, onClose, title, children, width }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div style={{ background: T.bg.elevated, borderRadius: 10, border: `1px solid ${T.border.default}`, padding: 18, width: width || 380, maxHeight: "80vh", overflow: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.text.muted, cursor: "pointer", fontSize: 15 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Inp({ label, value, onChange, mono, placeholder, disabled, type, step }) {
  return (
    <div>
      {label && <label style={{ fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.7, display: "block", marginBottom: 2 }}>{label}</label>}
      <input type={type || "text"} step={step} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width: "100%", padding: "4px 5px", background: disabled ? T.bg.elevated : T.bg.input, border: `1px solid ${T.border.subtle}`, borderRadius: 3, color: T.text.primary, fontSize: 12, fontFamily: mono ? F.mono : F.sans, outline: "none", boxSizing: "border-box", textAlign: mono ? "center" : "left", opacity: disabled ? 0.5 : 1 }} />
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════
export default function App() {
  // ── Global Attribute Manager State ──
  const [globalAttrs, setGlobalAttrs] = useState(() => loadGlobalAttrs());
  const [showAttrManager, setShowAttrManager] = useState(false);
  const [showSelectFromManager, setShowSelectFromManager] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [managerEditing, setManagerEditing] = useState(null);
  const [managerEditForm, setManagerEditForm] = useState({ key: "", name: "", attrId: "", valueType: "1" });

  // ── Systems State ──
  const [systems, setSystems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYSTEMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // 初始化时 attrPool 为空，需要从管理器添加
    return [{ ...createDefaultSystem("摸鱼宝库", "101"), id: "sys1" }];
  });

  // ── Persist systems to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SYSTEMS, JSON.stringify(systems));
    } catch {
      // ignore
    }
  }, [systems]);

  // ── Persist global attrs to localStorage ──
  useEffect(() => {
    saveGlobalAttrs(globalAttrs);
  }, [globalAttrs]);

  const [activeSystemId, setActiveSystemId] = useState("sys1");
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [computed, setComputed] = useState(false);
  const [showNewSystem, setShowNewSystem] = useState(false);
  const [newSysName, setNewSysName] = useState("");
  const [newSysCode, setNewSysCode] = useState("");
  const [showAddQuality, setShowAddQuality] = useState(false);
  const [newQStar, setNewQStar] = useState("2");
  const [newQCount, setNewQCount] = useState("10");
  const [newQStack, setNewQStack] = useState("10");
  const [newQWeight, setNewQWeight] = useState("1");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  // ── Save/Load Manager State ──
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showLoadManager, setShowLoadManager] = useState(false);
  const [saveSlots, setSaveSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVE_SLOTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // ── Persist save slots to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVE_SLOTS, JSON.stringify(saveSlots));
    } catch {
      // ignore
    }
  }, [saveSlots]);

  const showToast = useCallback((msg, type) => {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const sys = useMemo(() => systems.find(s => s.id === activeSystemId) || systems[0], [systems, activeSystemId]);

  const updateSys = useCallback((updater) => {
    setSystems(prev => prev.map(s => s.id === activeSystemId ? (typeof updater === "function" ? updater(s) : { ...s, ...updater }) : s));
    setComputed(false);
  }, [activeSystemId]);

  // 使用 ref 来避免在 effect 中直接调用 setState
  const updateSysRef = useRef(updateSys);
  useEffect(() => { updateSysRef.current = updateSys; }, [updateSys]);

  // ── attr lookup ──
  const attrMap = useMemo(() => {
    const m = {};
    (sys.attrPool || []).forEach(a => { m[a.key] = a; });
    return m;
  }, [sys.attrPool]);

  // ── used attributes (mounted on at least one item) ──
  const usedAttrs = useMemo(() => {
    const set = new Set();
    (sys.items || []).forEach(it => it.attrs.forEach(a => set.add(a)));
    return Array.from(set);
  }, [sys.items]);

  // ── mount counts per attr per quality ──
  const mountCounts = useMemo(() => {
    const counts = {};
    (sys.items || []).forEach(it => {
      it.attrs.forEach(a => {
        if (!counts[a]) counts[a] = {};
        counts[a][it.star] = (counts[a][it.star] || 0) + 1;
      });
    });
    return counts;
  }, [sys.items]);

  // ── ensure attrConfigs ──
  useEffect(() => {
    const missing = usedAttrs.filter(a => !sys.attrConfigs[a]);
    if (missing.length > 0) {
      // 使用 setTimeout 避免同步调用 setState 导致的级联渲染警告
      setTimeout(() => {
        updateSysRef.current(s => {
          const next = { ...s.attrConfigs };
          missing.forEach(a => { next[a] = { limit: 0, unit: 1, mode: "round" }; });
          return { ...s, attrConfigs: next };
        });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedAttrs]);

  // ── compute ──
  const attrResults = useMemo(() => {
    if (!computed) return {};
    const r = {};
    for (const attr of usedAttrs) {
      const cfg = sys.attrConfigs[attr];
      if (!cfg) continue;
      r[attr] = computeAttribute(attr, sys.items, sys.qualities, Number(cfg.limit) || 0, Number(cfg.unit) || 1, cfg.mode || "round");
    }
    return r;
  }, [computed, usedAttrs, sys]);

  const actualTotals = useMemo(() => {
    if (!computed) return {};
    const totals = {};
    for (const attr of usedAttrs) {
      const r = attrResults[attr];
      if (!r) continue;
      let total = 0;
      for (const item of sys.items) {
        if (!item.attrs.includes(attr)) continue;
        const ok = `${item.id}_${attr}`;
        const ov = sys.manualOverrides[ok];
        const av = r.values[item.star]?.final || 0;
        total += ((ov !== undefined && ov !== null) ? ov : av) * item.maxStack;
      }
      totals[attr] = total;
    }
    return totals;
  }, [computed, usedAttrs, attrResults, sys]);

  // ── Handlers ──
  const handleGenerate = useCallback(() => {
    if (sys.qualities.length === 0) { showToast("请先添加品质层级", "red"); return; }
    const items = generateItems(sys.qualities, sys.code);
    updateSys({ items, generated: true, manualOverrides: {} });
    setConfigCollapsed(true);
    showToast(`已生成 ${items.length} 个图鉴`, "green");
  }, [sys, updateSys, showToast]);

  const handleCompute = useCallback(() => {
    if (usedAttrs.length === 0) { showToast("请先为图鉴挂载属性", "red"); return; }
    setComputed(true);
    showToast("计算完成", "green");
  }, [usedAttrs, showToast]);

  // ── Mount attribute to selected items ──
  const mountAttrToSelected = useCallback((attrKey) => {
    if (selectedIds.size === 0) { showToast("请先在左侧选择图鉴", "yellow"); return; }
    updateSys(s => ({
      ...s,
      items: s.items.map(it => {
        if (!selectedIds.has(it.id)) return it;
        if (it.attrs.includes(attrKey)) return it;
        return { ...it, attrs: [...it.attrs, attrKey] };
      }),
    }));
    showToast(`已为 ${selectedIds.size} 个图鉴挂载 ${attrMap[attrKey]?.name || attrKey}`, "green");
    setMultiSelectMode(false);
    setSelectedIds(new Set());
  }, [selectedIds, updateSys, showToast, attrMap]);

  // ── Unmount attribute from selected items ──
  const unmountAttrFromSelected = useCallback((attrKey) => {
    if (selectedIds.size === 0) { showToast("请先在左侧选择图鉴", "yellow"); return; }
    updateSys(s => ({
      ...s,
      items: s.items.map(it => {
        if (!selectedIds.has(it.id)) return it;
        return { ...it, attrs: it.attrs.filter(a => a !== attrKey) };
      }),
    }));
    showToast(`已为 ${selectedIds.size} 个图鉴卸载 ${attrMap[attrKey]?.name || attrKey}`, "green");
    setMultiSelectMode(false);
    setSelectedIds(new Set());
  }, [selectedIds, updateSys, showToast, attrMap]);

  const updateAttrConfig = useCallback((attr, field, value) => {
    updateSys(s => ({
      ...s,
      attrConfigs: { ...s.attrConfigs, [attr]: { ...(s.attrConfigs[attr] || { limit: 0, unit: 1, mode: "round" }), [field]: value } },
    }));
  }, [updateSys]);

  const setManualOverride = useCallback((itemId, attr, value) => {
    updateSys(s => ({
      ...s,
      manualOverrides: { ...s.manualOverrides, [`${itemId}_${attr}`]: value === "" ? undefined : Number(value) },
    }));
  }, [updateSys]);

  const clearAllOverrides = useCallback(() => {
    updateSys({ manualOverrides: {} });
    showToast("已清除所有手动覆盖", "green");
  }, [updateSys, showToast]);

  // ── Quality CRUD ──
  const addQuality = useCallback(() => {
    const star = Number(newQStar);
    if (sys.qualities.find(q => q.star === star)) { showToast("该品质已存在", "red"); return; }
    updateSys(s => ({
      ...s,
      qualities: [...s.qualities, { star, count: Number(newQCount) || 1, maxStack: Number(newQStack) || 1, weight: parseFloat(newQWeight) || 1 }].sort((a, b) => a.star - b.star),
      generated: false, items: [],
    }));
    setShowAddQuality(false);
    showToast(`已添加 ${T.quality[star]?.label || star}`, "green");
  }, [newQStar, newQCount, newQStack, newQWeight, sys.qualities, updateSys, showToast]);

  const removeQuality = useCallback((star) => {
    updateSys(s => ({ ...s, qualities: s.qualities.filter(q => q.star !== star), generated: false, items: [] }));
    showToast("品质已移除", "yellow");
  }, [updateSys, showToast]);

  const updateQuality = useCallback((star, field, value) => {
    const parsed = field === "weight" ? parseFloat(value) || 0 : Number(value) || 0;
    const clamped = field === "weight" ? Math.round(parsed * 100) / 100 : parsed;
    updateSys(s => ({
      ...s,
      qualities: s.qualities.map(q => q.star === star ? { ...q, [field]: clamped } : q),
      generated: false, items: [],
    }));
  }, [updateSys]);

  // ── System CRUD ──
  const addSystem = useCallback(() => {
    if (!newSysName.trim() || !newSysCode.trim()) { showToast("请填写名称和ID段", "red"); return; }
    if (systems.find(s => s.code === newSysCode.trim())) { showToast("ID段已存在", "red"); return; }
    const ns = createDefaultSystem(newSysName.trim(), newSysCode.trim());
    setSystems(prev => [...prev, ns]);
    setActiveSystemId(ns.id);
    setShowNewSystem(false);
    setNewSysName(""); setNewSysCode("");
    setComputed(false);
    showToast(`系统 "${newSysName.trim()}" 已创建`, "green");
  }, [newSysName, newSysCode, systems, showToast]);

  const deleteSystem = useCallback((sysId) => {
    if (systems.length <= 1) { showToast("至少保留一个系统", "red"); return; }
    setSystems(prev => prev.filter(s => s.id !== sysId));
    if (activeSystemId === sysId) setActiveSystemId(systems.find(s => s.id !== sysId)?.id || "");
    showToast("系统已删除", "green");
  }, [systems, activeSystemId, showToast]);

  // ── Attribute Manager: Add from manager to pool ──
  const addAttrFromManagerToPool = useCallback((attr) => {
    if (sys.attrPool.find(a => a.key === attr.key)) {
      showToast("属性已在当前系统属性池中", "yellow");
      return;
    }
    updateSys(s => ({ ...s, attrPool: [...s.attrPool, { ...attr }] }));
    showToast(`属性 "${attr.name}" 已添加到属性池`, "green");
  }, [sys.attrPool, updateSys, showToast]);

  // ── Attribute Manager: Import from Excel ──
  const handleImportExcel = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const newAttrs = [];
        const errors = [];
        
        jsonData.forEach((row, idx) => {
          const name = row["name"] || row["属性名称"];
          const id = row["id"] || row["数字id"] || row["attrId"];
          const type = row["attr_type"] || row["数值类型"] || row["valueType"];
          
          if (!name || !id) {
            errors.push(`第 ${idx + 1} 行: 缺少名称或ID`);
            return;
          }
          
          const attrId = Number(id);
          const valueType = Number(type) || 1;
          
          if (isNaN(attrId)) {
            errors.push(`第 ${idx + 1} 行: ID必须是数字`);
            return;
          }
          
          // 生成 key（基于名称的拼音或简化）
          const key = `attr_${attrId}`;
          
          // 检查是否已存在
          if (globalAttrs.find(a => a.attrId === attrId || a.key === key)) {
            errors.push(`第 ${idx + 1} 行: ID ${attrId} 或 key 已存在`);
            return;
          }
          
          newAttrs.push({ key, attrId, name: String(name).trim(), valueType });
        });
        
        if (newAttrs.length > 0) {
          setGlobalAttrs(prev => [...prev, ...newAttrs]);
          showToast(`成功导入 ${newAttrs.length} 个属性`, "green");
        }
        
        if (errors.length > 0) {
          console.warn("Excel导入问题:", errors);
          if (newAttrs.length === 0) {
            showToast(`导入失败: ${errors[0]}`, "red");
          }
        }
      } catch (err) {
        showToast("Excel解析失败", "red");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [globalAttrs, showToast]);

  // ── Attribute Manager: Export to Excel ──
  const handleExportExcel = useCallback(() => {
    const data = globalAttrs.map(a => ({
      name: a.name,
      id: a.attrId,
      attr_type: a.valueType,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "属性列表");
    XLSX.writeFile(wb, "属性管理器导出.xlsx");
    showToast("已导出到Excel", "green");
  }, [globalAttrs, showToast]);

  // ── Attribute Manager: CRUD ──
  const addToManager = useCallback(() => {
    const key = managerEditForm.key.trim().toLowerCase();
    const name = managerEditForm.name.trim();
    const attrId = Number(managerEditForm.attrId);
    
    if (!key || !name || !attrId) {
      showToast("请填写完整信息", "red");
      return;
    }
    
    if (globalAttrs.find(a => a.key === key)) {
      showToast("属性key已存在", "red");
      return;
    }
    if (globalAttrs.find(a => a.attrId === attrId)) {
      showToast("属性ID已存在", "red");
      return;
    }
    
    const newAttr = {
      key,
      attrId,
      name,
      valueType: Number(managerEditForm.valueType) || 1,
    };
    
    setGlobalAttrs(prev => [...prev, newAttr]);
    setManagerEditForm({ key: "", name: "", attrId: "", valueType: "1" });
    showToast("属性已添加到管理器", "green");
  }, [managerEditForm, globalAttrs, showToast]);

  const updateManagerAttr = useCallback(() => {
    if (!managerEditing) return;
    const name = managerEditForm.name.trim();
    const attrId = Number(managerEditForm.attrId);
    
    if (!name || !attrId) {
      showToast("请填写完整信息", "red");
      return;
    }
    
    // 检查ID是否与其他属性冲突
    const existing = globalAttrs.find(a => a.attrId === attrId && a.key !== managerEditing);
    if (existing) {
      showToast("属性ID已存在", "red");
      return;
    }
    
    setGlobalAttrs(prev => prev.map(a => 
      a.key === managerEditing 
        ? { ...a, name, attrId, valueType: Number(managerEditForm.valueType) || 1 }
        : a
    ));
    
    // 同时更新所有系统中该属性的信息
    setSystems(prev => prev.map(s => ({
      ...s,
      attrPool: s.attrPool.map(a => 
        a.key === managerEditing 
          ? { ...a, name, attrId, valueType: Number(managerEditForm.valueType) || 1 }
          : a
      ),
    })));
    
    setManagerEditing(null);
    setManagerEditForm({ key: "", name: "", attrId: "", valueType: "1" });
    showToast("属性已更新", "green");
  }, [managerEditing, managerEditForm, globalAttrs, showToast]);

  const deleteFromManager = useCallback((key) => {
    setGlobalAttrs(prev => prev.filter(a => a.key !== key));
    showToast("属性已从管理器删除", "yellow");
  }, [showToast]);

  const startEditManagerAttr = useCallback((attr) => {
    setManagerEditing(attr.key);
    setManagerEditForm({
      key: attr.key,
      name: attr.name,
      attrId: String(attr.attrId),
      valueType: String(attr.valueType),
    });
  }, []);

  const cancelEditManager = useCallback(() => {
    setManagerEditing(null);
    setManagerEditForm({ key: "", name: "", attrId: "", valueType: "1" });
  }, []);

  // ── Attribute Manager: Remove from pool ──
  const removeFromPool = useCallback((key) => {
    // 检查是否被使用
    const isUsed = usedAttrs.includes(key);
    if (isUsed) {
      showToast("该属性已被挂载到图鉴，无法移除", "red");
      return;
    }
    updateSys(s => ({ ...s, attrPool: s.attrPool.filter(a => a.key !== key) }));
    showToast("属性已从属性池移除", "green");
  }, [usedAttrs, updateSys, showToast]);

  // ── Save to Slot ──
  const handleSaveToSlot = useCallback((slotIndex) => {
    try {
      const saveData = {
        systems,
        globalAttrs,
        timestamp: Date.now(),
        version: "1.0",
      };
      
      setSaveSlots(prev => {
        const next = [...prev];
        // 确保数组长度足够
        while (next.length <= slotIndex) {
          next.push(null);
        }
        next[slotIndex] = saveData;
        return next;
      });
      
      showToast(`已保存到存档 ${slotIndex + 1}`, "green");
    } catch { 
      showToast("保存失败", "red"); 
    }
  }, [systems, globalAttrs, showToast]);

  // ── Load from Slot ──
  const handleLoadFromSlot = useCallback((slotIndex) => {
    try {
      const slot = saveSlots[slotIndex];
      if (!slot) {
        showToast("该存档为空", "red");
        return;
      }
      
      if (slot.systems && Array.isArray(slot.systems)) {
        setSystems(slot.systems);
        setActiveSystemId(slot.systems[0]?.id || "sys1");
      }
      
      if (slot.globalAttrs && Array.isArray(slot.globalAttrs)) {
        setGlobalAttrs(slot.globalAttrs);
      }
      
      setComputed(false);
      setShowLoadManager(false);
      showToast(`已从存档 ${slotIndex + 1} 加载`, "green");
    } catch { 
      showToast("加载失败", "red"); 
    }
  }, [saveSlots, showToast]);

  // ── Delete Slot ──
  const handleDeleteSlot = useCallback((slotIndex) => {
    setSaveSlots(prev => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    showToast(`已删除存档 ${slotIndex + 1}`, "yellow");
  }, [showToast]);

  // ── Format timestamp ──
  const formatSaveTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // ── Get slot info ──
  const getSlotInfo = (slot) => {
    if (!slot || !slot.systems) return null;
    const totalItems = slot.systems.reduce((sum, s) => sum + (s.items?.length || 0), 0);
    const totalAttrs = slot.globalAttrs?.length || 0;
    return { totalItems, totalAttrs, time: formatSaveTime(slot.timestamp) };
  };

  // ── Export ──
  const handleExport = useCallback(() => {
    const rows = [["id", "attr_id", "system", "quality", "max_stack", "reward"]];
    for (const s of systems) {
      for (const item of s.items) {
        const rewards = [];
        for (const attrKey of item.attrs) {
          const ad = s.attrPool.find(a => a.key === attrKey);
          const r = attrResults[attrKey];
          const ok = `${item.id}_${attrKey}`;
          const ov = s.manualOverrides[ok];
          const av = r?.values?.[item.star]?.final || 0;
          const val = (ov !== undefined && ov !== null) ? ov : av;
          if (val > 0 || item.attrs.includes(attrKey)) rewards.push(`${ad?.attrId || attrKey},${val}`);
        }
        rows.push([item.id, "", s.name, item.star, item.maxStack, rewards.join(";")]);
      }
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "codex_config.csv"; a.click();
    URL.revokeObjectURL(url);
    setShowExportConfirm(false);
    showToast("导出成功", "green");
  }, [systems, attrResults, showToast]);

  // ── Grouped items ──
  const groupedItems = useMemo(() => {
    const g = {};
    sys.qualities.forEach(q => { g[q.star] = []; });
    (sys.items || []).forEach(it => { if (g[it.star]) g[it.star].push(it); });
    return g;
  }, [sys]);

  // ── Selection helpers ──
  const toggleGroup = (star) => setCollapsedGroups(prev => { const n = new Set(prev); n.has(star) ? n.delete(star) : n.add(star); return n; });
  const toggleSelect = (id, e) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (e?.shiftKey || e?.ctrlKey || e?.metaKey) { n.has(id) ? n.delete(id) : n.add(id); } else { if (n.has(id) && n.size === 1) n.clear(); else { n.clear(); n.add(id); } }
      return n;
    });
  };
  const selectAllInGroup = (star) => {
    const ids = groupedItems[star]?.map(it => it.id) || [];
    setSelectedIds(prev => {
      const all = ids.every(id => prev.has(id));
      const n = new Set(prev);
      ids.forEach(id => all ? n.delete(id) : n.add(id));
      return n;
    });
  };

  // ── value display columns (max 4 on screen) ──
  const valueColumns = useMemo(() => usedAttrs.slice(0, 4), [usedAttrs]);

  // ── Filtered global attrs for manager ──
  const filteredGlobalAttrs = useMemo(() => {
    if (!managerSearch.trim()) return globalAttrs;
    const q = managerSearch.toLowerCase();
    return globalAttrs.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.key.toLowerCase().includes(q) ||
      String(a.attrId).includes(q)
    );
  }, [globalAttrs, managerSearch]);

  // ── Available attrs for selection (not in pool) ──
  const availableForSelection = useMemo(() => {
    const poolKeys = new Set(sys.attrPool.map(a => a.key));
    return globalAttrs.filter(a => !poolKeys.has(a.key));
  }, [globalAttrs, sys.attrPool]);

  // ══════════════════════
  //  RENDER
  // ══════════════════════
  return (
    <div style={{ width: "100%", height: "100vh", background: T.bg.app, color: T.text.primary, fontFamily: F.sans, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "7px 18px", borderRadius: 7, background: toast.type === "red" ? "#EF535020" : toast.type === "yellow" ? "#FFB30020" : "#4CAF5020", border: `1px solid ${toast.type === "red" ? T.accent.red : toast.type === "yellow" ? T.accent.yellow : T.accent.green}40`, color: toast.type === "red" ? T.accent.red : toast.type === "yellow" ? T.accent.yellow : T.accent.green, fontSize: 12, fontWeight: 600, backdropFilter: "blur(8px)" }}>
          {toast.msg}
        </div>
      )}

      {/* ═══ TOP NAV ═══ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: 42, background: T.bg.surface, borderBottom: `1px solid ${T.border.subtle}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>📖</div>
            <span style={{ fontSize: 12, fontWeight: 700 }}>图鉴数值配置</span>
          </div>
          <div style={{ width: 1, height: 16, background: T.border.subtle }} />
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {systems.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <button onClick={() => { setActiveSystemId(s.id); setComputed(false); setCollapsedGroups(new Set()); setSelectedIds(new Set()); }} style={{ padding: "3px 9px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11, fontWeight: activeSystemId === s.id ? 600 : 400, color: activeSystemId === s.id ? T.accent.blue : T.text.secondary, background: activeSystemId === s.id ? `${T.accent.blue}15` : "transparent" }}>
                  {s.name}<span style={{ marginLeft: 3, fontSize: 8, padding: "0 3px", borderRadius: 2, background: T.bg.elevated, color: T.text.muted, fontFamily: F.mono }}>{s.code}</span>
                </button>
                {systems.length > 1 && activeSystemId === s.id && (
                  <button onClick={() => deleteSystem(s.id)} style={{ position: "absolute", top: -3, right: -5, width: 13, height: 13, borderRadius: "50%", background: T.bg.elevated, border: `1px solid ${T.border.subtle}`, color: T.text.muted, fontSize: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setShowNewSystem(true)} style={{ padding: "3px 7px", borderRadius: 3, border: `1px dashed ${T.border.default}`, cursor: "pointer", fontSize: 9, color: T.text.muted, background: "transparent" }}>+</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => setShowAttrManager(true)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.accent.purple}50`, background: `${T.accent.purple}10`, color: T.accent.purple, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>📋 属性管理器</button>
          <div style={{ width: 1, height: 16, background: T.border.subtle }} />
          <button onClick={() => setShowLoadManager(true)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.border.default}`, background: "transparent", color: T.text.secondary, fontSize: 10, cursor: "pointer" }}>📂 读档</button>
          <button onClick={() => setShowSaveManager(true)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.accent.green}50`, background: `${T.accent.green}10`, color: T.accent.green, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>💾 存档</button>
          <button onClick={() => { if (!computed) { showToast("请先执行自动分配", "yellow"); return; } setShowExportConfirm(true); }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: T.accent.blue, color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>📤 导出</button>
        </div>
      </div>

      {/* ═══ SYSTEM CONFIG ═══ */}
      <div style={{ background: T.bg.surface, borderBottom: `1px solid ${T.border.subtle}`, flexShrink: 0 }}>
        <button onClick={() => setConfigCollapsed(!configCollapsed)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 14px", background: "transparent", border: "none", cursor: "pointer", color: T.text.secondary, fontSize: 10, fontFamily: F.sans, textAlign: "left" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text.primary }}>系统配置</span>
            <span style={{ color: T.text.muted, fontSize: 10 }}>{sys.name} · 段:{sys.code} · {sys.qualities.length}品质 · {sys.items.length}图鉴</span>
          </span>
          <span style={{ transform: configCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s", fontSize: 8 }}>▼</span>
        </button>
        {!configCollapsed && (
          <div style={{ padding: "0 14px 10px", display: "flex", gap: 8, overflowX: "auto", alignItems: "stretch" }}>
            <div style={{ minWidth: 130, padding: 9, background: T.bg.elevated, borderRadius: 6, border: `1px solid ${T.border.subtle}`, display: "flex", flexDirection: "column", gap: 5 }}>
              <Inp label="系统名称" value={sys.name} onChange={v => updateSys({ name: v })} />
              <Inp label="系统ID段" value={sys.code} onChange={v => updateSys(s => ({ ...s, code: v, generated: false, items: [] }))} mono />
              <div style={{ fontSize: 7, color: T.text.muted, padding: "2px 4px", background: T.bg.input, borderRadius: 2, lineHeight: 1.6 }}>
                ID: <span style={{ fontFamily: F.mono }}><span style={{ color: T.text.primary }}>{sys.code}</span><span style={{ color: T.quality[4]?.color }}>04</span><span style={{ color: T.accent.blue }}>001</span></span>
              </div>
            </div>
            {sys.qualities.map(q => {
              const qT = T.quality[q.star] || T.quality[1];
              return (
                <div key={q.star} style={{ minWidth: 130, padding: 9, background: T.bg.elevated, borderRadius: 6, border: `1px solid ${qT.border}`, borderTop: `2px solid ${qT.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <QBadge star={q.star} />
                    <button onClick={() => removeQuality(q.star)} style={{ background: "transparent", border: "none", color: T.text.muted, cursor: "pointer", fontSize: 9 }}>✕</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <Inp label="数量" value={q.count} onChange={v => updateQuality(q.star, "count", v)} mono />
                    <Inp label="堆叠" value={q.maxStack} onChange={v => updateQuality(q.star, "maxStack", v)} mono />
                    <Inp label="权重" value={q.weight} onChange={v => updateQuality(q.star, "weight", v)} mono type="number" step="0.01" />
                    <Inp label="品质段" value={String(q.star).padStart(2, "0")} disabled mono />
                  </div>
                </div>
              );
            })}
            <div onClick={() => { setNewQStar(String([1,2,3,4,5,6].find(s => !sys.qualities.find(q => q.star === s)) || 1)); setShowAddQuality(true); }} style={{ minWidth: 55, display: "flex", alignItems: "center", justifyContent: "center", padding: 8, background: T.bg.elevated, borderRadius: 6, border: `1px dashed ${T.border.default}`, cursor: "pointer" }}>
              <span style={{ fontSize: 10, color: T.text.muted }}>+</span>
            </div>
            <div style={{ minWidth: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button onClick={handleGenerate} style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", boxShadow: `0 2px 8px ${T.accent.blue}40` }}>⚡ 生成底表</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Data Grid ── */}
        <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border.subtle}`, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", background: T.bg.surface, borderBottom: `1px solid ${T.border.subtle}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>图鉴数据表</span>
              <span style={{ fontSize: 9, color: T.text.muted, background: T.bg.elevated, padding: "1px 5px", borderRadius: 8, fontFamily: F.mono }}>{sys.items.length}</span>
              {selectedIds.size > 0 && <span style={{ fontSize: 9, color: multiSelectMode ? T.accent.yellow : T.accent.blue, fontWeight: 600 }}>已选{selectedIds.size}</span>}
            </div>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <button 
                onClick={() => {
                  if (multiSelectMode) {
                    setMultiSelectMode(false);
                    setSelectedIds(new Set());
                  } else {
                    setMultiSelectMode(true);
                  }
                }} 
                style={{ 
                  padding: "2px 8px", 
                  borderRadius: 3, 
                  border: `1px solid ${multiSelectMode ? T.accent.yellow + "60" : T.border.default}`, 
                  background: multiSelectMode ? `${T.accent.yellow}15` : "transparent", 
                  color: multiSelectMode ? T.accent.yellow : T.text.secondary, 
                  fontSize: 9, 
                  cursor: "pointer",
                  fontWeight: multiSelectMode ? 600 : 400
                }}
              >
                {multiSelectMode ? "✓ 多选" : "多选"}
              </button>
              <div style={{ width: 1, height: 12, background: T.border.subtle }} />
              <button onClick={() => setCollapsedGroups(new Set())} style={{ padding: "2px 6px", borderRadius: 3, border: `1px solid ${T.border.default}`, background: "transparent", color: T.text.secondary, fontSize: 9, cursor: "pointer" }}>展开</button>
              <button onClick={() => setCollapsedGroups(new Set(sys.qualities.map(q => q.star)))} style={{ padding: "2px 6px", borderRadius: 3, border: `1px solid ${T.border.default}`, background: "transparent", color: T.text.secondary, fontSize: 9, cursor: "pointer" }}>折叠</button>
            </div>
          </div>

          {!sys.generated ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 36, opacity: 0.25 }}>📋</span>
              <span style={{ fontSize: 12, color: T.text.muted }}>配置品质后点击「生成底表」</span>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "auto" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `32px 74px 68px 38px 1fr ${valueColumns.map(() => "62px").join(" ")}`,
                alignItems: "center", padding: "4px 10px", background: T.bg.surface,
                borderBottom: `1px solid ${T.border.subtle}`, position: "sticky", top: 0, zIndex: 2,
                fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600
              }}>
                <span></span><span>ID</span><span>品质</span><span>叠</span><span>属性</span>
                {valueColumns.map(a => <span key={a} style={{ textAlign: "center" }}>{attrMap[a]?.name?.slice(0, 3) || a}</span>)}
              </div>

              {Object.entries(groupedItems).map(([star, items]) => {
                const qTh = T.quality[star] || T.quality[1];
                const isC = collapsedGroups.has(Number(star));
                const qD = sys.qualities.find(q => q.star === Number(star));
                const groupAllSel = items.length > 0 && items.every(it => selectedIds.has(it.id));
                return (
                  <div key={star}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: qTh.bg, borderBottom: `1px solid ${qTh.border}`, borderLeft: `3px solid ${qTh.color}` }}>
                      <input type="checkbox" checked={groupAllSel} onChange={() => selectAllInGroup(Number(star))} style={{ accentColor: qTh.color, width: 11, height: 11, cursor: "pointer" }} />
                      <span onClick={() => toggleGroup(Number(star))} style={{ cursor: "pointer", fontSize: 8, color: T.text.muted, transform: isC ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▼</span>
                      <QBadge star={Number(star)} />
                      <span style={{ fontSize: 9, color: T.text.secondary }}>{items.length}个 · 叠{qD?.maxStack} · 权重{qD?.weight}</span>
                      <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono, marginLeft: "auto" }}>{sys.code}{String(star).padStart(2, "0")}xxx</span>
                    </div>
                    {!isC && items.map((item, idx) => {
                      const isSel = selectedIds.has(item.id);
                      return (
                        <div 
                          key={item.id} 
                          onClick={(e) => {
                            if (multiSelectMode) {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedIds(prev => {
                                const n = new Set(prev);
                                n.has(item.id) ? n.delete(item.id) : n.add(item.id);
                                return n;
                              });
                            }
                          }}
                          style={{
                            display: "grid",
                            gridTemplateColumns: `32px 74px 68px 38px 1fr ${valueColumns.map(() => "62px").join(" ")}`,
                            alignItems: "center", padding: "3px 10px",
                            background: isSel ? T.bg.active : idx % 2 === 0 ? T.bg.app : T.bg.surface,
                            borderBottom: `1px solid ${T.border.subtle}`, fontSize: 10,
                            cursor: multiSelectMode ? "pointer" : "default"
                          }}
                        >
                          <span onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSel} 
                              onChange={(e) => toggleSelect(item.id, e)} 
                              style={{ accentColor: multiSelectMode ? T.accent.yellow : T.accent.blue, width: 11, height: 11, cursor: "pointer" }} 
                            />
                          </span>
                          <span style={{ fontFamily: F.mono, color: T.text.secondary, fontSize: 9 }}>{item.id}</span>
                          <span><QBadge star={item.star} compact /></span>
                          <span style={{ fontFamily: F.mono, color: T.text.secondary, textAlign: "center", fontSize: 10 }}>{item.maxStack}</span>
                          <span style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            {item.attrs.length === 0 && <span style={{ color: T.text.muted, fontSize: 8 }}>未挂载</span>}
                            {item.attrs.map(a => (
                              <span key={a} style={{ padding: "0 3px", borderRadius: 2, fontSize: 8, fontWeight: 500, background: `${T.accent.blue}15`, color: T.accent.blue, border: `1px solid ${T.accent.blue}30` }}>
                                {attrMap[a]?.name?.slice(0, 3) || a}
                              </span>
                            ))}
                          </span>
                          {valueColumns.map(attr => {
                            if (!item.attrs.includes(attr)) return <span key={attr} style={{ color: T.text.muted, fontSize: 9, textAlign: "center" }}>—</span>;
                            const ad = attrMap[attr];
                            const autoVal = computed && attrResults[attr]?.values?.[item.star]?.final;
                            const ok = `${item.id}_${attr}`;
                            const ov = sys.manualOverrides[ok];
                            const isManual = ov !== undefined && ov !== null;
                            const rawDisplay = isManual ? ov : (autoVal || "—");
                            const formatted = formatValue(rawDisplay, ad?.valueType || 1);
                            return (
                              <div key={attr} style={{ textAlign: "center" }}>
                                {computed ? (
                                  <div style={{ position: "relative" }}>
                                    <input value={isManual ? ov : (autoVal || "")} onChange={e => setManualOverride(item.id, attr, e.target.value)}
                                      style={{ width: "100%", padding: "1px 2px", background: isManual ? `${T.accent.yellow}12` : "transparent", border: `1px solid ${isManual ? T.accent.yellow + "40" : "transparent"}`, borderRadius: 2, color: isManual ? T.accent.yellow : T.accent.green, fontSize: 10, fontFamily: F.mono, fontWeight: 600, textAlign: "center", outline: "none", boxSizing: "border-box" }}
                                      title={`原始值: ${rawDisplay} → 显示: ${formatted}`} />
                                    {ad?.valueType > 1 && <div style={{ fontSize: 7, color: T.text.muted, marginTop: -1 }}>{formatted}</div>}
                                  </div>
                                ) : <span style={{ color: T.text.muted, fontSize: 9 }}>—</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Attribute Dashboard ── */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", background: T.bg.surface, borderBottom: `1px solid ${T.border.subtle}`, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>属性管理</span>
            {selectedIds.size > 0 && <span style={{ fontSize: 9, color: T.accent.blue, fontWeight: 600 }}>已选 {selectedIds.size} 个图鉴</span>}
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>

            {/* ── Attribute Pool ── */}
            <div style={{ padding: 8, background: T.bg.elevated, borderRadius: 6, border: `1px solid ${T.border.subtle}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: T.text.secondary, textTransform: "uppercase", letterSpacing: 1 }}>属性池 · 挂载操作</span>
                <button onClick={() => setShowSelectFromManager(true)} style={{ padding: "1px 5px", borderRadius: 2, border: `1px dashed ${T.accent.purple}60`, background: `${T.accent.purple}10`, color: T.accent.purple, fontSize: 8, cursor: "pointer", fontWeight: 600 }}>+ 从管理器添加</button>
              </div>
              {sys.attrPool.length === 0 ? (
                <div style={{ padding: 12, textAlign: "center", color: T.text.muted, fontSize: 10, background: T.bg.input, borderRadius: 4 }}>
                  属性池为空，点击上方按钮从属性管理器添加属性
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {sys.attrPool.map(a => {
                    const used = usedAttrs.includes(a.key);
                    const totalCount = (mountCounts[a.key] ? Object.values(mountCounts[a.key]).reduce((s, v) => s + v, 0) : 0);
                    const selHas = Array.from(selectedIds).some(id => sys.items.find(it => it.id === id)?.attrs.includes(a.key));
                    const vtLabel = a.valueType === 2 ? "百分比" : a.valueType === 3 ? "小数" : "整数";
                    return (
                      <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 6px", borderRadius: 4, background: used ? `${T.accent.blue}08` : T.bg.input, border: `1px solid ${used ? T.accent.blue + "20" : T.border.subtle}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: used ? T.accent.blue : T.text.muted, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: used ? T.text.primary : T.text.muted, minWidth: 48 }}>{a.name}</span>
                        <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono }}>{a.attrId || "—"}</span>
                        <span style={{ fontSize: 7, color: T.text.muted, padding: "0 3px", background: T.bg.elevated, borderRadius: 2 }}>{vtLabel}</span>
                        {totalCount > 0 && <span style={{ fontSize: 8, color: T.accent.blue, fontFamily: F.mono }}>×{totalCount}</span>}
                        <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                          <button onClick={() => mountAttrToSelected(a.key)} disabled={selectedIds.size === 0}
                            style={{ padding: "1px 6px", borderRadius: 2, border: `1px solid ${selectedIds.size > 0 ? T.accent.green + "60" : T.border.subtle}`, background: selectedIds.size > 0 ? `${T.accent.green}15` : "transparent", color: selectedIds.size > 0 ? T.accent.green : T.text.muted, fontSize: 8, cursor: selectedIds.size > 0 ? "pointer" : "not-allowed", fontWeight: 600 }}>
                            挂载
                          </button>
                          <button onClick={() => unmountAttrFromSelected(a.key)} disabled={selectedIds.size === 0 || !selHas}
                            style={{ padding: "1px 6px", borderRadius: 2, border: `1px solid ${selectedIds.size > 0 && selHas ? T.accent.red + "60" : T.border.subtle}`, background: selectedIds.size > 0 && selHas ? `${T.accent.red}10` : "transparent", color: selectedIds.size > 0 && selHas ? T.accent.red : T.text.muted, fontSize: 8, cursor: selectedIds.size > 0 && selHas ? "pointer" : "not-allowed", fontWeight: 600 }}>
                            卸载
                          </button>
                          <button onClick={() => removeFromPool(a.key)} disabled={used}
                            style={{ padding: "1px 6px", borderRadius: 2, border: `1px solid ${!used ? T.text.muted + "60" : T.border.subtle}`, background: "transparent", color: !used ? T.text.muted : T.text.muted, fontSize: 8, cursor: !used ? "pointer" : "not-allowed" }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Attribute Config Cards ── */}
            {usedAttrs.map(attrKey => {
              const ad = attrMap[attrKey] || { key: attrKey, name: attrKey, valueType: 1 };
              const cfg = sys.attrConfigs[attrKey] || { limit: 0, unit: 1, mode: "round" };
              const result = attrResults[attrKey];
              const actualTotal = actualTotals[attrKey];
              const limit = Number(cfg.limit) || 0;
              const error = computed && actualTotal !== undefined ? actualTotal - limit : null;
              const errorPct = limit > 0 && error !== null ? Math.abs(error / limit * 100).toFixed(1) : 0;
              const errorColor = error === null ? T.text.muted : Math.abs(error) === 0 ? T.accent.green : (Number(cfg.unit) || 1) >= Math.abs(error) ? T.accent.green : errorPct <= 3 ? T.accent.yellow : T.accent.red;
              const mc = mountCounts[attrKey] || {};
              const vtLabel = ad.valueType === 2 ? "百分比" : ad.valueType === 3 ? "小数" : "整数";

              return (
                <div key={attrKey} style={{ padding: 9, background: T.bg.elevated, borderRadius: 6, border: `1px solid ${T.border.subtle}`, borderLeft: `3px solid ${T.accent.blue}` }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{ad.name}</span>
                      <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono }}>id:{ad.attrId} · {vtLabel}</span>
                    </div>
                  </div>

                  {/* Mount counts per quality */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 5, flexWrap: "wrap" }}>
                    {sys.qualities.map(q => {
                      const cnt = mc[q.star] || 0;
                      const qc = T.quality[q.star]?.color || "#888";
                      return (
                        <span key={q.star} style={{ fontSize: 8, fontFamily: F.mono, color: cnt > 0 ? qc : T.text.muted, padding: "1px 4px", borderRadius: 2, background: cnt > 0 ? `${qc}15` : "transparent", border: `1px solid ${cnt > 0 ? qc + "30" : "transparent"}`, fontWeight: cnt > 0 ? 600 : 400 }}>
                          {T.quality[q.star]?.label?.slice(0, 1)}{cnt > 0 ? cnt : 0}
                        </span>
                      );
                    })}
                  </div>

                  {/* Inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 5 }}>
                    <Inp label="期望上限" value={cfg.limit} onChange={v => updateAttrConfig(attrKey, "limit", Number(v) || 0)} mono />
                    <Inp label="最小单元" value={cfg.unit} onChange={v => updateAttrConfig(attrKey, "unit", Number(v) || 1)} mono />
                    <div>
                      <label style={{ fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.7, display: "block", marginBottom: 2 }}>取整</label>
                      <select value={cfg.mode || "round"} onChange={e => updateAttrConfig(attrKey, "mode", e.target.value)} style={{ width: "100%", padding: "4px 3px", background: T.bg.input, border: `1px solid ${T.border.subtle}`, borderRadius: 3, color: T.text.primary, fontSize: 9, outline: "none", boxSizing: "border-box" }}>
                        <option value="round">四舍五入</option>
                        <option value="ceil">向上取整</option>
                        <option value="floor">向下取整</option>
                      </select>
                    </div>
                  </div>

                  {/* Results */}
                  {computed && result && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
                        <Pill label="实际" value={actualTotal !== undefined ? (ad.valueType === 1 ? actualTotal : formatValue(actualTotal, ad.valueType)) : "—"} color={errorColor} />
                        <Pill label="误差" value={error === null ? "—" : error === 0 ? "0" : (error > 0 ? "+" : "") + error} color={errorColor} />
                        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 5px", borderRadius: 3, background: `${errorColor}15`, border: `1px solid ${errorColor}30` }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: errorColor }} />
                          <span style={{ fontSize: 8, color: errorColor, fontWeight: 600 }}>{error === 0 ? "完美" : `${errorPct}%`}</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: 3 }}>
                        <MiniBar segments={Object.entries(result.values).map(([s, v]) => ({ value: v.final * v.count * v.stack, color: T.quality[s]?.color || "#888", label: `${T.quality[s]?.label || s}: ${v.final * v.count * v.stack}` }))} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 3 }}>
                        {Object.entries(result.values).map(([s, v]) => {
                          const qc = T.quality[s]?.color || "#888";
                          return (
                            <div key={s} style={{ padding: "3px 4px", background: T.bg.input, borderRadius: 3, borderTop: `2px solid ${qc}` }}>
                              <div style={{ fontSize: 7, color: T.text.muted }}>{T.quality[s]?.label} 单次</div>
                              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: F.mono, color: qc }}>{ad.valueType === 1 ? v.final : formatValue(v.final, ad.valueType)}</div>
                              <div style={{ fontSize: 7, color: T.text.muted }}>原始:{v.final} ×{v.count}×{v.stack}={v.final * v.count * v.stack}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {usedAttrs.length === 0 && sys.generated && (
              <div style={{ padding: 16, textAlign: "center", color: T.text.muted, fontSize: 11 }}>
                选择图鉴后使用上方属性池的「挂载」按钮分配属性
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
              <button onClick={handleCompute} disabled={usedAttrs.length === 0} style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "none", background: usedAttrs.length === 0 ? T.bg.elevated : `linear-gradient(135deg, ${T.accent.blue}, ${T.accent.purple})`, color: usedAttrs.length === 0 ? T.text.muted : "#fff", fontSize: 11, fontWeight: 700, cursor: usedAttrs.length === 0 ? "not-allowed" : "pointer", boxShadow: usedAttrs.length > 0 ? `0 3px 10px ${T.accent.blue}30` : "none" }}>⚡ 执行自动分配</button>
              {computed && Object.keys(sys.manualOverrides).filter(k => sys.manualOverrides[k] !== undefined).length > 0 && (
                <button onClick={clearAllOverrides} style={{ padding: "8px 8px", borderRadius: 6, border: `1px solid ${T.accent.yellow}40`, background: `${T.accent.yellow}10`, color: T.accent.yellow, fontSize: 9, cursor: "pointer", fontWeight: 600 }}>↺ 清除手动值</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <Modal open={showNewSystem} onClose={() => setShowNewSystem(false)} title="新建系统">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Inp label="系统名称" value={newSysName} onChange={setNewSysName} placeholder="如：公会商店" />
          <Inp label="系统ID段 (3位)" value={newSysCode} onChange={setNewSysCode} placeholder="如：102" mono />
          <button onClick={addSystem} style={{ padding: "8px", borderRadius: 6, border: "none", background: T.accent.blue, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>创建</button>
        </div>
      </Modal>

      <Modal open={showAddQuality} onClose={() => setShowAddQuality(false)} title="添加品质">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 9, color: T.text.muted, textTransform: "uppercase", display: "block", marginBottom: 4 }}>品质等级</label>
            <div style={{ display: "flex", gap: 3 }}>
              {[1, 2, 3, 4, 5, 6].map(s => {
                const exists = sys.qualities.find(q => q.star === s);
                return (
                  <button key={s} onClick={() => !exists && setNewQStar(String(s))} disabled={!!exists} style={{ padding: "4px 7px", borderRadius: 3, border: `1px solid ${Number(newQStar) === s ? T.quality[s].color : T.border.subtle}`, background: Number(newQStar) === s ? T.quality[s].bg : "transparent", color: exists ? T.text.muted : T.quality[s].color, fontSize: 10, cursor: exists ? "not-allowed" : "pointer", opacity: exists ? 0.3 : 1, fontWeight: 600 }}>
                    {T.quality[s].label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <Inp label="图鉴数量" value={newQCount} onChange={setNewQCount} mono />
            <Inp label="堆叠数" value={newQStack} onChange={setNewQStack} mono />
            <Inp label="属性权重" value={newQWeight} onChange={setNewQWeight} mono type="number" step="0.01" />
          </div>
          <button onClick={addQuality} style={{ padding: "8px", borderRadius: 6, border: "none", background: T.accent.blue, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>添加</button>
        </div>
      </Modal>

      <Modal open={showExportConfirm} onClose={() => setShowExportConfirm(false)} title="导出确认" width={460}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {systems.filter(s => s.items.length > 0).map(s => {
            const sa = new Set();
            s.items.forEach(it => it.attrs.forEach(a => sa.add(a)));
            return (
              <div key={s.id} style={{ padding: 8, background: T.bg.input, borderRadius: 5, border: `1px solid ${T.border.subtle}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{s.name} <span style={{ fontFamily: F.mono, color: T.text.muted, fontSize: 9 }}>({s.code})</span></div>
                <div style={{ fontSize: 9, color: T.text.secondary }}>图鉴: {s.items.length} · 属性: {Array.from(sa).map(a => s.attrPool.find(x => x.key === a)?.name || a).join(", ") || "无"}</div>
              </div>
            );
          })}
          <div style={{ fontSize: 9, color: T.text.muted }}>导出为 CSV（Excel可直接打开）</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={() => setShowExportConfirm(false)} style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${T.border.default}`, background: "transparent", color: T.text.secondary, fontSize: 10, cursor: "pointer" }}>取消</button>
            <button onClick={handleExport} style={{ padding: "6px 12px", borderRadius: 5, border: "none", background: T.accent.blue, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>确认导出</button>
          </div>
        </div>
      </Modal>

      {/* ═══ ATTRIBUTE MANAGER MODAL ═══ */}
      <Modal open={showAttrManager} onClose={() => { setShowAttrManager(false); setManagerEditing(null); cancelEditManager(); }} title="属性管理器" width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input 
              type="text" 
              placeholder="搜索属性..." 
              value={managerSearch}
              onChange={e => setManagerSearch(e.target.value)}
              style={{ flex: 1, padding: "5px 8px", background: T.bg.input, border: `1px solid ${T.border.subtle}`, borderRadius: 3, color: T.text.primary, fontSize: 11, outline: "none", minWidth: 120 }}
            />
            <button 
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".xlsx,.xls";
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportExcel(file);
                };
                input.click();
              }}
              style={{ padding: "5px 10px", borderRadius: 4, border: `1px solid ${T.accent.blue}60`, background: `${T.accent.blue}10`, color: T.accent.blue, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
            >
              📥 导入Excel
            </button>
            <button 
              onClick={handleExportExcel}
              style={{ padding: "5px 10px", borderRadius: 4, border: `1px solid ${T.accent.green}60`, background: `${T.accent.green}10`, color: T.accent.green, fontSize: 10, cursor: "pointer", fontWeight: 600 }}
            >
              📤 导出Excel
            </button>
          </div>

          {/* Add/Edit Form */}
          <div style={{ padding: 10, background: T.bg.input, borderRadius: 6, border: `1px solid ${T.border.subtle}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.text.secondary, marginBottom: 8 }}>
              {managerEditing ? "编辑属性" : "添加新属性"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: managerEditing ? "1fr 1fr 80px 100px" : "1fr 1fr 80px 100px 80px", gap: 6 }}>
              <Inp label="属性Key" value={managerEditForm.key} onChange={v => setManagerEditForm(p => ({ ...p, key: v }))} mono placeholder="atk" disabled={managerEditing} />
              <Inp label="属性名称" value={managerEditForm.name} onChange={v => setManagerEditForm(p => ({ ...p, name: v }))} placeholder="攻击力" />
              <Inp label="属性ID" value={managerEditForm.attrId} onChange={v => setManagerEditForm(p => ({ ...p, attrId: v }))} mono placeholder="1001" />
              <div>
                <label style={{ fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.7, display: "block", marginBottom: 2 }}>数值类型</label>
                <select 
                  value={managerEditForm.valueType} 
                  onChange={e => setManagerEditForm(p => ({ ...p, valueType: e.target.value }))}
                  style={{ width: "100%", padding: "4px 3px", background: T.bg.elevated, border: `1px solid ${T.border.subtle}`, borderRadius: 3, color: T.text.primary, fontSize: 10, outline: "none", boxSizing: "border-box" }}
                >
                  <option value="1">整数</option>
                  <option value="2">百分比</option>
                  <option value="3">小数</option>
                </select>
              </div>
              {!managerEditing ? (
                <button onClick={addToManager} style={{ alignSelf: "flex-end", padding: "5px 8px", borderRadius: 4, border: "none", background: T.accent.blue, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>添加</button>
              ) : (
                <div style={{ display: "flex", gap: 4, alignSelf: "flex-end" }}>
                  <button onClick={updateManagerAttr} style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "none", background: T.accent.blue, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>保存</button>
                  <button onClick={cancelEditManager} style={{ padding: "5px 8px", borderRadius: 4, border: `1px solid ${T.border.default}`, background: "transparent", color: T.text.secondary, fontSize: 10, cursor: "pointer" }}>取消</button>
                </div>
              )}
            </div>
          </div>

          {/* Attributes List */}
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "4px 6px", background: T.bg.surface, borderRadius: 3, marginBottom: 4, fontSize: 8, color: T.text.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
              <span style={{ flex: 1 }}>属性名称</span>
              <span style={{ width: 70 }}>Key</span>
              <span style={{ width: 50 }}>ID</span>
              <span style={{ width: 50 }}>类型</span>
              <span style={{ width: 60, textAlign: "center" }}>操作</span>
            </div>
            {filteredGlobalAttrs.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: T.text.muted, fontSize: 11 }}>
                {managerSearch ? "未找到匹配的属性" : "暂无属性，请添加或导入"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filteredGlobalAttrs.map(attr => {
                  const vtLabel = attr.valueType === 2 ? "百分比" : attr.valueType === 3 ? "小数" : "整数";
                  return (
                    <div key={attr.key} style={{ display: "flex", alignItems: "center", padding: "5px 6px", background: T.bg.input, borderRadius: 3, fontSize: 10 }}>
                      <span style={{ flex: 1, fontWeight: 600, color: T.text.primary }}>{attr.name}</span>
                      <span style={{ width: 70, fontFamily: F.mono, color: T.text.secondary, fontSize: 9 }}>{attr.key}</span>
                      <span style={{ width: 50, fontFamily: F.mono, color: T.text.muted }}>{attr.attrId}</span>
                      <span style={{ width: 50, color: T.text.muted }}>{vtLabel}</span>
                      <div style={{ width: 60, display: "flex", gap: 4, justifyContent: "center" }}>
                        <button onClick={() => startEditManagerAttr(attr)} style={{ padding: "1px 5px", borderRadius: 2, border: `1px solid ${T.border.default}`, background: "transparent", color: T.text.secondary, fontSize: 8, cursor: "pointer" }}>编辑</button>
                        <button onClick={() => deleteFromManager(attr.key)} style={{ padding: "1px 5px", borderRadius: 2, border: `1px solid ${T.accent.red}40`, background: `${T.accent.red}10`, color: T.accent.red, fontSize: 8, cursor: "pointer" }}>删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ fontSize: 8, color: T.text.muted, textAlign: "center" }}>
            共 {globalAttrs.length} 个属性 {managerSearch && `(搜索到 ${filteredGlobalAttrs.length} 个)`}
          </div>
        </div>
      </Modal>

      {/* ═══ SELECT FROM MANAGER MODAL ═══ */}
      <Modal open={showSelectFromManager} onClose={() => setShowSelectFromManager(false)} title="从属性管理器添加" width={420}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {availableForSelection.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: T.text.muted }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 11 }}>没有可添加的属性</div>
              <div style={{ fontSize: 9, marginTop: 4 }}>属性管理器中的所有属性已在当前系统属性池中</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9, color: T.text.secondary, marginBottom: 4 }}>
                选择要添加到当前系统属性池的属性：
              </div>
              <div style={{ maxHeight: 350, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                {availableForSelection.map(attr => {
                  const vtLabel = attr.valueType === 2 ? "百分比" : attr.valueType === 3 ? "小数" : "整数";
                  return (
                    <div key={attr.key} style={{ display: "flex", alignItems: "center", padding: "6px 8px", background: T.bg.input, borderRadius: 4, border: `1px solid ${T.border.subtle}` }}>
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 600 }}>{attr.name}</span>
                      <span style={{ fontSize: 8, color: T.text.muted, fontFamily: F.mono, marginRight: 8 }}>{attr.key}</span>
                      <span style={{ fontSize: 8, color: T.text.muted, padding: "1px 4px", background: T.bg.elevated, borderRadius: 2, marginRight: 8 }}>ID:{attr.attrId}</span>
                      <span style={{ fontSize: 8, color: T.text.muted, padding: "1px 4px", background: T.bg.elevated, borderRadius: 2, marginRight: 12 }}>{vtLabel}</span>
                      <button 
                        onClick={() => { addAttrFromManagerToPool(attr); }}
                        style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.accent.green}60`, background: `${T.accent.green}15`, color: T.accent.green, fontSize: 9, cursor: "pointer", fontWeight: 600 }}
                      >
                        添加
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ═══ SAVE MANAGER MODAL ═══ */}
      <Modal open={showSaveManager} onClose={() => setShowSaveManager(false)} title="💾 存档管理" width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, color: T.text.secondary, marginBottom: 4 }}>
            选择存档位置进行保存（最多 {MAX_SAVE_SLOTS} 个栏位）：
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: 8,
            maxHeight: 400,
            overflow: "auto",
            padding: 4
          }}>
            {Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => {
              const slot = saveSlots[i];
              const info = getSlotInfo(slot);
              const isEmpty = !slot;
              
              return (
                <div 
                  key={i} 
                  onClick={() => { handleSaveToSlot(i); setShowSaveManager(false); }}
                  style={{
                    padding: 10,
                    background: isEmpty ? T.bg.input : `${T.accent.green}08`,
                    borderRadius: 6,
                    border: `1px solid ${isEmpty ? T.border.subtle : T.accent.green + "40"}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    minHeight: 80,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent.green; e.currentTarget.style.background = `${T.accent.green}15`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isEmpty ? T.border.subtle : T.accent.green + "40"; e.currentTarget.style.background = isEmpty ? T.bg.input : `${T.accent.green}08`; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? T.text.muted : T.accent.green }}>存档 {i + 1}</span>
                    {isEmpty && <span style={{ fontSize: 8, color: T.text.muted, padding: "1px 4px", background: T.bg.elevated, borderRadius: 2 }}>空</span>}
                  </div>
                  
                  {isEmpty ? (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                      <span style={{ fontSize: 20, color: T.text.muted }}>+</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 9, color: T.text.secondary }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>系统:</span>
                        <span style={{ color: T.text.primary }}>{slot.systems?.length || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>图鉴:</span>
                        <span style={{ color: T.text.primary }}>{info?.totalItems || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>属性:</span>
                        <span style={{ color: T.text.primary }}>{info?.totalAttrs || 0}</span>
                      </div>
                      <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${T.border.subtle}`, color: T.text.muted, fontSize: 8 }}>
                        {info?.time}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{ fontSize: 8, color: T.text.muted, textAlign: "center", marginTop: 4 }}>
            提示：点击栏位即可保存，已有数据的栏位将被覆盖
          </div>
        </div>
      </Modal>

      {/* ═══ LOAD MANAGER MODAL ═══ */}
      <Modal open={showLoadManager} onClose={() => setShowLoadManager(false)} title="📂 读档管理" width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, color: T.text.secondary, marginBottom: 4 }}>
            选择要读取的存档：
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: 8,
            maxHeight: 400,
            overflow: "auto",
            padding: 4
          }}>
            {Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => {
              const slot = saveSlots[i];
              const info = getSlotInfo(slot);
              const isEmpty = !slot;
              
              return (
                <div 
                  key={i} 
                  onClick={() => { !isEmpty && handleLoadFromSlot(i); }}
                  style={{
                    padding: 10,
                    background: isEmpty ? T.bg.input : T.bg.elevated,
                    borderRadius: 6,
                    border: `1px solid ${isEmpty ? T.border.subtle : T.accent.blue + "40"}`,
                    cursor: isEmpty ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    minHeight: 80,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: isEmpty ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!isEmpty) { e.currentTarget.style.borderColor = T.accent.blue; e.currentTarget.style.background = `${T.accent.blue}10`; }}}
                  onMouseLeave={e => { if (!isEmpty) { e.currentTarget.style.borderColor = T.accent.blue + "40"; e.currentTarget.style.background = T.bg.elevated; }}}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? T.text.muted : T.accent.blue }}>存档 {i + 1}</span>
                    {isEmpty && <span style={{ fontSize: 8, color: T.text.muted, padding: "1px 4px", background: T.bg.input, borderRadius: 2 }}>空</span>}
                    {!isEmpty && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSlot(i); }}
                        style={{ 
                          padding: "1px 4px", 
                          borderRadius: 2, 
                          border: `1px solid ${T.accent.red}40`, 
                          background: `${T.accent.red}10`, 
                          color: T.accent.red, 
                          fontSize: 7, 
                          cursor: "pointer" 
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  
                  {isEmpty ? (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                      <span style={{ fontSize: 10, color: T.text.muted }}>无数据</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 9, color: T.text.secondary }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>系统:</span>
                        <span style={{ color: T.text.primary }}>{slot.systems?.length || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>图鉴:</span>
                        <span style={{ color: T.text.primary }}>{info?.totalItems || 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>属性:</span>
                        <span style={{ color: T.text.primary }}>{info?.totalAttrs || 0}</span>
                      </div>
                      <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${T.border.subtle}`, color: T.text.muted, fontSize: 8 }}>
                        {info?.time}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{ fontSize: 8, color: T.text.muted, textAlign: "center", marginTop: 4 }}>
            提示：点击有数据的栏位即可读取，点击删除按钮可清空存档
          </div>
        </div>
      </Modal>
    </div>
  );
}
