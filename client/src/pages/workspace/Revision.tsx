import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { generateRevision, getDocuments } from '../../api/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Revision() {
  const { projectId } = useParams<{ projectId: string }>();
  const [guide, setGuide] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);

  useEffect(() => {
    getDocuments(projectId!)
      .then(docs => {
        const rev = docs.find((d: any) => d.doc_type === 'revision');
        if (rev) setGuide(rev.content);
      })
      .finally(() => setInitialFetch(false));
  }, [projectId]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const r = await generateRevision(projectId!);
      setGuide(r.guide);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, margin: 0 }}>Revision Guide</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0 0' }}>Your personalized 10-minute prep sheet before the interview.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading} style={{ borderRadius: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {loading ? 'Generating...' : '⚡ Re-generate'}
        </button>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {!guide && !loading && !initialFetch && (
          <div className="empty-state">
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>No revision guide yet</p>
            <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>The AI uses your project details, past interview experiences, and common questions to build a personalized guide.</p>
            <button className="btn btn-primary" onClick={handleGenerate} style={{ marginTop: 16, borderRadius: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Generate Now</button>
          </div>
        )}
        
        {loading && <div className="loading" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Building your revision guide... combining project context with your interview history</div>}
        
        {guide && !loading && (
          <div className="card" style={{ padding: 32, borderRadius: 0, borderTop: '4px solid var(--accent)' }}>
            <div className="markdown-body" style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.7 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {guide}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
