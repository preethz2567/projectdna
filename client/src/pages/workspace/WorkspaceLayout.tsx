import { useEffect, useState } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
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
import Diagrams from './Diagrams';
import Quiz from './Quiz';
import Deck from './Deck';
import PresentationMode from './PresentationMode';
import {
  HomeIcon, GitIcon, TaskIcon, TimelineIcon, NotesIcon,
  ChatIcon, DocsIcon, DiagramIcon, ImprovIcon,
  QuizIcon, RevIcon, ExpIcon, DeckIcon, PresentIcon, FeedbackIcon,
  UsersIcon
} from '../../components/Icons';

const NAV_SECTIONS = [
  {
    title: 'Code Intelligence',
    items: [
      { path: '', label: 'Overview', icon: HomeIcon },
      { path: 'repository', label: 'Repository', icon: GitIcon },
      { path: 'documents', label: 'Documentation', icon: DocsIcon },
      { path: 'diagrams', label: 'Architecture', icon: DiagramIcon },
      { path: 'improvements', label: 'Code Review', icon: ImprovIcon },
    ]
  },
  {
    title: 'Project Management',
    items: [
      { path: 'members', label: 'Team Members', icon: UsersIcon },
      { path: 'tasks', label: 'Tasks', icon: TaskIcon },
      { path: 'notes', label: 'Notes', icon: NotesIcon },
    ]
  },
  {
    title: 'Viva & Interview Prep',
    items: [
      { path: 'chat', label: 'AI Tutor', icon: ChatIcon },
      { path: 'quiz', label: 'Knowledge Quiz', icon: QuizIcon },
      { path: 'interview', label: 'Mock Questions', icon: QuizIcon },
      { path: 'revision', label: 'Revision Guide', icon: RevIcon },
    ]
  },
  {
    title: 'Presentation & Logs',
    items: [
      { path: 'deck', label: 'Slide Deck', icon: DeckIcon },
      { path: 'presentation', label: 'Present Mode', icon: PresentIcon },
      { path: 'timeline', label: 'Project Timeline', icon: TimelineIcon },
      { path: 'experiences', label: 'Experience Log', icon: ExpIcon },
      { path: 'feedback', label: 'Feedback', icon: FeedbackIcon },
    ]
  }
];

export default function WorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<{ title: string; description: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (projectId) getProject(projectId).then(setProject);
  }, [projectId]);

  // Close sidebar on navigation (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Mobile Nav Overlay */}
      <div 
        className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Left sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-name" onClick={() => navigate('/dashboard')}>
            <div className="sidebar-brand-logo">P</div>
            ProjectDNA
          </div>
          <div className="sidebar-project-name">{project?.title}</div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.title}>
              <div className="sidebar-section">{section.title}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={`/projects/${projectId}${item.path ? '/' + item.path : ''}`}
                  end={item.path === ''}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-item-icon"><item.icon /></span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.display_name}</div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      {/* Main content */}
      <div className="main dot-grid">
        <button 
          className="mobile-nav-toggle"
          onClick={() => setSidebarOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

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
          <Route path="diagrams" element={<Diagrams />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="deck" element={<Deck />} />
          <Route path="presentation" element={<PresentationMode />} />
        </Routes>
      </div>
    </div>
  );
}
