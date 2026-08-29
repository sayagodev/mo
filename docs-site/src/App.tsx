import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from './Sidebar'
import { IntroPage, ComponentPage, NotFoundPage, Toc } from './pages'
import { registry } from './registry'

type Route =
  | { page: 'intro' }
  | { page: 'component'; slug: string }
  | { page: 'not-found' }

function parseRoute(hash: string): Route {
  const m = hash.match(/^#\/components\/([a-z0-9-]+)$/);
  if (m) {
    const slug = m[1];
    return registry.some((c) => c.slug === slug)
      ? { page: 'component', slug }
      : { page: 'not-found' };
  }
  return { page: 'intro' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [theme, setTheme] = useState<string>(
    () =>
      document.documentElement.dataset.theme ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash));
      document.querySelector('.d-main')?.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    // Placeholder links (href="#") are demo affordances: keep the page put.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href="#"]');
      if (link) e.preventDefault();
    };
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      delete document.documentElement.dataset.theme;
    }
    localStorage.setItem('mo-theme', theme);
  }, [theme]);

  const doc = useMemo(
    () => (route.page === 'component' ? registry.find((c) => c.slug === route.slug)! : null),
    [route],
  );

  return (
    <>
      <header className="d-topbar">
        <a className="d-brand" href="#/">
          <span className="d-brand-mark">墨</span> Mo UI
        </a>
        <span className="d-version">v0.8</span>
        <span className="d-spacer" />
        <button
          type="button"
          className="d-icon-btn"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <div className="d-layout">
        <Sidebar current={route.page === 'component' ? route.slug : null} />
        <main className="d-main">
          <div className="d-content-with-toc">
            <div className="d-content d-doc">
              {route.page === 'intro' && <IntroPage />}
              {doc && <ComponentPage doc={doc} key={doc.slug} />}
              {route.page === 'not-found' && <NotFoundPage />}
            </div>
            {doc && <Toc doc={doc} key={`toc-${doc.slug}`} />}
          </div>
        </main>
      </div>
    </>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
