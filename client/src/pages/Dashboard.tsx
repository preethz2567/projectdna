import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject, deleteProject, getPendingInvitations, acceptInvitation, declineInvitation } from '../api/projects';
import { getNotifications, markNotificationRead } from '../api/notifications';
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState<Record<string, Project[]>>({});
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
    getNotifications().then(setNotifications);
  }, [user]);

  // Hashing technique: Inverted Index for fast project searching (O(1) lookup per word)
  useEffect(() => {
    const index: Record<string, Project[]> = {};
    projects.forEach(p => {
      const words = `${p.title} ${p.description}`.toLowerCase().split(/\W+/).filter(Boolean);
      words.forEach(word => {
        for (let i = 1; i <= word.length; i++) {
          const prefix = word.substring(0, i);
          if (!index[prefix]) index[prefix] = [];
          if (!index[prefix].find(x => x.id === p.id)) {
            index[prefix].push(p);
          }
        }
      });
    });
    setSearchIndex(index);
  }, [projects]);

  const filteredProjects = searchQuery.trim()
    ? searchQuery.trim().toLowerCase().split(/\W+/).filter(Boolean).reduce((acc, word, idx) => {
        const matches = searchIndex[word] || [];
        if (idx === 0) return matches;
        return acc.filter(p => matches.find(m => m.id === p.id));
      }, [] as Project[])
    : projects;

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
          <nav className="sidebar-nav" style={{ padding: 0 }}>
             <div className="sidebar-section">CORE</div>
             
             <div className="nav-item active">
               <span className="nav-item-icon"><FolderIcon /></span>
               Workspaces
             </div>
             
             <div className="nav-item" onClick={() => document.getElementById('invitations-section')?.scrollIntoView({ behavior: 'smooth' })}>
               <span className="nav-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></span>
               Notifications
               {(invitations.length + notifications.length) > 0 && <span className="sidebar-badge">{invitations.length + notifications.length}</span>}
             </div>

          </nav>

          {/* Bottom Settings */}
          <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: `1px solid ${theme.borderSubtle}` }}>
             <div className="nav-item">
               <span className="nav-item-icon"><SettingsIcon /></span>
               Settings
             </div>
             <div className="nav-item">
               <span className="nav-item-icon"><HelpIcon /></span>
               Support
             </div>
             <div className="sidebar-section" onClick={logout} style={{ cursor: 'pointer' }}>
               LOGOUT
             </div>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          
          <div style={{ padding: '48px', position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Notifications & Invitations Section */}
            {(invitations.length > 0 || notifications.length > 0) && (
              <div id="invitations-section" style={{ marginBottom: 48, background: '#ffffff', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '24px 32px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 24px 0', color: theme.textMain, fontSize: 22, fontWeight: 700 }}>Action Required</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Notifications */}
                  {notifications.map(notif => (
                    <div key={notif.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '20px 24px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ color: notif.type === 'invite_accepted' ? '#10b981' : '#ef4444' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                            {notif.type === 'invite_accepted' ? 'Invitation Accepted' : 'Invitation Declined'}
                          </div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>{notif.content}</div>
                        </div>
                      </div>
                      <button 
                        style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', padding: '6px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e=>{e.currentTarget.style.background='#f1f5f9'}}
                        onMouseOut={e=>{e.currentTarget.style.background='transparent'}}
                        onClick={async () => {
                          await markNotificationRead(notif.id);
                          setNotifications(prev => prev.filter(n => n.id !== notif.id));
                        }}
                      >
                        DISMISS
                      </button>
                    </div>
                  ))}
                  
                  {/* Invitations */}
                  {invitations.map(inv => (
                    <div key={inv.project_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '20px 24px', borderRadius: 4 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>{inv.project_title}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>Invited by {inv.inviter_name} to join as <span style={{ color: '#ffffff' }}>{inv.role}</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button 
                          style={{ background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '6px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e=>{e.currentTarget.style.background='rgba(16, 185, 129, 0.1)'}}
                          onMouseOut={e=>{e.currentTarget.style.background='transparent'}}
                          onClick={async () => {
                            await acceptInvitation(inv.project_id);
                            setInvitations(prev => prev.filter(i => i.project_id !== inv.project_id));
                            const data = await listProjects();
                            setProjects(data);
                          }}
                        >
                          ACCEPT
                        </button>
                        <button 
                          style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e=>{e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'}}
                          onMouseOut={e=>{e.currentTarget.style.background='transparent'}}
                          onClick={async () => {
                            await declineInvitation(inv.project_id);
                            setInvitations(prev => prev.filter(i => i.project_id !== inv.project_id));
                          }}
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header with Search and New Project */}
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
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-end' }}>
                 <button className="btn" style={{ background: theme.accent, color: 'white', border: 'none', padding: '14px 24px', borderRadius: 4, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'background 0.2s' }} onClick={() => setShowModal(true)} onMouseOver={e=>e.currentTarget.style.background=theme.accentHover} onMouseOut={e=>e.currentTarget.style.background=theme.accent}>
                   <PlusIcon />
                   NEW PROJECT
                 </button>
                 <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${theme.border}`, borderRadius: 24, padding: '8px 16px', width: 300 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginRight: 8 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" placeholder="Search projects by title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, width: '100%' }} />
                 </div>
               </div>
            </div>

            {/* Grid */}
            {projects.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '80px 32px', background: theme.bgCard, border: `1px dashed ${theme.border}`, borderRadius: 8 }}>
                  <div onClick={() => setShowModal(true)} style={{ width: 64, height: 64, background: theme.pillBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, margin: '0 auto 24px', border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background=theme.pillBg}>
                     <PlusIcon />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 12, color: theme.textMain }}>No projects yet</h3>
                 <p style={{ color: theme.textMuted, marginBottom: 24, fontSize: 15 }}>Create your first project to begin the analysis pipeline.</p>
               </div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                 {filteredProjects.map((p, i) => {
                   const mockTags = p.description ? p.description.split(' ').slice(0, 3).filter(t=>t.length>3) : ['React', 'Node', 'API'];
                   const isNew = i % 3 === 0;
                   
                   return (
                     <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ background: '#ffffff', border: `1px solid #e5e7eb`, borderRadius: 6, padding: '24px 32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', position: 'relative' }} onMouseOver={e=>{e.currentTarget.style.borderColor='#cbd5e1'}} onMouseOut={e=>{e.currentTarget.style.borderColor='#e5e7eb'}}>
                        {/* Badges Right */}
                        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                           {isNew && <div style={{ background: '#fbbf24', color: '#0f172a', padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>New</div>}
                           <div style={{ background: '#15803d', color: 'white', padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Active</div>
                           <div style={{ background: '#64748b', color: 'white', padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Participant</div>
                        </div>

                        {/* Title & Info */}
                        <div style={{ paddingRight: 100 }}>
                          <h3 style={{ fontFamily: '"Segoe UI", "Open Sans", sans-serif', fontSize: 22, fontWeight: 500, color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.3 }}>{p.title}</h3>
                          <div style={{ fontSize: 16, color: '#64748b', marginBottom: 12 }}>
                            Start Date: {new Date(p.created_at).toLocaleDateString('en-GB')}
                          </div>
                          <div style={{ fontSize: 16, color: '#64748b', marginBottom: 24 }}>
                            Mentorship: NoMentor
                          </div>
                        </div>

                        {/* Clusters */}
                        <div>
                           <div style={{ fontSize: 16, color: '#64748b', marginBottom: 12 }}>Clusters</div>
                           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                             {mockTags.map((tag, idx) => (
                               <span key={idx} style={{ fontSize: 12, fontWeight: 700, color: '#000000', border: `1px solid #e2e8f0`, padding: '6px 14px', borderRadius: 20 }}>
                                 {tag.toUpperCase()}
                               </span>
                             ))}
                           </div>
                        </div>

                        {/* Bottom Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 }}>
                           <div style={{ color: '#94a3b8' }}>
                             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(45deg)' }}><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                           </div>
                           <button style={{ background: '#ffffff', border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px 24px', borderRadius: 4, fontSize: 16, fontWeight: 400, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(59, 130, 246, 0.05)'} onMouseOut={e=>e.currentTarget.style.background='#ffffff'}>
                             Open
                           </button>
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
