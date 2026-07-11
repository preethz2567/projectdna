import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTimeline } from '../../api/ai';

interface TimelineEvent {
  id: string; event_type: string; title: string; description?: string;
  display_name?: string; created_at: string;
}

const eventColors: Record<string, string> = {
  project_created: 'var(--accent)',
  repo_connected: 'var(--success)',
  repo_indexed: '#8b5cf6',
  default: 'var(--text-muted)'
};

export default function Timeline() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: events = [] } = useQuery({
    queryKey: ['timeline', projectId],
    queryFn: () => getTimeline(projectId!)
  });

  return (
    <div>
      <div className="page-header"><h2>Timeline</h2></div>
      <div className="page-content">
        {(events as TimelineEvent[]).length === 0 ? (
          <div className="empty-state"><p>No timeline events yet.</p></div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
            {(events as TimelineEvent[]).map(e => (
              <div key={e.id} style={{ position: 'relative', marginBottom: 24 }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: eventColors[e.event_type] || eventColors.default, border: '2px solid white', boxShadow: '0 0 0 1px var(--border)' }} />
                <div className="card">
                  <div className="flex-between">
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                  {e.description && <div className="text-muted mt-1">{e.description}</div>}
                  {e.display_name && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>by {e.display_name}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
