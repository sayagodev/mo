#!/usr/bin/env node
import { cac } from 'cac';
import * as p from '@clack/prompts';
import c from 'picocolors';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(PKG_ROOT, 'registry.json');
const PKG_JSON_PATH = path.join(PKG_ROOT, 'package.json');
// dist/ ships flat css/ + js/ (no src/); fall back to src/ for repo checkouts.
const CSS_SRC_DIR = existsSync(path.join(PKG_ROOT, 'css')) ? 'css' : path.join('src', 'css');
const JS_SRC_DIR = existsSync(path.join(PKG_ROOT, 'js')) ? 'js' : path.join('src', 'js');
const DTS_SRC = existsSync(path.join(PKG_ROOT, 'mo.d.ts'))
  ? path.join(PKG_ROOT, 'mo.d.ts')
  : path.join(PKG_ROOT, 'src', 'mo.d.ts');
const BUNDLE_FILES = ['mo.min.css', 'mo.min.js'];

async function loadRegistry() {
  const raw = await fs.readFile(REGISTRY_PATH, 'utf-8');
  return JSON.parse(raw);
}
async function loadPkg() {
  const raw = await fs.readFile(PKG_JSON_PATH, 'utf-8');
  return JSON.parse(raw);
}

function resolveTarget(cwd, cliPath, configPath) {
  if (cliPath) return path.resolve(cwd, cliPath);
  if (configPath) return path.resolve(cwd, configPath);
  if (existsSync(path.join(cwd, 'src'))) return path.resolve(cwd, 'src/lib/mo');
  return path.resolve(cwd, 'mo');
}

async function readConfig(cwd) {
  const candidates = ['mo.json', 'components.json'];
  for (const name of candidates) {
    try {
      const raw = await fs.readFile(path.join(cwd, name), 'utf-8');
      return { config: JSON.parse(raw), file: name };
    } catch {}
  }
  return { config: null, file: 'mo.json' };
}

async function writeConfig(cwd, config, file = 'mo.json') {
  const pth = path.join(cwd, file);
  await fs.writeFile(pth, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return pth;
}

async function copyFiles(files, getSrcDir, destDir, { overwrite = false, dryRun = false } = {}) {
  const copied = [];
  const skipped = [];
  for (const f of files) {
    const src = path.join(getSrcDir(f), f);
    const dest = path.join(destDir, subdir(f));
    try {
      await fs.access(src);
    } catch {
      // file missing in src, skip
      continue;
    }
    let exists = false;
    try { await fs.access(dest); exists = true; } catch {}
    if (exists && !overwrite) { skipped.push(f); continue; }
    if (!dryRun) {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
    copied.push(f);
  }
  return { copied, skipped };
}

async function copyTypes(destDir, { overwrite = false, dryRun = false } = {}) {
  try {
    await fs.access(DTS_SRC);
  } catch {
    return { copied: [], skipped: [] };
  }
  const dest = path.join(destDir, 'mo.d.ts');
  let exists = false;
  try { await fs.access(dest); exists = true; } catch {}
  if (exists && !overwrite) return { copied: [], skipped: ['mo.d.ts'] };
  if (!dryRun) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(DTS_SRC, dest);
  }
  return { copied: ['mo.d.ts'], skipped: [] };
}

async function copyBundle(destDir, { overwrite = false, dryRun = false } = {}) {
  const copied = [];
  const skipped = [];
  for (const f of BUNDLE_FILES) {
    const candidates = [path.join(PKG_ROOT, f), path.join(PKG_ROOT, 'dist', f)];
    let found = null;
    for (const cand of candidates) {
      try { await fs.access(cand); found = cand; break; } catch {}
    }
    if (!found) continue;
    const dest = path.join(destDir, f);
    let exists = false;
    try { await fs.access(dest); exists = true; } catch {}
    if (exists && !overwrite) { skipped.push(f); continue; }
    if (!dryRun) {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(found, dest);
    }
    copied.push(f);
  }
  return { copied, skipped };
}

function dedupe(arr) { return [...new Set(arr)]; }

// Installed layout: <target>/css/*.css + <target>/js/*.js + index files.
// Component JS files import siblings as './base.js'; installed under js/ the
// same relative import still resolves (js/base.js), so no rewriting is needed.
const subdir = (f) => (f.endsWith('.js') ? `js/${f}` : `css/${f}`);

async function ensureIndexCss(destDir, installedCss, dryRun) {
  // Generate css/index.css that @imports in correct order: base -> theme -> animations -> shared -> utilities -> components
  const order = ['00-base.css', '01-theme.css', 'animations.css', 'shared.css', 'utilities.css'];
  const baseOrdered = order.filter(f => installedCss.includes(f));
  const rest = installedCss.filter(f => !order.includes(f)).sort();
  const final = [...baseOrdered, ...rest];
  const content = final.map(f => `@import "./${f}";`).join('\n') + '\n';
  const dest = path.join(destDir, 'css', 'index.css');
  if (!dryRun) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, content, 'utf-8');
  }
  return { path: dest, content, files: final };
}

