# mo - Build System
# Requires: esbuild

.PHONY: dist css js clean size publish

# The canonical, consumer-facing variables entry point ships as a standalone
# self-contained file (dist/mo.variables.css) so users can paste + edit it.
# It is intentionally NOT part of the bundled mo.css — the theme defaults are
# already served by src/css/01-theme.css inside @layer theme; bundling a second
# :root copy would only duplicate the same values.
CSS_FILES = src/css/00-base.css \
            src/css/01-theme.css \
            src/css/animations.css \
            src/css/shared.css \
			src/css/avatar.css \
            src/css/button.css \
            src/css/form.css \
            src/css/table.css \
            src/css/progress.css \
            src/css/spinner.css \
            src/css/grid.css \
            src/css/card.css \
            src/css/alert.css \
            src/css/badge.css \
            src/css/accordion.css \
            src/css/tabs.css \
            src/css/dialog.css \
            src/css/dropdown.css \
            src/css/toast.css \
            src/css/sidebar.css \
            src/css/taginput.css \
            src/css/prose.css \
            src/css/skeleton.css \
            src/css/tooltip.css \
            src/css/upload.css \
            src/css/separator.css \
            src/css/kbd.css \
            src/css/breadcrumb.css \
            src/css/pagination.css \
            src/css/toggle.css \
            src/css/item.css \
            src/css/button-group.css \
            src/css/input-group.css \
            src/css/toggle-group.css \
            src/css/popover.css \
            src/css/sheet.css \
            src/css/hover-card.css \
            src/css/empty.css \
            src/css/aspect-ratio.css \
            src/css/menubar.css \
            src/css/context-menu.css \
            src/css/carousel.css \
            src/css/navigation-menu.css \
            src/css/command.css \
            src/css/combobox.css \
            src/css/select.css \
            src/css/input-otp.css \
            src/css/scroll-area.css \
            src/css/resizable.css \
            src/css/attachment.css \
            src/css/marker.css \
            src/css/questionnaire.css \
            src/css/slider.css \
            src/css/utilities.css

# Deterministic type generation: Custom Elements Manifest + editor integrations.
# Source of truth = JSDoc tags (@tag/@attr/@prop/@fires) in src/js/*.js
types:
	npx cem analyze

.PHONY: types

dist: css js size
	@mkdir -p dist/css dist/js dist/bin
	@cp src/css/*.css dist/css/
	@cp src/js/*.js dist/js/
	@cp bin/*.js dist/bin/
	@cp src/mo.d.ts dist/mo.d.ts 2>/dev/null || true
	@cp mo.jsx.d.ts dist/mo.jsx.d.ts 2>/dev/null || true
	@cp custom-elements.json dist/custom-elements.json 2>/dev/null || true
	@cp mo.html-data.json dist/mo.html-data.json 2>/dev/null || true
	@cp vscode.css-custom-data.json dist/vscode.css-custom-data.json 2>/dev/null || true
	@cp registry.json dist/registry.json
	@cp package.json dist/package.json
	@cp README.md dist/README.md
	@cp LICENSE dist/LICENSE
	@$(MAKE) devlink --no-print-directory

devlink:
	@ln -sfn src/css css
	@ln -sfn src/js js
	@ln -sf src/mo.d.ts mo.d.ts
	@ln -sf dist/mo.css mo.css 2>/dev/null || true
	@ln -sf dist/mo.variables.css mo.variables.css 2>/dev/null || true
	@ln -sf dist/mo.min.css mo.min.css 2>/dev/null || true
	@ln -sf dist/mo.js mo.js 2>/dev/null || true
	@ln -sf dist/mo.min.js mo.min.js 2>/dev/null || true
	@ln -sf dist/mo.esm.js mo.esm.js 2>/dev/null || true
	@ln -sf dist/mo.esm.min.js mo.esm.min.js 2>/dev/null || true

css:
	@mkdir -p dist
	@cat $(CSS_FILES) > dist/mo.css
	@esbuild dist/mo.css --minify --outfile=dist/mo.min.css
	@gzip -9 -k -f dist/mo.min.css
	@cp src/css/variables.css dist/mo.variables.css
	@echo "CSS: $$(wc -c < dist/mo.min.css | tr -d ' ') bytes (minified)"
	@echo "Variables: $$(wc -c < dist/mo.variables.css | tr -d ' ') bytes (self-contained)"

js:
	@mkdir -p dist
	@esbuild src/js/index.js --bundle --format=iife --outfile=dist/mo.js
	@esbuild src/js/index.js --bundle --format=iife --minify --outfile=dist/mo.min.js
	@esbuild src/js/index.js --bundle --format=esm --outfile=dist/mo.esm.js
	@esbuild src/js/index.js --bundle --format=esm --minify --outfile=dist/mo.esm.min.js
	@gzip -9 -k -f dist/mo.min.js
	@gzip -9 -k -f dist/mo.esm.min.js
	@echo "JS: $$(wc -c < dist/mo.min.js | tr -d ' ') bytes (minified, iife)"
	@echo "JS ESM: $$(wc -c < dist/mo.esm.min.js | tr -d ' ') bytes (minified, esm)"

clean:
	@rm -rf dist

size:
	@echo ""
	@echo "Bundle:"
	@echo "CSS (src):   $$(wc -c < dist/mo.css | tr -d ' ') bytes"
	@echo "CSS (min):   $$(wc -c < dist/mo.min.css | tr -d ' ') bytes"
	@echo "CSS (gzip):  $$(wc -c < dist/mo.min.css.gz | tr -d ' ') bytes"
	@echo ""
	@echo "JS (src):    $$(wc -c < dist/mo.js | tr -d ' ') bytes"
	@echo "JS (min):    $$(wc -c < dist/mo.min.js | tr -d ' ') bytes"
	@echo "JS (gzip):   $$(wc -c < dist/mo.min.js.gz | tr -d ' ') bytes"
	@echo "JS ESM (min):  $$(wc -c < dist/mo.esm.min.js | tr -d ' ') bytes"
	@echo "JS ESM (gzip): $$(wc -c < dist/mo.esm.min.js.gz | tr -d ' ') bytes"

publish: clean dist
	@cp src/mo.d.ts dist/mo.d.ts
	@cp mo.jsx.d.ts dist/mo.jsx.d.ts 2>/dev/null || true
	@cp custom-elements.json dist/custom-elements.json 2>/dev/null || true
	@cp mo.html-data.json dist/mo.html-data.json 2>/dev/null || true
	@cp vscode.css-custom-data.json dist/vscode.css-custom-data.json 2>/dev/null || true
	@cp registry.json dist/registry.json
	@cp README.md dist/README.md
	@cp LICENSE dist/LICENSE
	@cd dist && npm publish --access public

test: dist
	pnpm --dir tests test
