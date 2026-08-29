import { useMemo, useState } from 'react'
import { registry } from './registry'

export function Sidebar({ current }: { current: string | null }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return registry;
    return registry.filter((c) =>
      c.name.toLowerCase().includes(q) || c.slug.includes(q),
    );
  }, [query]);

  return (
    <nav className="d-sidebar" aria-label="Components">
      <input
        type="search"
        className="d-search"
        placeholder="Filter components…"
        aria-label="Filter components"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="d-nav-group">
        <h4>Getting started</h4>
        <a className="d-nav-link" href="#/" aria-current={current === null ? 'page' : undefined}>
          Introduction
        </a>
      </div>
      <div className="d-nav-group">
        <h4>Components</h4>
        {filtered.map((c) => (
          <a
            key={c.slug}
            className="d-nav-link"
            href={`#/components/${c.slug}`}
            aria-current={current === c.slug ? 'page' : undefined}
          >
            {c.name}
          </a>
        ))}
        {filtered.length === 0 && (
          <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)', padding: 'var(--space-2)' }}>
            No matches.
          </p>
        )}
      </div>
    </nav>
  );
}