async function ensureIndexJs(destDir, installedJs, dryRun) {
  const content = installedJs.map(f => `import "./${f}";`).join('\n') + (installedJs.length ? '\n' : '');
  const dest = path.join(destDir, 'js', 'index.js');
  if (!dryRun) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, content, 'utf-8');
  }
  return { path: dest, content, files: installedJs };
}

async function ensureRootIndex(destDir, dryRun) {
  // Root keeps BOTH entries: index.css re-exports css/index.css, index.js
  // re-exports js/index.js. Plain <link>/<script> pages and bundlers both
  // work; no CSS-in-JS import that 404s under plain ESM.
  const css = `@import "./css/index.css";\n`;
  const js = `import "./js/index.js";\n`;
  if (!dryRun) {
    await fs.writeFile(path.join(destDir, 'index.css'), css, 'utf-8');
    await fs.writeFile(path.join(destDir, 'index.js'), js, 'utf-8');
  }
  return [path.join(destDir, 'index.css'), path.join(destDir, 'index.js')];
}

async function scanInstalled(destDir) {
  let installedCss = [];
  let installedJs = [];
  try {
    const cssFiles = await fs.readdir(path.join(destDir, 'css'));
    installedCss = cssFiles.filter(f => f.endsWith('.css') && f !== 'index.css').sort();
  } catch {}
  try {
    const jsFiles = await fs.readdir(path.join(destDir, 'js'));
    installedJs = jsFiles.filter(f => f.endsWith('.js') && f !== 'index.js').sort();
  } catch {}
  return { installedCss, installedJs };
}

function importHint(relTarget) {
  return [
    `Import in your app:`,
    c.dim(`  import "${relTarget}/index.css";`),
    c.dim(`  import "${relTarget}/index.js";`),
    c.dim(`  // or per-file: import "${relTarget}/css/button.css";`),
    c.dim(`  //              import "${relTarget}/js/dropdown.js";`),
    c.dim(`  /// <reference path="${relTarget}/mo.d.ts" />  // custom-element + window.mo types`),
  ].join('\n');
}

// Migrate a pre-subdir flat install (<target>/*.css next to *.js) into
// css/ + js/. Moves files, drops old root indexes, regenerates all indexes.
async function migrateFlat(targetPath, dryRun) {
  let rootFiles = [];
  try {
    rootFiles = await fs.readdir(targetPath);
  } catch {
    return false;
  }
  const flatCss = rootFiles.filter(f => f.endsWith('.css') && f !== 'index.css' && f !== 'mo.min.css');
  const flatJs = rootFiles.filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'mo.min.js');
  if (!flatCss.length && !flatJs.length) return false;
  if (!dryRun) {
    await fs.mkdir(path.join(targetPath, 'css'), { recursive: true });
    await fs.mkdir(path.join(targetPath, 'js'), { recursive: true });
    for (const f of flatCss) {
      try { await fs.rename(path.join(targetPath, f), path.join(targetPath, 'css', f)); } catch {}
    }
    for (const f of flatJs) {
      try { await fs.rename(path.join(targetPath, f), path.join(targetPath, 'js', f)); } catch {}
    }
    try { await fs.rm(path.join(targetPath, 'index.css')); } catch {}
    try { await fs.rm(path.join(targetPath, 'index.js')); } catch {}
  }
  return true;
}

