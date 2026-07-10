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

module.exports = router;
