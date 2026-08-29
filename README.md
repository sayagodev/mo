# Mo UI 墨

> Semantic HTML components, shadcn-neutral tokens, zero dependencies.

Mo (墨, "ink") is a fork of [oat](https://oat.ink) rebuilt around the
[shadcn/ui](https://ui.shadcn.com) design language — its exact **neutral**
palette in oklch, radius scale and shadows — using only modern CSS
(cascade layers, `light-dark()`, `color-mix()`, popovers) and a little vanilla JS.

No build step for consumers. No classes required. No CSS that fights yours.

## Quick start

**CDN (zero build):**

```html
<link rel="stylesheet" href="mo.min.css" />
<script src="mo.min.js"></script>
```

```html
<button>Save</button>          <!-- styled: primary button -->
<input placeholder="Email" />  <!-- styled: shadcn-like input -->
<mo-tabs>…</mo-tags>           <!-- behavior via native custom elements -->
```

**Optimized — pick only what you need (shadcn-like CLI):**

```sh
# 1. Initialize once (copies base theme + shared deps)
pnpm dlx @sayagodev/mo@latest init

# 2. Add components interactively (multi-select like shadcn)
pnpm dlx @sayagodev/mo@latest add
# or directly: pnpm dlx @sayagodev/mo add button card dialog dropdown

# 3. Import the generated bundle in your app
import "mo/index.css";
import "mo/index.js";
# or granular: import "mo/button.css"; import "mo/dropdown.js";
```

Interactive `mo add` shows a searchable checklist (space to select, enter to confirm), identical to `shadcn add`. Supports `--all`, `--dry-run`, `--overwrite`, `--path`.

Non-interactive / CI:

```sh
pnpm dlx @sayagodev/mo add button card --yes
pnpm dlx @sayagodev/mo add --all --yes
```

**Granular ESM + CSS imports (Vite / Next / Astro, tree-shakable):**

```js
// CSS — import only what you use (saves ~75% vs full bundle)
import "@sayagodev/mo/css/00-base.css";
import "@sayagodev/mo/css/01-theme.css";
import "@sayagodev/mo/css/button.css";
import "@sayagodev/mo/css/dialog.css";

// JS — per-component ESM (side-effect import registers the element)
import "@sayagodev/mo/js/dropdown.js";
import "@sayagodev/mo/js/tabs.js";
// or via mo.esm.js barrel (still ESM, but full bundle — prefer per-file for smallest)
import { toast } from "@sayagodev/mo/js/toast.js";
```

Package is `type: module` with `exports` (`./css/*`, `./js/*`) and `sideEffects: ["*.css"]` so bundlers keep CSS and tree-shake unused JS. Full bundle is 21kB gz CSS / 20kB gz JS; a 5-component setup is <8kB gz.

## Theming (never fights your CSS)

All library styles live in cascade layers (`theme → base → components → prose →
animations → utilities`). Any unlayered rule you write wins, regardless of load
order:

```css
/* your.css */
:root {
  --primary: oklch(0.55 0.2 260);   /* retheme globally */
  --radius: 0.5rem;                 /* whole radius scale follows */
  --mo-card-radius: 0;              /* per-component hooks */
}
[data-variant="info"] { --variant-color: var(--chart-2); }
```

### Global variables file (shadcn-style)

Import the canonical, editable `variables.css` — it declares **every** token Mo
reads (base theme colors, radius, spacing, type, shadows, transitions) plus all
the per-component `--mo-*` hooks, so you can see every default and override the
whole library from one `:root` block. It is unlayered, so it wins the cascade.

```sh
pnpm dlx @sayagodev/mo init          # copies variables.css into your components dir
# or import from the package:
import "@sayagodev/mo/variables.css";
```

```css
/* variables.css (edited) */
:root {
  --background: oklch(0.97 0 0);
  --primary: oklch(0.55 0.2 260);
  --mo-card-radius: 1.25rem;
  --mo-button-radius: 999px;
}
```

Dark mode follows the OS automatically; force it with
`<html data-theme="dark">`. See `ANALYSIS.md` for the full audit,
token table and override model.

### TypeScript / JSX

Mo ships `mo.d.ts` declaring every custom element (`mo-tabs`, `mo-dropdown`,
`mo-carousel`…) and the native HTML attributes it relies on
(`popovertarget`, `popovertargetaction`, `command`, `commandfor`), so `<button
popovertarget="x">`, `<menu popover>` and `<mo-*>…` type-check in React and
React Server Components with **zero** extra config. The JSX augmentation is
lazy (`import('react')`), so vanilla TypeScript consumers are unaffected.

## Components

Buttons, badges, inputs/textarea/select/checkbox/radio/switch/slider, tag input,
cards, tables, tabs (`mo-tabs`), accordion (`details`), dialog (`<dialog>` +
`commandfor`), dropdown (`mo-dropdown`), tooltip (`title` attribute), toasts
(`mo.toast()`), progress/meter, spinner, skeleton, avatars, upload
(`mo-upload`), sidebar layout, grid utilities.

Typography for document content is opt-in: wrap markup in `.prose`.

## CLI Reference

| Command | Description |
|---------|-------------|
| `mo init [--path <dir>] [--yes] [--force]` | Copy base styles (`00-base.css`, `01-theme.css`, `shared.css`, `animations.css`, `utilities.css`) + `base.js` and create `mo.json` |
| `mo add [components...] [--all] [--yes] [--overwrite] [--dry-run]` | Add components (interactive multi-select if no args). Copies `src/css/*.css` + `src/js/*.js` and regenerates `index.css` / `index.js` |
| `mo list` | List all 46 available components |
| `mo view <name>` | Show component meta (files, description) |

`mo.json` tracks `{ path, installed, moVersion }`. Override path per-call with `--path` / `--cwd`.

Registry: `registry.json` (also published as `@sayagodev/mo/registry.json`) maps component names to `css`/`js` files — similar to shadcn registry.

## Preview

```sh
make preview   # builds dist, serves http://localhost:4173/preview/
```

## Build

Requires esbuild. `make dist` emits:
- `dist/mo.min.css` (21kB gz) / `dist/mo.css`
- `dist/mo.min.js` (20kB gz) / `dist/mo.js`  (IIFE for CDN)
- `dist/mo.esm.min.js` / `dist/mo.esm.js` (ESM for bundlers)
- `dist/css/*` + `dist/js/*` (per-component files)

MIT — original oat by Kailash Nadh; Mo by sayagodev.
