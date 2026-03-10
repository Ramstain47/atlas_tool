// ══════════════════════════════════════════════════════════
//  应用常量
// ══════════════════════════════════════════════════════════

// 属性标签可选颜色
export const ATTR_COLORS = [
  "#5B8DEF", "#4CAF50", "#FFA726", "#EF5350",
  "#AB47BC", "#FFB300", "#26C6DA", "#EC407A",
  "#7E57C2", "#8D6E63", "#26A69A", "#D4E157",
  "#78909C", "#FF7043", "#5C6BC0", "#66BB6A",
];

// 默认全局属性（for attribute manager）
export const DEFAULT_GLOBAL_ATTRS = [
  { key: "atk", attrId: 1001, name: "攻击力", valueType: 1, color: "#EF5350" },
  { key: "hp", attrId: 1002, name: "生命值", valueType: 1, color: "#4CAF50" },
  { key: "def", attrId: 1003, name: "防御力", valueType: 1, color: "#5B8DEF" },
  { key: "crit", attrId: 2001, name: "暴击率", valueType: 2, color: "#FFA726" },
  { key: "crit_dmg", attrId: 2002, name: "暴击伤害", valueType: 2, color: "#FFB300" },
  { key: "spd", attrId: 1004, name: "速度", valueType: 1, color: "#26C6DA" },
  { key: "dodge", attrId: 2003, name: "闪避率", valueType: 2, color: "#AB47BC" },
  { key: "hp_regen", attrId: 3001, name: "生命回复", valueType: 3, color: "#66BB6A" },
];

// localStorage keys
export const STORAGE_KEY_ATTRS = "codex_global_attrs";
export const STORAGE_KEY_SYSTEMS = "codex_systems";
export const STORAGE_KEY_SAVE_SLOTS = "codex_save_slots";
export const STORAGE_KEY_TEMPLATES = "codex_templates";

// 最大存档槽位数
export const MAX_SAVE_SLOTS = 20;

// 默认系统配置
export function createDefaultSystem(name, code) {
  return {
    id: "sys_" + Date.now() + Math.random().toString(36).slice(2, 6),
    name,
    code,
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
