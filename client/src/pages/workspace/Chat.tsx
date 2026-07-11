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

        <form className="chat-input-bar" onSubmit={handleSend}>
          <textarea className="chat-input" rows={2} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            placeholder="Ask about your project... (Enter to send, Shift+Enter for new line)" />
          <button className="btn btn-primary" type="submit" disabled={sending || !input.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
