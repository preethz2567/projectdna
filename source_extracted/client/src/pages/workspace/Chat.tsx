import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatHistory, sendChat } from '../../api/ai';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string; role: 'user' | 'assistant'; content: string; created_at: string;
}

export default function Chat() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sources, setSources] = useState<{ file: string; type: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat', projectId],
    queryFn: () => getChatHistory(projectId!)
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const r = await sendChat(projectId!, input);
      setSources(r.sources || []);
      qc.invalidateQueries({ queryKey: ['chat', projectId] });
      setInput('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>AI Chat</h2>
        {sources.length > 0 && (
          <div className="chat-sources">
            Sources: {sources.map(s => s.file).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
          </div>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Ask anything about your project.</p>
              <p style={{ marginTop: 8, fontSize: 12 }}>Try: "Explain the architecture", "What auth method is used?", "How is the database structured?"</p>
            </div>
          )}
          {messages.map((m: Message) => (
            <div key={m.id} className={`chat-message ${m.role}`}>
              <div className={`chat-bubble ${m.role}`}>{m.content}</div>
              <div className="chat-sources">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
          {sending && (
            <div className="chat-message assistant">
              <div className="chat-bubble assistant" style={{ color: 'var(--text-muted)' }}>Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <form onSubmit={handleSend} style={{ width: '100%', maxWidth: 800, position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
              placeholder="Ask anything about the codebase..."
              style={{ width: '100%', minHeight: 80, maxHeight: 300, resize: 'vertical', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font-sans)', padding: 0, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ENTER TO SEND • SHIFT+ENTER FOR NEW LINE</div>
              <button 
                type="submit" 
                disabled={sending || !input.trim()}
                style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 24px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !input.trim()) ? 0.5 : 1, transition: 'opacity 0.2s' }}
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
