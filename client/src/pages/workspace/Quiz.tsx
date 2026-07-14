import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { generateQuiz } from '../../api/ai';

interface Question {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export default function Quiz() {
  const { projectId } = useParams<{ projectId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // Flashcard state
  const [activeQuestion, setActiveQuestion] = useState(0);

  async function handleGenerate() {
    setLoading(true);
    setAnswers({});
    setRevealed({});
    setScore(null);
    setActiveQuestion(0);
    try {
      const r = await generateQuiz(projectId!, difficulty);
      setQuestions(r.questions || []);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(qIdx: number, option: string) {
    if (revealed[qIdx]) return;
    setAnswers(prev => ({ ...prev, [qIdx]: option }));
    setRevealed(prev => ({ ...prev, [qIdx]: true }));
  }

  function calculateScore() {
    const correct = questions.filter((q, i) => answers[i]?.startsWith(q.correct)).length;
    setScore(correct);
  }

  const q = questions[activeQuestion];
  const userAnswer = answers[activeQuestion];
  const isRevealed = revealed[activeQuestion];
  
  let isCorrect = false;
  if (isRevealed && q) {
    const letter = userAnswer.charAt(0);
    isCorrect = letter === q.correct;
  }

  return (
    <div>
      <div className="page-header" style={{ padding: '32px 48px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
          <span>Workspace</span>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>Knowledge Quiz</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : '⚡ Generate quiz'}
          </button>
        </div>
      </div>
      
      <div className="page-content" style={{ paddingTop: 0 }}>
        {score !== null && (
          <div style={{ padding: '24px', marginBottom: 24, background: score >= 6 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${score >= 6 ? '#10b981' : '#ef4444'}`, borderLeft: `4px solid ${score >= 6 ? '#10b981' : '#ef4444'}`, fontSize: 16, fontWeight: 500 }}>
            Score: {score}/{questions.length} — {score >= 6 ? '🎉 Great job! You know this project inside out.' : score >= 4 ? '📚 Keep studying! You missed a few key details.' : '💡 Please review the project documentation.'}
          </div>
        )}

        {loading && <div className="loading">Generating quiz questions from your project...</div>}

        {!loading && q && score === null && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>QUESTION {activeQuestion + 1} OF {questions.length}</span>
            </div>
            
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)', padding: '32px', marginBottom: '24px' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 32, lineHeight: 1.5 }}>
                {q.question}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {q.options.map((opt) => {
                  const letter = opt.charAt(0);
                  const isOptCorrect = letter === q.correct;
                  const isSelected = userAnswer === opt;
                  
                  let bg = 'var(--bg)';
                  let borderColor = 'var(--border)';
                  let textColor = 'var(--text)';
                  
                  if (isRevealed) {
                    if (isOptCorrect) { bg = '#ecfdf5'; borderColor = '#10b981'; textColor = '#065f46'; }
                    else if (isSelected) { bg = '#fef2f2'; borderColor = '#ef4444'; textColor = '#991b1b'; }
                  }
                  
                  return (
                    <div key={opt}
                      onClick={() => handleAnswer(activeQuestion, opt)}
                      style={{
                        padding: '16px 20px', border: `1px solid ${borderColor}`,
                        background: bg, color: textColor, cursor: isRevealed ? 'default' : 'pointer',
                        fontSize: 14, transition: 'all 0.1s', display: 'flex', justifyContent: 'space-between'
                      }}>
                      <span>{opt}</span>
                      {isRevealed && isOptCorrect && <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Correct</span>}
                      {isRevealed && isSelected && !isOptCorrect && <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ Incorrect</span>}
                    </div>
                  );
                })}
              </div>
              
              {isRevealed && (
                <div style={{ marginTop: 24, padding: '20px', background: isCorrect ? '#ecfdf5' : '#fef2f2', border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isCorrect ? '#065f46' : '#991b1b', marginBottom: 8 }}>
                    {isCorrect ? 'Awesome!' : 'Not quite.'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>

            {isRevealed && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {activeQuestion < questions.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => setActiveQuestion(a => a + 1)}>
                    Next Question →
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={calculateScore}>
                    See Final Score 🎉
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {questions.length === 0 && !loading && (
          <div className="empty-state">
            <p>Generate a quiz to test your knowledge of this project</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Questions are generated specifically from your codebase.</p>
          </div>
        )}
      </div>
    </div>
  );
}
