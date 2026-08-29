import { useEffect, useMemo, useRef, useState } from 'react'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { Example } from './registry'

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;

function getHighlighter() {
  highlighterPromise ||= createHighlighterCore({
    themes: [
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark.mjs'),
    ],
    langs: [import('shiki/langs/html.mjs')],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return highlighterPromise;
}

function dedent(html: string): string {
  const lines = html.trim().split('\n');
  let min = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    min = Math.min(min, line.match(/^\s*/)![0].length);
  }
  return lines.map((l) => l.slice(min === Infinity ? 0 : min)).join('\n');
}

export function ExampleCard({ example }: { example: Example }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const code = useMemo(() => dedent(example.html), [example.html]);

  useEffect(() => {
    if (tab !== 'code' || !codeRef.current || codeRef.current.dataset.done === '1') return;
    let alive = true;
    getHighlighter().then((hl) => {
      if (!alive || !codeRef.current) return;
      const el = codeRef.current;
      if (el.dataset.done === '1') return;
      el.innerHTML = hl.codeToHtml(code, {
        lang: 'html',
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
      });
      el.dataset.done = '1';
    });
    return () => { alive = false; };
  }, [tab, code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <figure className="example">
      {example.title && <h3 className="d-example-title">{example.title}</h3>}
      <div className="example-header">
        <div className="example-tabs" role="tablist" aria-label="Example view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            className="example-tab"
            onClick={() => setTab('preview')}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'code'}
            className="example-tab"
            onClick={() => setTab('code')}
          >
            Code
          </button>
        </div>
        <button type="button" className="example-copy" onClick={copy} aria-label="Copy code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {copied ? <path d="M20 6 9 17l-5-5" /> : <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>}
          </svg>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div
        className={`example-preview${example.layout === 'column' ? ' col' : ''}`}
        role="tabpanel"
        hidden={tab !== 'preview'}
        dangerouslySetInnerHTML={{ __html: example.html }}
      />

      <div
        className="example-code"
        role="tabpanel"
        hidden={tab !== 'code'}
        ref={codeRef}
      >
        <pre><code>{code}</code></pre>
      </div>
    </figure>
  );
}
