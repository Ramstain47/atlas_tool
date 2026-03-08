// ══════════════════════════════════════════════════════════
//  本地存储工具
// ══════════════════════════════════════════════════════════

import { DEFAULT_GLOBAL_ATTRS, STORAGE_KEY_ATTRS, STORAGE_KEY_SYSTEMS, STORAGE_KEY_SAVE_SLOTS } from "../constants/app";

// Load/Save global attributes
export function loadGlobalAttrs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ATTRS);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [...DEFAULT_GLOBAL_ATTRS];
}

export function saveGlobalAttrs(attrs) {
  try {
    localStorage.setItem(STORAGE_KEY_ATTRS, JSON.stringify(attrs));
  } catch {
    // ignore
  }
}

// Load/Save systems
export function loadSystems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SYSTEMS);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
}

export function saveSystems(systems) {
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEMS, JSON.stringify(systems));
  } catch {
    // ignore
  }
}

// Load/Save slots
export function loadSaveSlots() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SAVE_SLOTS);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
}

export function saveSaveSlots(slots) {
  try {
    localStorage.setItem(STORAGE_KEY_SAVE_SLOTS, JSON.stringify(slots));
  } catch {
    // ignore
  }
}

// Format timestamp
export function formatSaveTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
