// ══════════════════════════════════════════════════════════
//  应用常量
// ══════════════════════════════════════════════════════════

// 默认全局属性（for attribute manager）
export const DEFAULT_GLOBAL_ATTRS = [
  { key: "atk", attrId: 1001, name: "攻击力", valueType: 1 },
  { key: "hp", attrId: 1002, name: "生命值", valueType: 1 },
  { key: "def", attrId: 1003, name: "防御力", valueType: 1 },
  { key: "crit", attrId: 2001, name: "暴击率", valueType: 2 },
  { key: "crit_dmg", attrId: 2002, name: "暴击伤害", valueType: 2 },
  { key: "spd", attrId: 1004, name: "速度", valueType: 1 },
  { key: "dodge", attrId: 2003, name: "闪避率", valueType: 2 },
  { key: "hp_regen", attrId: 3001, name: "生命回复", valueType: 3 },
];

// localStorage keys
export const STORAGE_KEY_ATTRS = "codex_global_attrs";
export const STORAGE_KEY_SYSTEMS = "codex_systems";
export const STORAGE_KEY_SAVE_SLOTS = "codex_save_slots";

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
