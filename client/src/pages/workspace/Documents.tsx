import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocuments, generateDoc } from '../../api/ai';
import { useState } from 'react';

const DOC_TYPES = [
  { key: 'overview', label: 'Overview' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'api_docs', label: 'API Docs' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'readme', label: 'README' },
];

interface Doc {
  id: string; doc_type: string; title: string; content: string; updated_at: string;
}

export default function Documents() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Doc | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => getDocuments(projectId!)
  });

  async function handleGenerate(docType: string) {
    setGenerating(docType);
    try {
      await generateDoc(projectId!, docType);
      qc.invalidateQueries({ queryKey: ['documents', projectId] });
    } finally {
      setGenerating(null);
    }
  }

  const docMap = Object.fromEntries((docs as Doc[]).map(d => [d.doc_type, d]));

  return (
    <div>
      <div className="page-header">
        <h2>Documents</h2>
      </div>
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Doc list */}
        <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: '1rem' }}>
          {DOC_TYPES.map(dt => {
            const doc = docMap[dt.key];
            return (
              <div key={dt.key} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: selected?.doc_type === dt.key ? '#eff6ff' : 'transparent', cursor: 'pointer', borderLeft: selected?.doc_type === dt.key ? '2px solid var(--accent)' : '2px solid transparent' }}
                  onClick={() => doc && setSelected(doc)}>
                  <span style={{ fontSize: 13 }}>{dt.label}</span>
                  {doc && <span style={{ fontSize: 10, color: 'var(--success)' }}>✓</span>}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: 11, marginTop: 2 }}
                  onClick={() => handleGenerate(dt.key)} disabled={generating === dt.key}>
                  {generating === dt.key ? 'Generating...' : doc ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Doc content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {selected ? (
            <>
              <div className="flex-between mb-4">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{selected.title}</h3>
                <span className="text-muted" style={{ fontSize: 11 }}>Updated {new Date(selected.updated_at).toLocaleString()}</span>
              </div>
              <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {selected.content}
              </pre>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a document or generate one from the left panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
