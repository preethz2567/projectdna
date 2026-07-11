import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getInterviewQuestions, generateInterviewQuestions } from '../../api/ai';
import { useState } from 'react';

const CATEGORIES = ['technical', 'architecture', 'database', 'deployment', 'hr', 'viva'];

interface Question {
  id: string; question: string; answer: string; category: string; difficulty: string;
}

export default function InterviewPrep() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('technical');
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: questions = [] } = useQuery({
    queryKey: ['interview', projectId, activeCategory],
    queryFn: () => getInterviewQuestions(projectId!, activeCategory)
  });

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateInterviewQuestions(projectId!, activeCategory);
      qc.invalidateQueries({ queryKey: ['interview', projectId, activeCategory] });
    } finally {
      setGenerating(false);
    }
  }

  const diffColor: Record<string, string> = { easy: 'var(--success)', medium: 'var(--in-progress)', hard: 'var(--error)' };

  return (
    <div>
      <div className="page-header">
        <h2>Interview Preparation</h2>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : `Generate ${activeCategory} questions`}
        </button>
      </div>
      <div className="page-content">
        {/* Category tabs */}
        <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}>
              {cat}
            </button>
          ))}
        </div>

        {questions.length === 0 ? (
          <div className="empty-state">
            <p>No {activeCategory} questions yet. Click Generate to create them.</p>
          </div>
        ) : (
          <div>
            {questions.map((q: Question, i: number) => (
              <div key={q.id} className="card mb-4" style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                <div className="flex-between">
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>Q{i + 1}.</span>
                    {q.question}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: diffColor[q.difficulty] || 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }}>
                    {q.difficulty}
                  </span>
                </div>
                {expanded === q.id && (
                  <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent)', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.6 }}>
                    {q.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
