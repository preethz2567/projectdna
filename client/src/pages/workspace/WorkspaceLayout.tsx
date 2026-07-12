import { useEffect, useState } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink } from 'react-router-dom';
import { getProject } from '../../api/projects';
import { useStore } from '../../store/useStore';
import Overview from './Overview';
import Repository from './Repository';
import Tasks from './Tasks';
import Chat from './Chat';
import InterviewPrep from './InterviewPrep';
import Documents from './Documents';
import Feedback from './Feedback';
import Timeline from './Timeline';
import Members from './Members';
import Experiences from './Experiences';
import Improvements from './Improvements';
import Revision from './Revision';
import Notes from './Notes';
const NAV = [
  { path: '', label: 'Overview', icon: '⬡' },
  { path: 'repository', label: 'Repository', icon: '⌥' },
  { path: 'tasks', label: 'Tasks', icon: '▦' },
  { path: 'chat', label: 'AI Chat', icon: '◈' },
  { path: 'interview', label: 'Interview Prep', icon: '◎' },
  { path: 'documents', label: 'Documents', icon: '◻' },
  { path: 'feedback', label: 'Feedback', icon: '◇' },
  { path: 'timeline', label: 'Timeline', icon: '◫' },
  { path: 'members', label: 'Team', icon: '👤' },
  { path: 'experiences', label: 'Experiences', icon: '◉' },
  { path: 'improvements', label: 'Improvements', icon: '◈' },
  { path: 'revision', label: 'Revision', icon: '◫' },
  { path: 'notes', label: 'Notes', icon: '◻' },
];

export default function WorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<{ title: string; description: string } | null>(null);
  const { logout, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) getProject(projectId).then(setProject);
  }, [projectId]);

  return (
    <div className="layout">
      {/* Left sidebar */}
      <div className="sidebar">
        {/* Brand */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            ← ProjectDNA
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{project?.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{project?.description}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={`/projects/${projectId}${item.path ? '/' + item.path : ''}`}
              end={item.path === ''}
              className={({ isActive }) => `ws-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{user?.display_name}</div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      {/* Main content */}
      <div className="main">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="repository" element={<Repository />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="chat" element={<Chat />} />
          <Route path="interview" element={<InterviewPrep />} />
          <Route path="documents" element={<Documents />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="members" element={<Members />} />
          <Route path="experiences" element={<Experiences />} />
          <Route path="improvements" element={<Improvements />} />
          <Route path="revision" element={<Revision />} />
          <Route path="notes" element={<Notes />} />
        </Routes>
      </div>
    </div>
  );
}
