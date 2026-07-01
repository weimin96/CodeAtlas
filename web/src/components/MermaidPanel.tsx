import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });

export function MermaidPanel({ chart }: { chart?: string }) {
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!chart?.trim()) return;
      try {
        setError('');
        const result = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(result.svg);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) return <pre className="rounded-md bg-red-950/50 p-3 text-xs text-red-200 overflow-auto">Mermaid 渲染失败：{error}</pre>;
  return <div className="mermaid overflow-auto rounded-lg border bg-slate-950 p-4" dangerouslySetInnerHTML={{ __html: svg }} />;
}
