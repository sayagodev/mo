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
<mo-tabs>…</mo-tabs>           <!-- behavior via native custom elements -->
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

Package is `type: module` with `exports` (`./css/*`, `./js/*`) and `sideEffects: ["*.css"]` so bundlers keep CSS and tree-shake unused JS. Full bundle is 22kB gz CSS / 21kB gz JS; a 5-component setup is <8kB gz.

## Bundle size vs shadcn/ui

The whole library — 52 components plus the base theme — weighs **≈ 43 kB
gzip** on the wire (22 kB CSS + 21 kB JS). Types (`mo.d.ts`, 47 kB raw) are
dev-time only and never reach the browser.

Since Mo reimplements shadcn/ui on the web platform, most components need no
framework code at all. Measured per component (minified + `gzip -9`, React
treated as external on both sides, Mo numbers include shared CSS/JS deps):

| Component | Mo (gz) | shadcn (gz)¹ | Ratio |
|---|---|---|---|
| popover | 0.4 kB | 25.5 kB | 59× |
| tooltip | 0.9 kB | 20.3 kB | 22× |
| hover-card | 1.4 kB | 18.6 kB | 14× |
| separator | 0.2 kB | 2.3 kB | 12× |
| dropdown-menu | 3.5 kB | 33.3 kB | 9.4× |
| toggle-group | 1.0 kB | 9.2 kB | 9.2× |
| progress | 0.3 kB | 3.4 kB | 9.6× |
| aspect-ratio | 0.2 kB | 2.3 kB | 9.6× |
| scroll-area | 0.9 kB | 8.0 kB | 9× |
| alert-dialog | 1.7 kB | 15.2 kB | 8.9× |
| toggle | 0.4 kB | 3.6 kB | 8.5× |
| dialog | 1.7 kB | 14.7 kB | 8.7× |
| menubar | 4.2 kB | 33.9 kB | 8.1× |
| select | 4.5 kB | 33.0 kB | 7.3× |
| navigation-menu | 1.9 kB | 13.7 kB | 7.3× |
| context-menu | 4.8 kB | 33.6 kB | 7× |
| tabs | 1.8 kB | 9.9 kB | 5.5× |
| avatar | 0.7 kB | 3.7 kB | 5.1× |
| toast | 2.6 kB | 12.9 kB | 4.9× |
| command | 4.0 kB | 18.7 kB | 4.6× |
| slider | 2.7 kB | 10.4 kB | 3.9× |
| carousel | 2.2 kB | 8.4 kB | 3.8× |
| form (checkbox + radio + switch) | 8.1 kB | 23.2 kB | 2.9× |
| accordion | 3.7 kB | 9.5 kB | 2.6× |
| input-otp | 2.2 kB | 4.5 kB | 2.1× |
| collapsible | 2.9 kB | 5.8 kB | 2× |
| button | 2.9 kB | — (no Radix dep) | — |
| label | 0 kB (native) | 2.2 kB | — |

¹ What the shadcn column counts — and deliberately doesn't:

- **React is not counted.** A shadcn app ships React + ReactDOM (~69 kB gzip,
  measured) before any component renders. Mo needs none of it — and the whole
  Mo library still weighs less than that runtime alone.
- **Tailwind CSS is not counted.** Each shadcn component's utility classes add
  roughly 0.5–2 kB (amortized) to the app's CSS build, on top of the JS above.
- **The copied `.tsx` source is not counted** (~1–2 kB min per component).
- Radix numbers are the real-app, deduped cost: the 26 packages the shadcn
  component set depends on, bundled together, are 88 kB gz of JS alone — more
  than twice Mo's entire CSS+JS budget. (Summing packages individually gives
  342 kB; the deduped figure is the honest one.)
- Both sides measured with the same toolchain: esbuild `--minify` + `gzip -9`.

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
`<html data-theme="dark">`.

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
| `mo list` | List all 52 available components |
| `mo view <name>` | Show component meta (files, description) |

`mo.json` tracks `{ path, installed, moVersion }`. Override path per-call with `--path` / `--cwd`.

Registry: `registry.json` (also published as `@sayagodev/mo/registry.json`) maps component names to `css`/`js` files — similar to shadcn registry.

## Build

Requires esbuild. `make dist` emits:
- `dist/mo.min.css` (21kB gz) / `dist/mo.css`
- `dist/mo.min.js` (20kB gz) / `dist/mo.js`  (IIFE for CDN)
- `dist/mo.esm.min.js` / `dist/mo.esm.js` (ESM for bundlers)
- `dist/css/*` + `dist/js/*` (per-component files)

## License

MIT — original [oat](https://oat.ink) by Kailash Nadh; Mo fork by
[sayagodev](https://sayago.dev). Design tokens inspired by shadcn/ui's
neutral palette. See [LICENSE](./LICENSE).
