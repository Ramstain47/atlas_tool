# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

图鉴数值配置工具 (Codex Tool) — a game collectible/codex numerical configuration tool. It allows game designers to define "systems" (collections), each containing quality tiers (star levels) with items, then mount attributes onto items and compute balanced attribute values via weighted distribution.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## Tech Stack

React 19 + Vite 7, plain JavaScript (no TypeScript). All styling is inline (no CSS framework). Uses `xlsx` library for spreadsheet export. No router — single-page app with modal-based navigation.

## Architecture

### State Management

No external state library. All state lives in `App.jsx` via custom hooks:

- **`useSystems`** (`src/hooks/useSystems.js`) — Core hook. Manages the array of systems, active system selection, quality CRUD, item generation, attribute pool/mounting/unmounting, attribute config, manual overrides, and computed results. This is the largest and most important hook.
- **`useGlobalAttrs`** — Global attribute registry (shared across all systems). Attributes are added here first, then selectively added to each system's `attrPool`.
- **`useSaveSlots`** — Save/load slot management (up to 20 slots in localStorage).
- **`useTemplates`** — System templates for reuse when creating new systems.
- **`useToast`** — Simple toast notification system.

### Data Model (key structures)

A **System** (`createDefaultSystem` in `src/constants/app.js`):
```
{ id, name, code, qualities[], items[], attrPool[], attrConfigs{}, manualOverrides{}, generated }
```

- `qualities[]` — Star tiers: `{ star, count, maxStack, weight }`
- `items[]` — Generated codex entries: `{ id, star, maxStack, attrs[] }`. Item IDs follow format `{code}{star:02d}{seq:03d}` (see `buildId` in `format.js`)
- `attrPool[]` — Attributes enabled for this system (subset of globalAttrs)
- `attrConfigs{}` — Per-attribute computation config: `{ limit, unit, mode }` where mode is "round"/"ceil"/"floor"
- `manualOverrides{}` — Manual value overrides keyed as `{itemId}_{attrKey}`

Attribute `valueType`: 1 = integer, 2 = percentage (raw/10000), 3 = decimal (raw/100)

### Core Algorithm

`computeAttribute` in `src/utils/compute.js` — Distributes a total `limitTarget` across quality tiers weighted by `weight`, then divides per-tier allocation by (count × maxStack), rounding to `unit` increments.

### Layout Structure

- `App.jsx` — Boot screen (save slot selection) → Main app
- Main app layout: `TopNav` (system tabs) → `SystemConfig` (quality config, collapsible) → horizontal split of `DataGrid` (left, item grid) + `AttrPanel` (right, attribute dashboard)
- Multiple modals for CRUD operations (all in `src/components/modals/`)

### Persistence

All data persists to `localStorage` with keys prefixed `codex_` (defined in `src/constants/app.js`). Auto-save on every state change. Manual save slots provide snapshot/restore functionality.

### Theming

Dark theme defined in `src/constants/theme.js`. `T` object for colors, `F` for font families. Quality tiers 1-6 have predefined color schemes in `T.quality`.

## Conventions

- UI text is in Chinese
- Components use inline styles exclusively (no CSS classes)
- Custom reusable UI primitives in `src/components/ui/` (Modal, Inp, Pill, QBadge, MiniBar)
- All hooks return memoized callbacks via `useCallback` and derived data via `useMemo`
