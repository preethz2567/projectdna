import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRepo, connectRepo } from '../../api/projects';
import { indexRepo } from '../../api/ai';
import { useState } from 'react';

export default function Repository() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState('');

  const { data: repo, isLoading } = useQuery({
    queryKey: ['repo', projectId],
    queryFn: () => getRepo(projectId!)
  });

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    try {
      await connectRepo(projectId!, url);
      qc.invalidateQueries({ queryKey: ['repo', projectId] });
      setUrl('');
    } finally {
      setConnecting(false);
    }
  }

  async function handleIndex() {
    setIndexing(true);
    setIndexMsg('');
    try {
      const r = await indexRepo(projectId!);
      setIndexMsg(`Indexed ${r.chunks} chunks successfully.`);
    } catch {
      setIndexMsg('Indexing failed. Check AI service.');
    } finally {
      setIndexing(false);
    }
  }

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Repository</h2>
        {repo && (
          <button className="btn btn-primary btn-sm" onClick={handleIndex} disabled={indexing}>
            {indexing ? 'Indexing...' : '⚡ Index for AI'}
          </button>
        )}
      </div>
      <div className="page-content">
        {indexMsg && <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #86efac', fontSize: 13, marginBottom: 16 }}>{indexMsg}</div>}

        {!repo ? (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Connect a GitHub repository</h3>
            <form onSubmit={handleConnect} style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="https://github.com/username/repo"
                value={url} onChange={e => setUrl(e.target.value)} required />
              <button className="btn btn-primary" type="submit" disabled={connecting}>
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="card mb-4">
              <div className="card-header"><span className="card-title">Repository</span></div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{repo.repo_owner}/{repo.repo_name}</div>
              <div className="text-muted mt-1">Branch: {repo.default_branch}</div>
              {repo.last_indexed_at && <div className="text-muted mt-1">Last indexed: {new Date(repo.last_indexed_at).toLocaleString()}</div>}
            </div>

            {repo.tech_stack && (
              <div className="card mb-4">
                <div className="card-header"><span className="card-title">Tech Stack</span></div>
                <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {(repo.tech_stack as string[]).map((t: string) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {repo.folder_structure && (
              <div className="card mb-4">
                <div className="card-header"><span className="card-title">Structure</span></div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8 }}>
                  {(repo.folder_structure as { name: string; type: string }[]).map(f => (
                    <div key={f.name} style={{ color: f.type === 'dir' ? 'var(--accent)' : 'var(--text)' }}>
                      {f.type === 'dir' ? '📁' : '📄'} {f.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {repo.readme && (
              <div className="card">
                <div className="card-header"><span className="card-title">README</span></div>
                <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {repo.readme.slice(0, 2000)}{repo.readme.length > 2000 ? '...' : ''}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
