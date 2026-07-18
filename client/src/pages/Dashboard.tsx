import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject, deleteProject, getPendingInvitations, acceptInvitation, declineInvitation } from '../api/projects';
import { updateProfile } from '../api/auth';
import api from '../api/client';
import { useStore } from '../store/useStore';

interface Project {
  id: string; title: string; description: string;
  vision: string; status: string; created_at: string; member_role: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [healthScores, setHealthScores] = useState<Record<string, number>>({});
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', vision: '' });
  const [loading, setLoading] = useState(false);

  // Profile Edit
  const { user, logout, updateUser } = useStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !editName) setEditName(user.display_name);
    listProjects().then(async (data) => {
      setProjects(data);
      const scores = await Promise.all(
        data.map((p: { id: string }) =>
          api.get(`/projects/${p.id}/ai/health-score`)
            .then(r => ({ id: p.id, score: r.data.score }))
            .catch(() => ({ id: p.id, score: 0 }))
        )
      );
      const scoreMap = Object.fromEntries(scores.map(s => [s.id, s.score]));
      setHealthScores(scoreMap);
    });
    getPendingInvitations().then(setInvitations);
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await createProject(form);
      setProjects(prev => [p, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', vision: '' });
      navigate(`/projects/${p.id}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!editName.trim()) return;
    setProfileSaving(true);
    try {
      const updated = await updateProfile({ display_name: editName });
      updateUser({ display_name: updated.display_name });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  }

  // --- Theme ---
  const theme = {
    bgApp: '#F8FAFC',        // Light gray main background
    bgPanel: 'var(--accent)',// Navy Blue topnav
    bgSidebar: '#2C3338',    // Professional grey sidebar
    bgCard: '#FFFFFF',       // White cards
    border: 'var(--border)', // Use app border var
    borderSubtle: 'rgba(255,255,255,0.1)',
    textMain: 'var(--text)',
    textPanel: '#FFFFFF',
    textMuted: 'var(--text-muted)',
    textPanelMuted: 'rgba(255,255,255,0.6)',
    accent: 'var(--accent)', // The exact deep navy from home page
    accentHover: 'var(--text)', // Black on hover for contrast
    pillBg: '#F1F5F9',
  };

  // --- Icons ---
  const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
  const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
  const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
  const HelpIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
  const CubeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: theme.bgApp, color: theme.textMain, fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      
      {/* --- TOPNAV --- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, background: theme.bgPanel, borderBottom: `1px solid ${theme.borderSubtle}`, padding: '0 24px', zIndex: 20 }}>
        
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'white' }}>
            <CubeIcon />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', color: theme.textPanel, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>PROJECTDNA</span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          
          <button style={{ background: 'white', color: theme.bgPanel, border: 'none', padding: '6px 12px', borderRadius: 0, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate('/recommendations')}>
             What to build next
             <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </button>
          
          <div style={{ width: 28, height: 28, borderRadius: 0, background: 'white', color: theme.bgPanel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
             {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR --- */}
        <div style={{ width: 260, background: theme.bgSidebar, borderRight: `1px solid ${theme.borderSubtle}`, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          
          {/* User Profile */}
          <div style={{ padding: '24px 20px', borderBottom: `1px solid ${theme.borderSubtle}` }}>
             <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
               <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textPanel, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                 {user?.display_name?.charAt(0).toUpperCase()}
               </div>
               <div style={{ flex: 1 }}>
                 {isEditingProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                       <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 0, border: 'none', background: 'white', color: theme.textMain, fontSize: 13, outline: 'none' }} />
                       <div style={{ display: 'flex', gap: 6 }}>
                         <button onClick={handleSaveProfile} disabled={profileSaving} style={{ background: 'white', border: 'none', color: theme.bgPanel, padding: '4px 8px', borderRadius: 0, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Save</button>
                         <button onClick={() => setIsEditingProfile(false)} style={{ background: 'transparent', border: `1px solid ${theme.borderSubtle}`, color: theme.textPanelMuted, padding: '4px 8px', borderRadius: 0, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Cancel</button>
                       </div>
                    </div>
                 ) : (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPanel, marginBottom: 2 }}>{user?.display_name}</div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: theme.textPanelMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{user?.role || 'Developer'}</div>
                      <button onClick={() => setIsEditingProfile(true)} style={{ background: 'transparent', border: `1px solid ${theme.borderSubtle}`, color: theme.textPanelMuted, padding: '4px 8px', borderRadius: 0, fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }} onMouseOver={e=>e.currentTarget.style.color='white'} onMouseOut={e=>e.currentTarget.style.color=theme.textPanelMuted}>
                        Edit Profile
                      </button>
                    </>
                 )}
               </div>
             </div>
          </div>

          {/* Sidebar Nav */}
          <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
             {[
               { icon: <FolderIcon />, label: 'Workspaces', active: true }
             ].map(item => (
               <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', margin: '4px 8px', borderRadius: 8, background: item.active ? 'rgba(255,255,255,0.15)' : 'transparent', color: theme.textPanel, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                 <div>{item.icon}</div>
                 <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
               </div>
             ))}
          </div>

          {/* Bottom Settings */}
          <div style={{ marginTop: 'auto', padding: '20px 12px', borderTop: `1px solid ${theme.borderSubtle}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', margin: '2px 8px', borderRadius: 8, color: theme.textPanelMuted, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.color='white'; e.currentTarget.style.background='rgba(255,255,255,0.05)'}} onMouseOut={e=>{e.currentTarget.style.color=theme.textPanelMuted; e.currentTarget.style.background='transparent'}}>
               <SettingsIcon />
               <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', margin: '2px 8px', borderRadius: 8, color: theme.textPanelMuted, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.color='white'; e.currentTarget.style.background='rgba(255,255,255,0.05)'}} onMouseOut={e=>{e.currentTarget.style.color=theme.textPanelMuted; e.currentTarget.style.background='transparent'}}>
               <HelpIcon />
               <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</span>
             </div>
             <div style={{ padding: '16px 12px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: theme.textPanelMuted, letterSpacing: '0.1em', cursor: 'pointer', transition: 'color 0.2s', textTransform: 'uppercase' }} onClick={logout} onMouseOver={e=>e.currentTarget.style.color='white'} onMouseOut={e=>e.currentTarget.style.color=theme.textPanelMuted}>
               LOGOUT
             </div>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          
          <div style={{ padding: '48px', position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Invitations Section */}
            {invitations.length > 0 && (
              <div style={{ marginBottom: 48, background: theme.bgCard, border: `1px solid ${theme.accent}`, padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 16px 0', color: theme.textMain, fontSize: 20 }}>Pending Invitations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {invitations.map(inv => (
                    <div key={inv.project_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.bgPanel, padding: 16, border: `1px solid ${theme.borderSubtle}` }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: theme.textMain, marginBottom: 4 }}>{inv.project_title}</div>
                        <div style={{ fontSize: 13, color: theme.textMuted }}>Invited by {inv.inviter_name} to join as <span style={{ textTransform: 'capitalize', color: theme.accent }}>{inv.role}</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          style={{ background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={e=>{e.currentTarget.style.background='rgba(16, 185, 129, 0.1)'}}
                          onMouseOut={e=>{e.currentTarget.style.background='transparent'}}
                          onClick={async () => {
                            await acceptInvitation(inv.project_id);
                            setInvitations(prev => prev.filter(i => i.project_id !== inv.project_id));
                            const data = await listProjects();
                            setProjects(data);
                          }}
                        >
                          Accept
                        </button>
                        <button 
                          style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={e=>{e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'}}
                          onMouseOut={e=>{e.currentTarget.style.background='transparent'}}
                          onClick={async () => {
                            await declineInvitation(inv.project_id);
                            setInvitations(prev => prev.filter(i => i.project_id !== inv.project_id));
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
               <div>
                 <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                   WORKSPACE DASHBOARD
                 </div>
                 <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 40, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px 0', color: theme.textMain }}>Your Projects</h1>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: theme.textMuted, fontSize: 14 }}>
                   <span style={{ background: 'transparent', border: `1px solid ${theme.border}`, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>SYS.COUNT: {projects.length}</span>
                   <span>•</span>
                   <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>STATUS: ONLINE</span>
                 </div>
               </div>
               <button className="btn" style={{ background: theme.accent, color: 'white', border: 'none', padding: '14px 24px', borderRadius: 0, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'background 0.2s' }} onClick={() => setShowModal(true)} onMouseOver={e=>e.currentTarget.style.background=theme.accentHover} onMouseOut={e=>e.currentTarget.style.background=theme.accent}>
                 <PlusIcon />
                 NEW PROJECT
               </button>
            </div>

            {/* Grid */}
            {projects.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '80px 32px', background: theme.bgCard, border: `1px dashed ${theme.border}`, borderRadius: 0 }}>
                 <div style={{ width: 64, height: 64, background: theme.pillBg, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, margin: '0 auto 24px', border: `1px solid ${theme.border}` }}>
                    <PlusIcon />
                 </div>
                 <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 12, color: theme.textMain }}>No projects yet</h3>
                 <p style={{ color: theme.textMuted, marginBottom: 24, fontSize: 15 }}>Create your first project to begin the analysis pipeline.</p>
               </div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                 {projects.map((p, i) => {
                   const mockTags = p.description ? p.description.split(' ').slice(0, 3).filter(t=>t.length>3) : ['REACT', 'NODE', 'API'];
                   const timeAgos = ['06 MIN', '01 HR', '12 MIN', '03 DAY', '01 WK', '02 HR'];
                   const timeStr = timeAgos[i % timeAgos.length];
                   
                   return (
                     <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderTop: `4px solid ${theme.accent}`, borderRadius: 0, padding: 32, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 24, transition: 'all 0.2s', position: 'relative' }} onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 30px -10px rgba(0,0,0,0.1)'}} onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'}}>
                       
                       {/* Top Row */}
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: '0.1em' }}>
                           SYS.ID: {p.id.substring(0, 8).toUpperCase()}
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                             T-{timeStr}
                           </div>
                           <button
                             onClick={async (e) => {
                               e.stopPropagation();
                               if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
                               await deleteProject(p.id);
                               setProjects(prev => prev.filter(x => x.id !== p.id));
                             }}
                             style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                             title="Delete project"
                           >
                             ✕ DEL
                           </button>
                         </div>
                       </div>

                       {/* Title */}
                       <div>
                         <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: theme.textMain, margin: '0 0 16px 0', lineHeight: 1.2 }}>{p.title}</h3>
                         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {mockTags.length === 0 ? <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: theme.textMuted, border: `1px solid ${theme.border}`, padding: '4px 8px', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FULLSTACK</span> : null}
                            {mockTags.map((tag, idx) => (
                              <span key={idx} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: theme.textMuted, border: `1px solid ${theme.border}`, padding: '4px 8px', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {tag.toUpperCase()}
                              </span>
                            ))}
                         </div>
                       </div>

                       {/* Bottom: Health */}
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 24, borderTop: `1px solid ${theme.border}` }}>
                          <div>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>HEALTH INDEX</div>
                            <div style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-mono)', color: theme.textMain, lineHeight: 1 }}>
                              {healthScores[p.id] || 0}<span style={{ color: theme.textMuted, fontSize: 14 }}>/100</span>
                            </div>
                          </div>
                          
                          {/* Mock users stack - Sharp borders */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                             <div style={{ width: 28, height: 28, background: 'var(--text)', border: `1px solid ${theme.bgCard}`, color: 'white', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>JD</div>
                             <div style={{ width: 28, height: 28, background: theme.accent, border: `1px solid ${theme.bgCard}`, color: 'white', marginLeft: -8, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>MK</div>
                             <div style={{ width: 28, height: 28, background: '#fafafa', border: `1px solid ${theme.border}`, marginLeft: -8, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: theme.textMuted, fontFamily: 'var(--font-mono)' }}>+2</div>
                          </div>
                       </div>

                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </div>

      </div>

      {/* --- MODAL OVERLAY --- */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowModal(false)}>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, padding: 48, borderRadius: 12, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 24, fontWeight: 600, color: theme.textMain, marginBottom: 32 }}>New Workspace</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Project Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, background: 'white', color: theme.textMain, borderRadius: 6, fontSize: 15, outline: 'none' }} onFocus={e => e.target.style.borderColor = theme.accent} onBlur={e => e.target.style.borderColor = theme.border} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, background: 'white', color: theme.textMain, borderRadius: 6, fontSize: 15, outline: 'none' }} onFocus={e => e.target.style.borderColor = theme.accent} onBlur={e => e.target.style.borderColor = theme.border} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Technical Vision</label>
                <textarea value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))} placeholder="What problem does it solve?" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, background: 'white', color: theme.textMain, borderRadius: 6, fontSize: 15, outline: 'none', minHeight: 120, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = theme.accent} onBlur={e => e.target.style.borderColor = theme.border} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6, fontWeight: 600, color: theme.textMuted, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: theme.accent, border: 'none', borderRadius: 6, fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                  {loading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
