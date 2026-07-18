import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRepo, connectRepo } from '../../api/projects';
import { indexRepo } from '../../api/ai';
import { useState } from 'react';

type FileItem = { name: string; type: string; path?: string; size?: number; content?: string };

export default function Repository() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState('');
  const [connectPhase, setConnectPhase] = useState<'idle' | 'connecting' | 'indexing' | 'done'>('idle');

  const [reconnecting, setReconnecting] = useState(false);

  const { data: repo, isLoading } = useQuery({
    queryKey: ['repo', projectId],
    queryFn: () => getRepo(projectId!)
  });

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setConnectPhase('connecting');
    try {
      await connectRepo(projectId!, url);
      setConnectPhase('indexing');
      try {
        const r = await indexRepo(projectId!);
        setIndexMsg(`Indexed ${r.chunks} chunks successfully.`);
        setConnectPhase('done');
      } catch {
        setIndexMsg('Connected, but auto-indexing failed. You can manually index below.');
        setConnectPhase('done');
      }
      qc.invalidateQueries({ queryKey: ['repo', projectId] });
      setUrl('');
      setReconnecting(false);
    } catch {
      setConnectPhase('idle');
      setIndexMsg('Failed to connect repository. Check the URL and try again.');
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

  // Split folder_structure into indexed (with content) and additional (without)
  const allFiles: FileItem[] = (repo?.folder_structure as FileItem[]) || [];
  const indexedFiles = allFiles.filter(f => f.content);
  const additionalFiles = allFiles.filter(f => !f.content);

  return (
    <div>
      <div className="page-header">
        <h2>Repository</h2>
        {repo && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setReconnecting(r => !r); setUrl(repo.github_url || ''); }}>
              🔗 Reconnect
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleIndex} disabled={indexing}>
              {indexing ? 'Indexing...' : '⚡ Re-index for AI'}
            </button>
          </div>
        )}
      </div>
      <div className="page-content">
        {indexMsg && (
          <div style={{
            padding: '8px 12px',
            background: indexMsg.includes('fail') || indexMsg.includes('Failed') ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${indexMsg.includes('fail') || indexMsg.includes('Failed') ? '#fca5a5' : '#86efac'}`,
            fontSize: 13, marginBottom: 16
          }}>
            {indexMsg}
          </div>
        )}

        {/* Reconnect form — shown when repo is connected but user wants to re-connect */}
        {repo && reconnecting && (
          <div className="card mb-4">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Reconnect Repository</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              This will re-fetch all source files and re-index the repository for AI.
            </p>
            <form onSubmit={handleConnect} style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="https://github.com/username/repo"
                value={url} onChange={e => setUrl(e.target.value)} required disabled={connecting} />
              <button className="btn btn-primary" type="submit" disabled={connecting}>
                {connecting ? (connectPhase === 'indexing' ? 'Indexing...' : 'Connecting...') : 'Reconnect & Index'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setReconnecting(false)} disabled={connecting}>
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Connection progress */}
        {connectPhase !== 'idle' && connectPhase !== 'done' && !repo && (
          <div style={{ padding: 16, background: '#f8fafc', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ color: connectPhase === 'connecting' ? 'var(--accent)' : '#22c55e', fontWeight: 600 }}>
                {connectPhase === 'connecting' ? '⏳' : '✓'} Connect repository
              </span>
              {connectPhase === 'indexing' && (
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  → ⏳ Indexing source files...
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {connectPhase === 'connecting' && 'Fetching repository tree and source files from GitHub...'}
              {connectPhase === 'indexing' && 'Building AI knowledge base from your source code...'}
            </div>
          </div>
        )}

        {!repo ? (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Connect a GitHub repository</h3>
            <form onSubmit={handleConnect} style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="https://github.com/username/repo"
                value={url} onChange={e => setUrl(e.target.value)} required disabled={connecting} />
              <button className="btn btn-primary" type="submit" disabled={connecting}>
                {connecting ? (connectPhase === 'indexing' ? 'Indexing...' : 'Connecting...') : 'Connect'}
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

            {/* Source files indexed (with content) */}
            {indexedFiles.length > 0 && (
              <div className="card mb-4">
                <div className="card-header">
                  <span className="card-title">Source Files Indexed ({indexedFiles.length})</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>AI has full knowledge of these files</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8 }}>
                  {indexedFiles.map(f => (
                    <div key={f.path || f.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#22c55e', fontSize: 10 }}>●</span>
                      <span style={{ color: 'var(--text)' }}>{f.path || f.name}</span>
                      {f.size && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({(f.size / 1024).toFixed(1)}KB)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional files (without content, just in tree) */}
            {additionalFiles.length > 0 && (
              <div className="card mb-4">
                <div className="card-header">
                  <span className="card-title">Additional Files ({additionalFiles.length})</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>In tree but not fully indexed</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8, opacity: 0.6 }}>
                  {additionalFiles.slice(0, 50).map(f => (
                    <div key={f.path || f.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>○</span>
                      <span>{f.path || f.name}</span>
                    </div>
                  ))}
                  {additionalFiles.length > 50 && (
                    <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>...and {additionalFiles.length - 50} more files</div>
                  )}
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