const cli = cac('mo');

cli.command('init', 'Initialize Mo in your project').option('-y, --yes', 'Skip confirmation prompt').option('-f, --force', 'Overwrite existing').option('-c, --cwd <cwd>', 'Working directory').option('-p, --path <path>', 'Install path').option('-s, --silent', 'Mute output').option('--bundle', 'Install only the prebuilt bundle (mo.min.css + mo.min.js) instead of sources').action(async (opts) => {
  const cwd = path.resolve(opts.cwd || process.cwd());
  const pkg = await loadPkg();
  const registry = await loadRegistry();
  const { config: existingConfig } = await readConfig(cwd);

  if (!opts.silent) {
    p.intro(c.bgCyan(c.black(` mo ${pkg.version} — init `)));
  }

  let targetPath = opts.path || existingConfig?.path || null;
  if (!opts.yes && !opts.path) {
    const detected = resolveTarget(cwd, null, existingConfig?.path);
    const rel = path.relative(cwd, detected) || '.';
    const ans = await p.text({
      message: 'Where should we install components?',
      placeholder: rel,
      initialValue: rel,
    });
    if (p.isCancel(ans)) { p.cancel('Cancelled'); process.exit(0); }
    targetPath = ans?.trim() ? path.resolve(cwd, ans.trim()) : detected;
  } else {
    targetPath = resolveTarget(cwd, opts.path, existingConfig?.path);
  }

  const relTarget = path.relative(cwd, targetPath) || '.';
  const configFile = existingConfig ? (await readConfig(cwd)).file : 'mo.json';

  if (!opts.silent) p.log.step(`Installing base styles to ${c.cyan(relTarget)}`);

  const baseCss = registry.base.css;
  const baseJs = registry.base.js;

  let overwrite = !!opts.force;
  if (!opts.yes && !opts.force) {
    try { await fs.access(targetPath); const hasFiles = (await fs.readdir(targetPath)).length > 0; if (hasFiles) { const ans = await p.confirm({ message: `Directory ${relTarget} not empty. Overwrite base files?` }); if (p.isCancel(ans)) { p.cancel('Cancelled'); process.exit(0); } overwrite = !!ans; } } catch {}
  }

  const srcCssDir = path.join(PKG_ROOT, CSS_SRC_DIR);
  const srcJsDir = path.join(PKG_ROOT, JS_SRC_DIR);
  const srcDirFor = (f) => (f.endsWith('.js') ? srcJsDir : srcCssDir);

  const migrated = await migrateFlat(targetPath, false);

  if (opts.bundle) {
    const { copied, skipped } = await copyBundle(targetPath, { overwrite, dryRun: false });
    const { copied: typesCopied } = await copyTypes(targetPath, { overwrite, dryRun: false });
    const newConfig = {
      ...(existingConfig || {}),
      path: relTarget,
      mode: 'bundle',
      installed: dedupe([...(existingConfig?.installed || []), 'bundle']),
    };
    newConfig.moVersion = pkg.version;
    await writeConfig(cwd, newConfig, configFile);
    if (!opts.silent) {
      p.log.success(`Bundle installed: ${copied.join(', ') || '(none — run make dist first)'}${skipped.length ? ` (skipped ${skipped.join(', ')})` : ''}${typesCopied.length ? ' + mo.d.ts' : ''}`);
      p.log.message([
        `Config: ${c.cyan(configFile)}`,
        `Link in your HTML:`,
        c.dim(`  <link rel="stylesheet" href="${relTarget}/mo.min.css" />`),
        c.dim(`  <script src="${relTarget}/mo.min.js"></script>`),
      ].join('\n'));
      p.outro(c.green('Done!'));
    }
    return;
  }

  const { copied: cssCopied, skipped: cssSkipped } = await copyFiles(baseCss, srcDirFor, targetPath, { overwrite, dryRun: false });
  const { copied: jsCopied } = await copyFiles(baseJs, srcDirFor, targetPath, { overwrite, dryRun: false });
  const { copied: typesCopied, skipped: typesSkipped } = await copyTypes(targetPath, { overwrite, dryRun: false });

  // Rebuild indexes from everything on disk so re-init heals a partial install.
  const { installedCss, installedJs } = await scanInstalled(targetPath);
  await ensureIndexCss(targetPath, installedCss.length ? installedCss : baseCss, false);
  await ensureIndexJs(targetPath, installedJs, false);
  await ensureRootIndex(targetPath, false);

  const newConfig = {
    ...(existingConfig || {}),
    path: relTarget,
    mode: 'source',
    installed: dedupe([...(existingConfig?.installed || []), ...baseCss.map(f => f.replace('.css','')), ...baseJs.map(f => f.replace('.js',''))]),
  };
  // keep version
  newConfig.moVersion = pkg.version;
  await writeConfig(cwd, newConfig, configFile);

  if (!opts.silent) {
    p.log.success(`Base installed: css/{${cssCopied.join(', ')}}${cssSkipped.length ? ` (skipped ${cssSkipped.join(', ')})` : ''}${jsCopied.length ? ` + js/{${jsCopied.join(', ')}}` : ''}${typesCopied.length ? ' + mo.d.ts' : typesSkipped.length ? ' (mo.d.ts exists)' : ''}${migrated ? ' — migrated flat layout to css/ + js/' : ''}`);
    p.log.message([
      `Config: ${c.cyan(path.join(path.relative(cwd, cwd) || '.', configFile))}`,
      importHint(relTarget),
      `Next: ${c.cyan('mo add')} to pick components`,
    ].join('\n'));
    p.outro(c.green('Done!'));
  }
});

