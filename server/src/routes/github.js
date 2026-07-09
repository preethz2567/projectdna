const router = require('express').Router({ mergeParams: true });
const axios = require('axios');
const pool = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const ghHeaders = () => ({
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
});

function parseGithubUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2].replace('.git', '') };
}

router.post('/', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { github_url } = req.body;
    const { owner, repo } = parseGithubUrl(github_url);

    const [repoData, readme, contents] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: ghHeaders() })
        .then(r => Buffer.from(r.data.content, 'base64').toString('utf8'))
        .catch(() => ''),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers: ghHeaders() })
        .then(r => r.data.map(f => ({ name: f.name, type: f.type, path: f.path })))
        .catch(() => []),
    ]);

    let techStack = [];
    let dependencies = {};
    try {
      const pkgJson = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers: ghHeaders() });
      const pkg = JSON.parse(Buffer.from(pkgJson.data.content, 'base64').toString('utf8'));
      dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      techStack = ['Node.js', ...Object.keys(dependencies).slice(0, 10)];
    } catch {
      try {
        await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/requirements.txt`, { headers: ghHeaders() });
        techStack = ['Python'];
      } catch {}
    }

    const result = await pool.query(
      `INSERT INTO repositories (project_id, github_url, repo_name, repo_owner, default_branch, readme, folder_structure, tech_stack, dependencies, last_indexed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (project_id) DO UPDATE SET
         readme = EXCLUDED.readme, folder_structure = EXCLUDED.folder_structure,
         tech_stack = EXCLUDED.tech_stack, dependencies = EXCLUDED.dependencies,
         last_indexed_at = NOW()
       RETURNING *`,
      [req.params.projectId, github_url, repo, owner, repoData.data.default_branch, readme, JSON.stringify(contents), JSON.stringify(techStack), JSON.stringify(dependencies)]
    );

    await pool.query(
      'INSERT INTO timeline_events (project_id, event_type, title, description, created_by) VALUES ($1, $2, $3, $4, $5)',
      [req.params.projectId, 'repo_connected', `GitHub repository connected: ${owner}/${repo}`, `Branch: ${repoData.data.default_branch}`, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM repositories WHERE project_id = $1', [req.params.projectId]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
