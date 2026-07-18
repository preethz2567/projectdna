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



  return (
    <div>
      <div className="page-header" style={{ padding: '32px 48px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
          <span>Workspace</span>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>Interview Prep</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : `Generate ${activeCategory} questions`}
        </button>
      </div>
      <div className="page-content" style={{ paddingTop: 0 }}>
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
            {questions.map((q: Question, i: number) => {
              const diffColor: Record<string, string> = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };
              const color = diffColor[q.difficulty] || 'var(--border)';
              return (
              <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, padding: '24px', marginBottom: '16px', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 12, fontFamily: 'var(--font-mono)' }}>Q{i + 1}.</span>
                    {q.question}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color, flexShrink: 0, marginLeft: 16 }}>
                    {q.difficulty}
                  </span>
                </div>
                {expanded === q.id && (
                  <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {q.answer}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