cli.command('add [...components]', 'Add components to your project').option('-y, --yes', 'Skip confirmation prompt').option('-o, --overwrite', 'Overwrite existing files').option('-c, --cwd <cwd>', 'Working directory').option('-p, --path <path>', 'Custom install path').option('-a, --all', 'Add all components').option('-s, --silent', 'Mute output').option('--bundle', 'Install only the prebuilt bundle (mo.min.css + mo.min.js) instead of sources').option('--dry-run', 'Preview without writing').action(async (components, opts) => {
  const cwd = path.resolve(opts.cwd || process.cwd());
  const pkg = await loadPkg();
  const registry = await loadRegistry();
  const allNames = Object.keys(registry.components).sort();

  if (!opts.silent) p.intro(c.bgCyan(c.black(` mo ${pkg.version} — add `)));

  const { config } = await readConfig(cwd);
  let targetPath = resolveTarget(cwd, opts.path, config?.path);
  const relTarget = path.relative(cwd, targetPath) || '.';

  const srcCssDir = path.join(PKG_ROOT, CSS_SRC_DIR);
  const srcJsDir = path.join(PKG_ROOT, JS_SRC_DIR);
  const srcDirFor = (f) => (f.endsWith('.js') ? srcJsDir : srcCssDir);

  if (opts.bundle) {
    if (!opts.dryRun) await fs.mkdir(targetPath, { recursive: true });
    const { copied, skipped } = await copyBundle(targetPath, { overwrite: !!opts.overwrite, dryRun: !!opts.dryRun });
    const { copied: typesCopied } = await copyTypes(targetPath, { overwrite: !!opts.overwrite, dryRun: !!opts.dryRun });
    if (!opts.dryRun) {
      const { config: cur, file } = await readConfig(cwd);
      const newConfig = { ...(cur || {}), path: path.relative(cwd, targetPath) || '.', mode: 'bundle', installed: dedupe([...(cur?.installed || []), 'bundle']), moVersion: pkg.version };
      await writeConfig(cwd, newConfig, file);
    }
    if (!opts.silent) {
      if (opts.dryRun) {
        p.log.message(`Would copy bundle: ${copied.join(', ') || '(none — run make dist first)'}${skipped.length ? ` (skipped ${skipped.join(', ')})` : ''}${typesCopied.length ? ' + mo.d.ts' : ''}`);
      } else {
        p.log.success(`Bundle: ${copied.join(', ') || '(none — run make dist first)'}${skipped.length ? c.dim(` (skipped ${skipped.join(', ')})`) : ''}${typesCopied.length ? ' + mo.d.ts' : ''}`);
        p.log.message([
          `Link in your HTML:`,
          c.dim(`  <link rel="stylesheet" href="${relTarget}/mo.min.css" />`),
          c.dim(`  <script src="${relTarget}/mo.min.js"></script>`),
        ].join('\n'));
      }
      p.outro(c.green(opts.dryRun ? 'Dry run done.' : 'Done!'));
    }
    return;
  }

  // Ensure target exists or prompt init?
  try { await fs.access(targetPath); } catch {
    if (!opts.yes && !opts.dryRun) {
      const ans = await p.confirm({ message: `Target ${c.cyan(relTarget)} does not exist. Create it and install base?` });
      if (p.isCancel(ans)) { p.cancel('Cancelled'); process.exit(0); }
      if (ans) {
        await fs.mkdir(targetPath, { recursive: true });
        await copyFiles(registry.base.css, srcDirFor, targetPath, { overwrite: !!opts.overwrite });
        await copyFiles(registry.base.js, srcDirFor, targetPath, { overwrite: !!opts.overwrite });
        await copyTypes(targetPath, { overwrite: !!opts.overwrite });
      }
    } else if (!opts.dryRun) {
      await fs.mkdir(targetPath, { recursive: true });
      await copyFiles(registry.base.css, srcDirFor, targetPath, { overwrite: !!opts.overwrite });
      await copyFiles(registry.base.js, srcDirFor, targetPath, { overwrite: !!opts.overwrite });
      await copyTypes(targetPath, { overwrite: !!opts.overwrite });
    }
  }

  const migrated = await migrateFlat(targetPath, !!opts.dryRun);

  let selected = Array.isArray(components) ? components : components ? [components] : [];
  if (opts.all) selected = allNames;
  else if (selected.length === 0 && !opts.yes) {
    const options = allNames.map(name => {
      const meta = registry.components[name];
      return { value: name, label: name, hint: meta.description };
    });
    const ans = await p.multiselect({
      message: 'Select components to add (space to select, enter to confirm)',
      options,
      required: false,
    });
    if (p.isCancel(ans)) { p.cancel('Cancelled'); process.exit(0); }
    selected = ans || [];
  } else if (selected.length === 0 && opts.yes) {
    // --yes without args => no-op? show help
    if (!opts.silent) p.log.warn('No components specified. Use mo add <name> or run without --yes for interactive picker.');
    return;
  }

  // Validate names
  const invalid = selected.filter(n => !allNames.includes(n));
  if (invalid.length) {
    p.log.error(`Unknown components: ${invalid.join(', ')}`);
    p.log.message(`Available: ${allNames.join(', ')}`);
    process.exit(1);
  }
  if (selected.length === 0) {
    p.log.warn('No components selected.');
    return;
  }

  // But for add we only copy selected + deps, not whole base again unless missing
  const cssToCopy = [];
  const jsToCopy = [];
  for (const name of selected) {
    const meta = registry.components[name];
    cssToCopy.push(...(meta.css || []));
    jsToCopy.push(...(meta.js || []));
    if (meta.deps) cssToCopy.push(...meta.deps);
  }
  // dedupe
  const finalCss = dedupe(cssToCopy);
  const finalJs = dedupe(jsToCopy);

  if (!opts.silent) p.log.step(`Installing ${c.cyan(selected.join(', '))} → ${c.dim(relTarget)}${opts.dryRun ? c.yellow(' (dry-run)') : ''}`);

  const { copied: cssCopied, skipped: cssSkipped } = await copyFiles(finalCss, srcDirFor, targetPath, { overwrite: !!opts.overwrite, dryRun: !!opts.dryRun });
  const { copied: jsCopied, skipped: jsSkipped } = await copyFiles(finalJs, srcDirFor, targetPath, { overwrite: !!opts.overwrite, dryRun: !!opts.dryRun });

  // Rebuild index files to include everything currently installed.
  if (!opts.dryRun) {
    const { installedCss, installedJs } = await scanInstalled(targetPath);
    await ensureIndexCss(targetPath, installedCss, false);
    await ensureIndexJs(targetPath, installedJs, false);
    await ensureRootIndex(targetPath, false);
    await copyTypes(targetPath, { overwrite: false, dryRun: false });
  }

  // Update config
  if (!opts.dryRun) {
    const { config: cur, file } = await readConfig(cwd);
    const newInstalled = dedupe([...(cur?.installed || []), ...selected]);
    const newConfig = { ...(cur || {}), path: path.relative(cwd, targetPath) || '.', mode: 'source', installed: newInstalled, moVersion: pkg.version };
    await writeConfig(cwd, newConfig, file);
  }

  if (!opts.silent) {
    if (opts.dryRun) {
      p.log.message([
        `Would copy CSS: ${cssCopied.map(f => `css/${f}`).join(', ') || '(none)'}${cssSkipped.length ? ` (skipped ${cssSkipped.join(', ')})` : ''}`,
        `Would copy JS: ${jsCopied.map(f => `js/${f}`).join(', ') || '(none)'}${jsSkipped.length ? ` (skipped ${jsSkipped.join(', ')})` : ''}`,
      ].join('\n'));
    } else {
      if (cssCopied.length) p.log.success(`CSS: ${cssCopied.map(f => `css/${f}`).join(', ')}${cssSkipped.length ? c.dim(` (skipped ${cssSkipped.join(', ')})`) : ''}`);
      if (jsCopied.length) p.log.success(`JS: ${jsCopied.map(f => `js/${f}`).join(', ')}${jsSkipped.length ? c.dim(` (skipped ${jsSkipped.join(', ')})`) : ''}`);
      if (!cssCopied.length && !jsCopied.length) p.log.warn('Nothing copied (files exist, use --overwrite to replace).');
      if (migrated) p.log.message('Migrated flat layout to css/ + js/.');
      p.log.message(importHint(relTarget));
    }
    p.outro(c.green(opts.dryRun ? 'Dry run done.' : 'Done!'));
  }
});

cli.command('view [component]', 'View component info').option('-c, --cwd <cwd>', 'Working directory').action(async (component) => {
  const registry = await loadRegistry();
  if (!component) {
    console.log(Object.keys(registry.components).sort().join('\n'));
    return;
  }
  const meta = registry.components[component];
  if (!meta) { console.error(`Unknown component: ${component}`); process.exit(1); }
  console.log(JSON.stringify({ name: component, ...meta }, null, 2));
});

cli.command('list', 'List available components').action(async () => {
  const registry = await loadRegistry();
  const names = Object.keys(registry.components).sort();
  for (const n of names) {
    const m = registry.components[n];
    console.log(`${n.padEnd(18)} ${m.description}  [css: ${(m.css||[]).join(', ')}${m.js?.length ? ` | js: ${m.js.join(', ')}` : ''}]`);
  }
});

cli.help();
cli.version((await loadPkg()).version);

try { cli.parse(); } catch (e) { console.error(e); process.exit(1); }
