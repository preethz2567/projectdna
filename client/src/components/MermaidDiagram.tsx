import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'JetBrains Mono, monospace',
  suppressErrorRendering: true,
});

let diagramId = 0;

export default function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(`mermaid-${++diagramId}`);

  useEffect(() => {
    if (!ref.current || !code.trim()) return;
    
    // AI sometimes wraps the response in ```mermaid ... ```
    // We need to sanitize the code before rendering
    let cleanCode = code.trim();
    if (cleanCode.startsWith('```mermaid')) {
      cleanCode = cleanCode.replace(/^```mermaid\n?/, '').replace(/```$/, '').trim();
    } else if (cleanCode.startsWith('```')) {
      cleanCode = cleanCode.replace(/^```\n?/, '').replace(/```$/, '').trim();
    }

    // Auto-fix: Quote node labels that contain parentheses, commas, or slashes to prevent Parse Errors
    cleanCode = cleanCode.replace(/([a-zA-Z0-9_-]+)\[([^"\]]+)\]/g, (match, id, label) => {
        if (/[\(\)\,\/]/.test(label)) return `${id}["${label}"]`;
        return match;
    });

    ref.current.innerHTML = '';
    mermaid.render(id.current, cleanCode).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg;
    }).catch((err) => {
      if (ref.current) {
        ref.current.innerHTML = `<pre style="color:var(--error);font-size:12px;padding:1rem">${err.message}\n\nRaw diagram code:\n${cleanCode}</pre>`;
      }
    });
  }, [code]);

  return <div id="diagram-container" ref={ref} style={{ width: '100%', overflowX: 'auto', background: 'white', padding: '16px' }} />;
}
