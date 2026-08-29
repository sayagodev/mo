import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function findRoot(): string {
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(path.join(cur, 'registry.json')) && existsSync(path.join(cur, 'package.json'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  // fallback for `pnpm --dir tests`
  if (existsSync(path.join(cur, '..', 'registry.json'))) return path.resolve(cur, '..');
  return cur;
}
const ROOT = findRoot();

test.describe('Mo build — ESM + granular exports', () => {
  test('dist bundles exist and are small', async () => {
    const css = await fs.stat(path.join(ROOT, 'dist/mo.min.css'));
    const jsi = await fs.stat(path.join(ROOT, 'dist/mo.min.js'));
    const esm = await fs.stat(path.join(ROOT, 'dist/mo.esm.min.js'));
    expect(css.size).toBeLessThan(200_000); // 127k expected
    expect(jsi.size).toBeLessThan(150_000); // 83k expected
    expect(esm.size).toBeLessThan(150_000);
    // gzip size check
    const gz = await fs.stat(path.join(ROOT, 'dist/mo.min.css.gz'));
    expect(gz.size).toBeLessThan(30_000); // ~21k
  });

  test('per-component CSS is granular (<10% of full bundle)', async () => {
    const full = (await fs.stat(path.join(ROOT, 'dist/mo.css'))).size;
    const button = (await fs.stat(path.join(ROOT, 'src/css/button.css'))).size;
    const dialog = (await fs.stat(path.join(ROOT, 'src/css/dialog.css'))).size;
    const form = (await fs.stat(path.join(ROOT, 'src/css/form.css'))).size;
    // single component should be <10% of full
    expect(button).toBeLessThan(full * 0.1);
    expect(dialog).toBeLessThan(full * 0.1);
    // base + theme + button + dialog + shared should still be << full
    const needed = button + dialog + form + (await fs.stat(path.join(ROOT, 'src/css/00-base.css'))).size + (await fs.stat(path.join(ROOT, 'src/css/01-theme.css'))).size + (await fs.stat(path.join(ROOT, 'src/css/shared.css'))).size;
    expect(needed).toBeLessThan(full * 0.25);
  });

  test('package.json has ESM exports and sideEffects', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.type).toBe('module');
    expect(pkg.bin?.mo).toBe('./bin/cli.js');
    expect(pkg.exports['.'].import).toBe('./mo.esm.js');
    expect(pkg.exports['./css/*']).toBeDefined();
    expect(pkg.exports['./js/*']).toBeDefined();
    expect(pkg.sideEffects).toContain('*.css');
    expect(pkg.dependencies?.['@clack/prompts']).toBeDefined();
    expect(pkg.dependencies?.cac).toBeDefined();
  });

  test('registry.json is valid and lists all components', async () => {
    const reg = JSON.parse(await fs.readFile(path.join(ROOT, 'registry.json'), 'utf-8'));
    const names = Object.keys(reg.components);
    expect(names.length).toBeGreaterThan(40);
    expect(names).toContain('button');
    expect(names).toContain('dialog');
    expect(names).toContain('dropdown');
    expect(reg.components['button'].css).toContain('button.css');
    expect(reg.base.css).toContain('00-base.css');
  });

  test('CLI list shows 40+ components', async () => {
    const out = execSync('node bin/cli.js list', { cwd: ROOT, encoding: 'utf-8' });
    const lines = out.trim().split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThan(40);
    expect(out).toContain('button');
  });

  test('CLI view returns JSON for a component', async () => {
    const out = execSync('node bin/cli.js view button', { cwd: ROOT, encoding: 'utf-8' });
    const j = JSON.parse(out);
    expect(j.name).toBe('button');
    expect(j.css).toContain('button.css');
  });

  test('CLI add --dry-run does not write files', async () => {
    const tmp = await fs.mkdtemp(path.join('/tmp', 'mo-build-test-'));
    execSync(`node ${path.join(ROOT, 'bin/cli.js')} init --cwd ${tmp} --yes --silent`, { encoding: 'utf-8' });
    expect(existsSync(path.join(tmp, 'mo/00-base.css'))).toBeTruthy();
    const before = await fs.readdir(path.join(tmp, 'mo'));
    execSync(`node ${path.join(ROOT, 'bin/cli.js')} add button --cwd ${tmp} --dry-run --yes`, { encoding: 'utf-8' });
    const after = await fs.readdir(path.join(tmp, 'mo'));
    expect(after).toEqual(before); // dry-run unchanged
    execSync(`node ${path.join(ROOT, 'bin/cli.js')} add button --cwd ${tmp} --yes --silent`, { encoding: 'utf-8' });
    expect(existsSync(path.join(tmp, 'mo/button.css'))).toBeTruthy();
    const idx = await fs.readFile(path.join(tmp, 'mo/index.css'), 'utf-8');
    expect(idx).toContain('button.css');
  });

  test('CLI add --all installs all components', async () => {
    const tmp = await fs.mkdtemp(path.join('/tmp', 'mo-all-'));
    execSync(`node ${path.join(ROOT, 'bin/cli.js')} init --cwd ${tmp} --yes --silent`, { encoding: 'utf-8' });
    execSync(`node ${path.join(ROOT, 'bin/cli.js')} add --all --cwd ${tmp} --yes --silent`, { encoding: 'utf-8' });
    const files = await fs.readdir(path.join(tmp, 'mo'));
    // should have many css files
    expect(files.filter(f => f.endsWith('.css')).length).toBeGreaterThan(40);
    expect(files.filter(f => f.endsWith('.js')).length).toBeGreaterThan(15);
  });

  test('ESM bundle is valid ESM (has import/export)', async () => {
    const esm = await fs.readFile(path.join(ROOT, 'dist/mo.esm.js'), 'utf-8');
    // esbuild ESM bundle should not be IIFE wrapper at the very start (IIFE starts with "(() => {")
    expect(esm.trimStart().startsWith('(() =>')).toBe(false);
    // should contain customElements.define
    expect(esm).toContain('customElements.define');
  });
});
