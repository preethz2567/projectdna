import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { generateRevision } from '../../api/ai';

export default function Revision() {
  const { projectId } = useParams<{ projectId: string }>();
  const [guide, setGuide] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const r = await generateRevision(projectId!);
      setGuide(r.guide);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Revision Mode</h2>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : '⚡ Generate revision guide'}
        </button>
      </div>
      <div className="page-content">
        {!guide && !loading && (
          <div className="empty-state">
            <p>Generate a 10-minute revision guide for your next interview</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>The AI uses your project details, past interview experiences, and common questions to build a personalized guide</p>
          </div>
        )}
        {loading && <div className="loading">Building your revision guide... combining project context with your interview history</div>}
        {guide && (
          <div className="card">
            <pre style={{ fontFamily: 'var(--mono)', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {guide}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
