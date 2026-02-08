# ⚙️ Cog Works

Drop-in React components for cog-themed navigation menus and submenus.

## Components

### `<CogMenu />` — Radial Navigation
A gear icon that expands menu items in a radial arc on click/hover. Supports nested submenus, configurable arc angles, and spring animations.

### `<CogSidebar />` — Collapsible Section Navigation
A sidebar that collapses to a strip of spinning cog icons. Each section expands to show nested nav items with badges and active states.

### `<CogDropdown />` — Inline Gear Dropdown
A traditional dropdown triggered by a spinning cog. Clean, compact, supports dividers and disabled items.

## Quick Start

```bash
npm install
npm run dev
```

## Stack

- React 19 + TypeScript
- Framer Motion (animations)
- Tailwind CSS v4

## Usage

```tsx
import { CogMenu, CogSidebar, CogDropdown } from './components'

// Radial menu
<CogMenu items={[
  { label: 'Home', icon: '🏠', onClick: () => {} },
  { label: 'Settings', icon: '⚙️', items: [...subItems] },
]} />

// Sidebar
<CogSidebar sections={[
  { label: 'Nav', items: [{ label: 'Dashboard', active: true }] },
]} />

// Dropdown
<CogDropdown items={[
  { label: 'Profile', icon: '👤', onClick: () => {} },
  { divider: true },
  { label: 'Logout', icon: '🔌' },
]} label="Menu" />
```

## License

MIT
