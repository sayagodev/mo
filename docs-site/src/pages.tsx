import { useEffect, useState } from 'react'
import type { ComponentDoc } from './registry'
import { ExampleCard } from './ExampleCard'
import { registry } from './registry'

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav className="d-breadcrumb" aria-label="Breadcrumb">
      <a href="#/">Docs</a>
      <span aria-hidden="true">/</span>
      <span>Components</span>
      <span aria-hidden="true">/</span>
      <span style={{ color: 'var(--foreground)' }}>{name}</span>
    </nav>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="example-code" style={{ borderRadius: 'var(--radius-large)', border: '1px solid var(--border)', maxHeight: 'none' }}>
      <code>{code}</code>
    </pre>
  );
}

function Pager({ slug }: { slug: string }) {
  const i = registry.findIndex((c) => c.slug === slug);
  const prev = i > 0 ? registry[i - 1] : null;
  const next = i >= 0 && i < registry.length - 1 ? registry[i + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav className="d-pager" aria-label="Component pagination">
      {prev ? (
        <a href={`#/components/${prev.slug}`}>
          <small>Previous</small>
          <strong>{prev.name}</strong>
        </a>
      ) : <span />}
      {next ? (
        <a href={`#/components/${next.slug}`}>
          <small>Next</small>
          <strong>{next.name}</strong>
        </a>
      ) : <span />}
    </nav>
  );
}

export function IntroPage() {
  return (
    <article>
      <section className="d-hero">
        <h1>
          Semantic components,
          <br />
          shadcn-neutral design.
        </h1>
        <p className="lead">
          Mo (墨, “ink”) is a zero-dependency HTML/CSS/JS component library.
          Semantic tags styled contextually, the shadcn/ui neutral token system,
          and an override model that never fights your CSS.
        </p>
      </section>

      <h2 className="d-section-title" id="installation">Installation</h2>
      <CodeBlock code={`pnpm add @sayagodev/mo

<!-- or plain files -->
<link rel="stylesheet" href="mo.min.css" />
<script src="mo.min.js"></script>`} />

      <h2 className="d-section-title" id="theming">Theming</h2>
      <p className="lead">
        Every style lives in cascade layers, so any unlayered rule you write wins
        regardless of load order. Tokens use <code>light-dark()</code>; dark mode
        follows the OS automatically, or force it with{' '}
        <code>&lt;html data-theme="dark"&gt;</code> or <code>&lt;html class="dark"&gt;</code>.
        Components ship fully styled — change them afterwards via tokens,
        <code> --mo-*</code> hooks or your own CSS.
      </p>
      <p className="lead">
        For a single editable entry point, import{' '}
        <code>@sayagodev/mo/variables.css</code>: it declares <em>every</em>{' '}
        default token (colors, radius, spacing, type, shadows) plus all the
        per-component <code>--mo-*</code> hooks, so you can see and override the
        whole library from one <code>:root</code> block.
      </p>
      <table className="d-token-table">
        <tbody>
          <tr><td>--background / --foreground</td><td>Page surface and default text</td></tr>
          <tr><td>--card · --popover</td><td>Elevated surfaces · floating surfaces</td></tr>
          <tr><td>--primary / --secondary</td><td>High- and low-emphasis actions</td></tr>
          <tr><td>--muted / --accent</td><td>Subtle surfaces · hover states</td></tr>
          <tr><td>--destructive</td><td>Destructive actions and errors</td></tr>
          <tr><td>--border / --input / --ring</td><td>Hairlines, control borders, focus</td></tr>
          <tr><td>--radius (0.625rem)</td><td>Derives sm/md/lg/xl like shadcn @theme</td></tr>
          <tr><td>--mo-* hooks</td><td>Per-component overrides (e.g. --mo-card-radius)</td></tr>
          <tr><td>variables.css</td><td>Shadcn-style global override file with every default</td></tr>
        </tbody>
      </table>

      <h2 className="d-section-title" id="try-it">Try it live</h2>
      <div className="example">
        <div className="example-header">
          <div className="example-tabs">
            <button type="button" className="example-tab" aria-selected="true" role="tab">
              Preview
            </button>
          </div>
        </div>
        <div className="example-preview">
          <button type="button">Default</button>
          <button type="button" className="outline">Outline</button>
          <span className="badge outline">v0.8</span>
          <input placeholder="Type something…" />
        </div>
      </div>
    </article>
  );
}

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  return (
    <article id={doc.slug}>
      <Breadcrumb name={doc.name} />
      <h1>{doc.name}</h1>
      <p className="lead">{doc.description}</p>

      {/* Primary preview */}
      <div id={`${doc.slug}-preview`}>
        <ExampleCard example={{ ...doc.examples[0], title: '' }} />
      </div>

      {doc.usage && (
        <>
          <h2 className="d-section-title" id={`${doc.slug}-usage`}>Usage</h2>
          <CodeBlock code={doc.usage} />
        </>
      )}

      {doc.api.length > 0 && (
        <>
          <h2 className="d-section-title" id={`${doc.slug}-api`}>API Reference</h2>
          <div className="d-api-table" role="table" aria-label={`${doc.name} API`}>
            {doc.api.map((row) => (
              <div className="api-row" role="row" key={row.name}>
                <code>{row.name}</code>
                <span>{row.description}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {doc.examples.length > 1 && (
        <>
          <h2 className="d-section-title" id={`${doc.slug}-examples`}>Examples</h2>
          {doc.examples.slice(1).map((ex) => {
            const anchor = `${doc.slug}-${ex.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return (
              <div key={ex.title} id={anchor}>
                <ExampleCard example={ex} />
              </div>
            );
          })}
        </>
      )}

      <Pager slug={doc.slug} />
    </article>
  );
}

function scrollToAnchor(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Toc({ doc }: { doc: ComponentDoc | null }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) return;
    const onScroll = () => {
      let found: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top < 140) found = item.id;
      }
      setCurrent(found);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [doc]);

  if (!doc) return null;

  const items = [
    { id: `${doc.slug}-preview`, label: 'Preview' },
    ...(doc.usage ? [{ id: `${doc.slug}-usage`, label: 'Usage' }] : []),
    ...(doc.api.length > 0 ? [{ id: `${doc.slug}-api`, label: 'API reference' }] : []),
    ...doc.examples.slice(1).map((ex) => ({
      id: `${doc.slug}-${ex.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: ex.title,
    })),
  ];
  if (items.length < 2) return null;

  return (
    <aside className="d-toc" aria-label="On this page">
      <h4>On this page</h4>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={current === item.id ? 'true' : undefined}
          onClick={(e) => scrollToAnchor(e, item.id)}
        >
          {item.label}
        </a>
      ))}
    </aside>
  );
}

export function NotFoundPage() {
  return (
    <article>
      <h1>Not found</h1>
      <p className="lead">That component doesn’t exist yet.</p>
    </article>
  );
}
