# Editor autocomplete for Mo components

Types and editor data are GENERATED from JSDoc in `src/js/*.js` via the
Custom Elements Manifest pipeline — run `make types` after changing any
component API. Three artifacts ship with the package:

- `custom-elements.json` — the standard Custom Elements Manifest.
- `mo.html-data.json` — GENERATED: the 16 `<mo-*>` tags with attributes,
  descriptions and events (from JSDoc).
- `mo.globals.html-data.json` — static: ~118 global `data-*` attributes
  (attribute-driven components).
- `mo.vscode.css-data.json` — theme CSS variables for CSS completion.
- `src/mo.d.ts` — full TypeScript types: element classes, properties,
  methods and typed event details. Works with no setup in any TS project.

## VS Code

Point the HTML language service at the custom data file, then reload the
window:

```jsonc
// .vscode/settings.json
{
  "html.customData": [
    "./mo.html-data.json",
    "./mo.globals.html-data.json"
  ]
}
```

Paths resolve against the workspace root. After installing from npm use
`"node_modules/@sayagodev/mo/mo.html-data.json"` (and the globals file).

## Neovim (vscode-html-language-server via lspconfig or mason)

The standalone server does NOT read files itself: it asks the client with
the LSP request `html/customDataContent` and expects the file content back.
Two things are required and both are easy to miss:

1. The paths go in `init_options.dataPaths` (NOT in `settings`).
2. The client must implement the `html/customDataContent` handler. The
   params arrive as a positional array and the first request has id 0.

```lua
-- nvim-lspconfig classic
require('lspconfig').html.setup({
  init_options = {
    dataPaths = {
      vim.fn.getcwd() .. '/mo.html-data.json',
      vim.fn.getcwd() .. '/mo.globals.html-data.json',
    },
    provideFormatter = true,
  },
  handlers = {
    ['html/customDataContent'] = function(_, path)
      if type(path) == 'table' then path = path[1] end
      return table.concat(vim.fn.readfile(path), '\n')
    end,
  },
})
```

Neovim 0.11+ native API:

```lua
vim.lsp.config('html', {
  init_options = {
    dataPaths = {
      vim.fn.getcwd() .. '/mo.html-data.json',
      vim.fn.getcwd() .. '/mo.globals.html-data.json',
    },
  },
  handlers = {
    ['html/customDataContent'] = function(_, path)
      if type(path) == 'table' then path = path[1] end
      return table.concat(vim.fn.readfile(path), '\n')
    end,
  },
})
vim.lsp.enable('html')
```

Verified end to end (LSP stdio test against
`vscode-html-language-server` 4.10.0): 16 tag completions and 127
attribute completions, hover descriptions included.

## TypeScript / JSX

Nothing to configure. The package's `mo.d.ts` types every element, its
attributes, methods and event details:

```ts
document.querySelector('mo-tabs') // MoTabsElement
  ?.addEventListener('mo-tab-change', (e) => e.detail.index);

window.mo?.toast.promise(save(), { loading: 'Saving…', success: (d) => `Saved ${d.id}` });
```
