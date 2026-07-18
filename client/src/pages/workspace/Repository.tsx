import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRepo, connectRepo } from '../../api/projects';
import { indexRepo } from '../../api/ai';
import { useState } from 'react';
import { z } from 'zod';

const githubUrlSchema = z.string().url().regex(/^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+$/, 'Must be a valid GitHub repository URL (e.g. https://github.com/user/repo)');

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
    try {
      githubUrlSchema.parse(url);
    } catch (err: any) {
      setIndexMsg(err.errors ? err.errors[0].message : 'Invalid GitHub URL');
      return;
    }

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
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
              Connect a GitHub repository
            </h3>
            <form onSubmit={handleConnect} style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="https://github.com/username/repo"
                value={url} onChange={e => setUrl(e.target.value)} required disabled={connecting} />
              <button className="btn btn-primary" type="submit" disabled={connecting}>
                {connecting ? (connectPhase === 'indexing' ? 'Indexing...' : 'Connecting...') : 'Connect'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {/* Repository Info Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: '#181717', padding: 16, borderRadius: 12, color: '#fff' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{repo.repo_owner}/{repo.repo_name}</h3>
                    <div style={{ color: '#64748b', fontSize: 14, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v12"></path><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                      {repo.default_branch}
                    </div>
                  </div>
                </div>
                {repo.last_indexed_at && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Last indexed: {new Date(repo.last_indexed_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Tech Stack Card */}
              {repo.tech_stack && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 600, fontSize: 16 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                      Tech Stack
                    </div>
                  </div>
                  <div style={{ padding: 24, flex: 1, display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    {(repo.tech_stack as string[]).map((t: string) => (
                      <span key={t} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {/* Source Files Indexed */}
              {indexedFiles.length > 0 && (
                <div className="card" style={{ maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <span className="card-title" style={{ fontSize: 16 }}>Source Files Indexed ({indexedFiles.length})</span>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>AI has full knowledge of these files</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, fontFamily: 'var(--mono)', fontSize: 13 }}>
                    {indexedFiles.map(f => (
                      <div key={f.path || f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span style={{ color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path || f.name}</span>
                        {f.size && <span style={{ color: '#94a3b8', fontSize: 11 }}>{(f.size / 1024).toFixed(1)}KB</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Files */}
              {additionalFiles.length > 0 && (
                <div className="card" style={{ maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <span className="card-title" style={{ fontSize: 16 }}>Additional Files ({additionalFiles.length})</span>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>In tree but not fully indexed</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, fontFamily: 'var(--mono)', fontSize: 13, opacity: 0.7 }}>
                    {additionalFiles.slice(0, 50).map(f => (
                      <div key={f.path || f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path || f.name}</span>
                      </div>
                    ))}
                    {additionalFiles.length > 50 && (
                      <div style={{ color: '#64748b', marginTop: 12, fontSize: 12, textAlign: 'center', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                        ...and {additionalFiles.length - 50} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {repo.readme && (
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 600, fontSize: 16 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    README
                  </div>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <pre style={{ fontFamily: 'var(--mono)', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155', background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    {repo.readme.slice(0, 3000)}{repo.readme.length > 3000 ? '\n\n... (truncated)' : ''}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
