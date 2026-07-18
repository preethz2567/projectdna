import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProject } from '../../api/projects';
import { getTimeline, generateArchitecture } from '../../api/ai';
import { useState } from 'react';
import { useStore } from '../../store/useStore';

export default function Overview() {
  const { projectId } = useParams<{ projectId: string }>();
  const [arch, setArch] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useStore();

  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId!) });
  const { data: timeline } = useQuery({ queryKey: ['timeline', projectId], queryFn: () => getTimeline(projectId!) });

  async function handleGenerateArch() {
    setLoading(true);
    try {
      const r = await generateArchitecture(projectId!);
      setArch(r.explanation);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ padding: '32px 48px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
          <span>Workspace</span>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{project?.title || 'Loading...'}</span>
          <span>›</span>
          <span>Overview</span>
        </div>
      </div>
      
      <div className="page-content" style={{ paddingTop: 0 }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {[
            { title: 'HEALTH SCORE', value: '87', sub: '/100', footer: <div style={{ height: 4, background: 'var(--border)', width: '100%', marginTop: 8 }}><div style={{ width: '87%', height: '100%', background: 'var(--accent)' }}/></div> },
            { title: 'CHUNKS INDEXED', value: '12', sub: '', footer: <div className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>+2 since yesterday</div> },
            { title: 'DOCS GENERATED', value: '3', sub: '', footer: <div className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>Architecture, PRD, Technical</div> },
            { title: 'ACTIVE TASKS', value: '5', sub: <span style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 8 }}>80% Done</span>, footer: <div style={{ display: 'flex', gap: 4, marginTop: 8 }}><div style={{flex:1, height:4, background:'var(--accent)'}}/><div style={{flex:1, height:4, background:'var(--accent)'}}/><div style={{flex:1, height:4, background:'var(--accent)'}}/><div style={{flex:1, height:4, background:'var(--border)'}}/></div> }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>{stat.title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', margin: 'auto 0' }}>
                <span style={{ fontSize: 32, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{stat.value}</span>
                <span style={{ color: 'var(--text-muted)' }}>{stat.sub}</span>
              </div>
              {stat.footer}
            </div>
          ))}
        </div>

        {/* Vision & Activity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid #9333ea', padding: '32px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
               <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>AI WORKSPACE VISION</span>
             </div>
             <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
               {project?.vision || 'Define your project vision in the settings to guide AI generations.'}
             </p>
             <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
               {project?.description}
             </p>
             <div style={{ display: 'flex', gap: 8 }}>
               {['Next.js', 'PostgreSQL', 'TypeScript'].map(tag => (
                 <div key={tag} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>{tag}</div>
               ))}
             </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
               <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Recent Activity</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {timeline?.slice(0, 3).map((e: { id: string; title: string; description?: string; created_at: string }) => (
                <div key={e.id} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}><span style={{fontWeight: 600}}>{user?.display_name || 'User'}</span> {e.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Architecture Section */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Architecture Overview</span>
            </div>
            <button className="btn" onClick={handleGenerateArch} disabled={loading} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600 }}>
              {loading ? 'GENERATING...' : 'GENERATE'}
            </button>
          </div>
          
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '24px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {arch ? (
              <div dangerouslySetInnerHTML={{ __html: arch.replace(/\n/g, '<br/>') }} />
            ) : (
              <div># 1. System Topology<br/><br/>No architecture generated yet. Click generate to have AI map your project components.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
