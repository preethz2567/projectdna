const router = require('express').Router({ mergeParams: true });
const axios = require('axios');
const pool = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

async function getRepo(projectId) {
    const result = await pool.query('SELECT * FROM repositories WHERE project_id = $1', [projectId]);
    return result.rows[0];
}

// Trigger indexing after repo is connected
router.post('/index', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected' });

        const response = await axios.post(`${AI_URL}/index`, {
            repository_id: repo.id,
            repo_data: {
                readme: repo.readme,
                folder_structure: repo.folder_structure,
                tech_stack: repo.tech_stack,
                dependencies: repo.dependencies,
                vision: req.body.vision || '',
                description: req.body.description || ''
            }
        }, { timeout: 120000 });

        await pool.query(
            'INSERT INTO timeline_events (project_id, event_type, title, description, created_by) VALUES ($1, $2, $3, $4, $5)',
            [req.params.projectId, 'repo_indexed', 'Repository indexed for AI', `${response.data.chunks} chunks indexed`, req.user.id]
        );

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat with the AI about this project
router.post('/chat', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected. Connect a GitHub repo first.' });

        const { message } = req.body;

        const history = await pool.query(
            'SELECT role, content FROM chat_messages WHERE project_id = $1 ORDER BY created_at DESC LIMIT 10',
            [req.params.projectId]
        );

        const response = await axios.post(`${AI_URL}/chat`, {
            repository_id: repo.id,
            message,
            history: history.rows.reverse()
        }, { timeout: 60000 });

        await pool.query(
            'INSERT INTO chat_messages (project_id, user_id, role, content, agent_used) VALUES ($1, $2, $3, $4, $5)',
            [req.params.projectId, req.user.id, 'user', message, 'chat']
        );
        await pool.query(
            'INSERT INTO chat_messages (project_id, user_id, role, content, agent_used) VALUES ($1, $2, $3, $4, $5)',
            [req.params.projectId, req.user.id, 'assistant', response.data.response, 'chat']
        );

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate documentation
router.post('/generate/documentation', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected' });

        const { doc_type = 'overview' } = req.body;

        const response = await axios.post(`${AI_URL}/generate/documentation`, {
            repository_id: repo.id,
            doc_type,
            repo_data: { readme: repo.readme, folder_structure: repo.folder_structure, tech_stack: repo.tech_stack }
        }, { timeout: 90000 });

        const titles = { overview: 'Project Overview', architecture: 'Architecture', api_docs: 'API Documentation', deployment: 'Deployment Guide', readme: 'README' };
        await pool.query(
            `INSERT INTO documents (project_id, doc_type, title, content, generated_by)
             VALUES ($1, $2, $3, $4, 'ai')
             ON CONFLICT (project_id, doc_type) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
            [req.params.projectId, doc_type, titles[doc_type] || doc_type, response.data.content]
        );

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate interview questions
router.post('/generate/interview-questions', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected' });

        const { category = 'technical' } = req.body;

        const response = await axios.post(`${AI_URL}/generate/interview-questions`, {
            repository_id: repo.id,
            category,
            repo_data: { readme: repo.readme, tech_stack: repo.tech_stack }
        }, { timeout: 90000 });

        const questions = response.data.questions || [];
        for (const q of questions) {
            await pool.query(
                'INSERT INTO interview_questions (project_id, question, answer, category, difficulty) VALUES ($1, $2, $3, $4, $5)',
                [req.params.projectId, q.question, q.answer, category, q.difficulty || 'medium']
            );
        }

        res.json({ category, count: questions.length, questions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate improvements
router.post('/generate/improvements', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected' });

        const response = await axios.post(`${AI_URL}/generate/improvements`, {
            repository_id: repo.id,
            repo_data: { readme: repo.readme, folder_structure: repo.folder_structure, tech_stack: repo.tech_stack }
        }, { timeout: 90000 });

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate architecture explanation
router.post('/generate/architecture', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected' });

        const response = await axios.post(`${AI_URL}/generate/architecture`, {
            repository_id: repo.id,
            repo_data: { readme: repo.readme, folder_structure: repo.folder_structure, tech_stack: repo.tech_stack }
        }, { timeout: 90000 });

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all chat history
router.get('/chat/history', authenticate, requireProjectAccess, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM chat_messages WHERE project_id = $1 ORDER BY created_at ASC',
        [req.params.projectId]
    );
    res.json(result.rows);
});

// Get all saved documents
router.get('/documents', authenticate, requireProjectAccess, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM documents WHERE project_id = $1 ORDER BY updated_at DESC',
        [req.params.projectId]
    );
    res.json(result.rows);
});

// Get interview questions (optionally filter by category)
router.get('/interview-questions', authenticate, requireProjectAccess, async (req, res) => {
    const { category } = req.query;
    const result = await pool.query(
        `SELECT * FROM interview_questions WHERE project_id = $1 ${category ? 'AND category = $2' : ''} ORDER BY created_at DESC`,
        category ? [req.params.projectId, category] : [req.params.projectId]
    );
    res.json(result.rows);
});

// Get timeline
router.get('/timeline', authenticate, requireProjectAccess, async (req, res) => {
    const result = await pool.query(
        'SELECT te.*, u.display_name FROM timeline_events te LEFT JOIN users u ON te.created_by = u.id WHERE te.project_id = $1 ORDER BY te.created_at DESC',
        [req.params.projectId]
    );
    res.json(result.rows);
});

// Get feedback
router.get('/feedback', authenticate, requireProjectAccess, async (req, res) => {
    const result = await pool.query(
        'SELECT f.*, u.display_name as author_name FROM feedback f JOIN users u ON f.author_id = u.id WHERE f.project_id = $1 ORDER BY f.created_at DESC',
        [req.params.projectId]
    );
    res.json(result.rows);
});

// Add feedback (mentor only)
router.post('/feedback', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const { category, content } = req.body;
        const result = await pool.query(
            'INSERT INTO feedback (project_id, author_id, category, content) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.params.projectId, req.user.id, category, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add experience log (interview/hackathon memory)
router.post('/experiences', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const { experience_type, company_or_event, date, questions_asked, feedback_received, what_went_wrong } = req.body;
        const result = await pool.query(
            'INSERT INTO experiences (project_id, user_id, experience_type, company_or_event, date, questions_asked, feedback_received, what_went_wrong) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.params.projectId, req.user.id, experience_type, company_or_event, date, JSON.stringify(questions_asked || []), feedback_received, what_went_wrong]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/experiences', authenticate, requireProjectAccess, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM experiences WHERE project_id = $1 ORDER BY created_at DESC',
        [req.params.projectId]
    );
    res.json(result.rows);
});

// Generate revision guide
router.post('/generate/revision', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const repo = await getRepo(req.params.projectId);
        if (!repo) return res.status(404).json({ error: 'No repository connected' });

        // Fetch experiences and questions to include in the revision guide
        const [experiences, questions] = await Promise.all([
            pool.query('SELECT * FROM experiences WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5', [req.params.projectId]),
            pool.query('SELECT question, answer, category FROM interview_questions WHERE project_id = $1 LIMIT 20', [req.params.projectId])
        ]);

        const response = await axios.post(`${AI_URL}/generate/revision`, {
            repository_id: repo.id,
            experiences: experiences.rows,
            questions: questions.rows
        }, { timeout: 90000 });

        await pool.query(
            `INSERT INTO documents (project_id, doc_type, title, content, generated_by)
             VALUES ($1, $2, $3, $4, 'ai')
             ON CONFLICT (project_id, doc_type) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
            [req.params.projectId, 'revision', 'Revision Guide', response.data.guide]
        );

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate project recommendations (uses all user projects, not just one)
router.post('/recommendations', authenticate, async (req, res) => {
    try {
        // Note: this route doesn't use projectId — it uses all user projects
        const projects = await pool.query(
            `SELECT p.title, p.description, r.tech_stack
             FROM projects p
             JOIN project_members pm ON p.id = pm.project_id
             LEFT JOIN repositories r ON r.project_id = p.id
             WHERE pm.user_id = $1`,
            [req.user.id]
        );

        const response = await axios.post(`${AI_URL}/generate/recommendations`, {
            projects: projects.rows
        }, { timeout: 60000 });

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notes CRUD
router.get('/notes', authenticate, requireProjectAccess, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM notes WHERE project_id = $1 ORDER BY updated_at DESC',
    [req.params.projectId]
  );
  res.json(result.rows);
});

router.post('/notes', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { title, content } = req.body;
    const result = await pool.query(
      'INSERT INTO notes (project_id, author_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.projectId, req.user.id, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:noteId', authenticate, requireProjectAccess, async (req, res) => {
  await pool.query('DELETE FROM notes WHERE id = $1 AND project_id = $2', [req.params.noteId, req.params.projectId]);
  res.json({ message: 'Note deleted' });
});

// ── Project Health Score ────────────────────────────────────────────────
// Calculates a 0-100 score based on project completeness signals
router.get('/health-score', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const pid = req.params.projectId;
    const [repo, docs, tasks, feedback, experiences, questions, chunks] = await Promise.all([
      pool.query('SELECT last_indexed_at FROM repositories WHERE project_id = $1', [pid]),
      pool.query('SELECT COUNT(*) FROM documents WHERE project_id = $1', [pid]),
      pool.query('SELECT COUNT(*) FILTER (WHERE status = $2) as done, COUNT(*) as total FROM tasks WHERE project_id = $1', [pid, 'done']),
      pool.query('SELECT COUNT(*) FROM feedback WHERE project_id = $1', [pid]),
      pool.query('SELECT COUNT(*) FROM experiences WHERE project_id = $1', [pid]),
      pool.query('SELECT COUNT(*) FROM interview_questions WHERE project_id = $1', [pid]),
      pool.query('SELECT COUNT(*) FROM repo_chunks WHERE repository_id IN (SELECT id FROM repositories WHERE project_id = $1)', [pid]),
    ]);

    // Score breakdown (each contributes max points)
    const scores = {
      repository: repo.rows[0]?.last_indexed_at ? 20 : 0,           // 20pts: repo connected and indexed
      documentation: Math.min(20, parseInt(docs.rows[0].count) * 4), // 20pts: 5 docs = full score
      tasks: tasks.rows[0].total > 0
        ? Math.min(15, Math.round((parseInt(tasks.rows[0].done) / parseInt(tasks.rows[0].total)) * 15))
        : 0,                                                          // 15pts: task completion rate
      feedback: Math.min(15, parseInt(feedback.rows[0].count) * 5),  // 15pts: 3 feedback items = full
      interview_prep: Math.min(15, parseInt(questions.rows[0].count) * 1), // 15pts: 15 questions = full
      experience_log: Math.min(15, parseInt(experiences.rows[0].count) * 5), // 15pts: 3 experiences = full
    };

    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    res.json({
      score: total,
      breakdown: scores,
      signals: {
        has_repo: !!repo.rows[0]?.last_indexed_at,
        chunks_indexed: parseInt(chunks.rows[0].count),
        docs_generated: parseInt(docs.rows[0].count),
        tasks_done: parseInt(tasks.rows[0].done || 0),
        tasks_total: parseInt(tasks.rows[0].total || 0),
        feedback_count: parseInt(feedback.rows[0].count),
        experience_count: parseInt(experiences.rows[0].count),
        interview_questions: parseInt(questions.rows[0].count),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Smart Diff Analyzer ──────────────────────────────────────────────────
// Re-indexes the repo and asks the AI what changed vs before
router.post('/diff-analyze', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const repo = await getRepo(req.params.projectId);
    if (!repo) return res.status(404).json({ error: 'No repository connected' });

    // Get old chunk count before re-index
    const oldChunks = await pool.query(
      'SELECT COUNT(*) FROM repo_chunks WHERE repository_id = $1',
      [repo.id]
    );
    const oldCount = parseInt(oldChunks.rows[0].count);

    // Re-index (this replaces old chunks with new ones)
    const indexResult = await axios.post(`${AI_URL}/index`, {
      repository_id: repo.id,
      repo_data: {
        readme: repo.readme,
        folder_structure: repo.folder_structure,
        tech_stack: repo.tech_stack,
        dependencies: repo.dependencies,
      }
    }, { timeout: 120000 });

    const newCount = indexResult.data.chunks;

    // Ask AI to explain what likely changed
    const diffResponse = await axios.post(`${AI_URL}/chat`, {
      repository_id: repo.id,
      message: `The repository was just re-indexed. Previously it had ${oldCount} knowledge chunks, now it has ${newCount}. Based on the current project content, summarize what this project contains and what might have changed or been added recently. Focus on architecture, features, and technical decisions.`,
      history: []
    }, { timeout: 60000 });

    // Log timeline event
    await pool.query(
      'INSERT INTO timeline_events (project_id, event_type, title, description, created_by) VALUES ($1, $2, $3, $4, $5)',
      [req.params.projectId, 'diff_analyzed', 'Repository re-indexed and analyzed',
       `Chunks: ${oldCount} → ${newCount}. ${diffResponse.data.response.slice(0, 150)}...`,
       req.user.id]
    );

    res.json({
      old_chunks: oldCount,
      new_chunks: newCount,
      analysis: diffResponse.data.response,
      sources: diffResponse.data.sources
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Chat Memory Compression ──────────────────────────────────────────────
// Summarizes old chat messages to compress context without losing meaning
router.post('/compress-memory', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const repo = await getRepo(req.params.projectId);
    if (!repo) return res.status(404).json({ error: 'No repository connected' });

    // Get all messages older than the last 10
    const allMessages = await pool.query(
      'SELECT role, content, created_at FROM chat_messages WHERE project_id = $1 ORDER BY created_at ASC',
      [req.params.projectId]
    );

    if (allMessages.rows.length < 15) {
      return res.json({ message: 'Not enough messages to compress yet', count: allMessages.rows.length });
    }

    // Compress everything except the last 10 messages
    const toCompress = allMessages.rows.slice(0, -10);
    const conversationText = toCompress.map(m => `${m.role}: ${m.content}`).join('\n\n');

    // Ask AI to summarize
    const summary = await axios.post(`${AI_URL}/chat`, {
      repository_id: repo.id,
      message: `Please create a concise summary of this conversation history about the project. Capture all important technical insights, decisions discussed, and questions answered. This summary will replace the original messages to save space:\n\n${conversationText}`,
      history: []
    }, { timeout: 60000 });

    // Replace old messages with a single summary message
    await pool.query('BEGIN');
    const ids = toCompress.map((_, i) => i + 1);
    await pool.query(
      `DELETE FROM chat_messages WHERE project_id = $1 AND created_at < (
        SELECT created_at FROM chat_messages WHERE project_id = $1
        ORDER BY created_at DESC LIMIT 1 OFFSET 10
      )`,
      [req.params.projectId]
    );
    await pool.query(
      'INSERT INTO chat_messages (project_id, user_id, role, content, agent_used) SELECT $1, $2, $3, $4, $5',
      [req.params.projectId, req.user.id, 'assistant',
       `[MEMORY SUMMARY - ${toCompress.length} messages compressed]\n\n${summary.data.response}`,
       'memory']
    );
    await pool.query('COMMIT');

    res.json({ compressed: toCompress.length, summary: summary.data.response });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ── Diagram generation ───────────────────────────────────────────────────
router.post('/generate/diagram', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const repo = await getRepo(req.params.projectId);
    if (!repo) return res.status(404).json({ error: 'No repository connected' });
    
    const diagram_type = req.body.diagram_type || 'architecture';
    const response = await axios.post(`${AI_URL}/generate/diagram`, {
      repository_id: repo.id,
      diagram_type
    }, { timeout: 60000 });
    
    const diagramCode = response.data.diagram;
    if (diagramCode) {
      await pool.query(
        `INSERT INTO diagrams (project_id, diagram_type, code) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (project_id, diagram_type) DO UPDATE SET code = EXCLUDED.code, updated_at = NOW()`,
        [req.params.projectId, diagram_type, diagramCode]
      );
    }
    
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all saved diagrams
router.get('/diagrams', authenticate, requireProjectAccess, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT diagram_type, code FROM diagrams WHERE project_id = $1',
            [req.params.projectId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Quiz generation ──────────────────────────────────────────────────────
router.post('/generate/quiz', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const repo = await getRepo(req.params.projectId);
    if (!repo) return res.status(404).json({ error: 'No repository connected' });
    const response = await axios.post(`${AI_URL}/generate/quiz`, {
      repository_id: repo.id,
      difficulty: req.body.difficulty || 'medium'
    }, { timeout: 60000 });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Deck generation ──────────────────────────────────────────────────────
router.post('/generate/deck', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const repo = await getRepo(req.params.projectId);
    if (!repo) return res.status(404).json({ error: 'No repository connected' });
    const response = await axios.post(`${AI_URL}/generate/deck`, {
      repository_id: repo.id,
      deck_type: req.body.deck_type || 'technical'
    }, { timeout: 90000 });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
