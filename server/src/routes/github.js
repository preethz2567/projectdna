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

// ── Extensions and exclusion filters ─────────────────────────────────────

const SOURCE_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c',
  '.cs', '.rb', '.php', '.swift', '.kt', '.vue', '.svelte', '.html', '.css',
  '.scss', '.sql', '.sh', '.yaml', '.yml', '.toml', '.dockerfile',
]);

// Also allow .env.example specifically
function isSourceFile(path) {
  if (path.endsWith('.env.example')) return true;
  const ext = '.' + path.split('.').pop().toLowerCase();
  return SOURCE_EXTENSIONS.has(ext);
}

const EXCLUDED_DIRS = [
  'node_modules/', '.git/', 'dist/', 'build/', '__pycache__/',
  '.next/', 'venv/', 'vendor/', '.venv/', '.tox/', 'coverage/',
];

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2',
  '.ttf', '.eot', '.mp4', '.mp3', '.pdf', '.zip', '.tar', '.gz', '.bz2',
  '.lock', '.map',
]);

function isBinaryFile(path) {
  const ext = '.' + path.split('.').pop().toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function isExcludedPath(path) {
  return EXCLUDED_DIRS.some(dir => path.includes(dir));
}

const MAX_FILE_SIZE = 100000; // 100KB
const MAX_FILES_TO_FETCH = 20;

// ── POST / — Connect repo, fetch tree, fetch source files ────────────────

router.post('/', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { github_url } = req.body;
    const { owner, repo } = parseGithubUrl(github_url);

    // 1. Fetch repo metadata + README in parallel
    const [repoData, readme] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: ghHeaders() })
        .then(r => Buffer.from(r.data.content, 'base64').toString('utf8'))
        .catch(() => ''),
    ]);

    const defaultBranch = repoData.data.default_branch;

    // 2. Get FULL recursive file tree using Git Trees API
    const treeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers: ghHeaders() }
    );

    const rawTree = treeResponse.data.tree || [];
    console.log(`[github] Tree API returned ${rawTree.length} items (truncated: ${treeResponse.data.truncated})`);

    const allTreeFiles = rawTree.filter(f => f.type === 'blob');
    console.log(`[github] Blob files in tree: ${allTreeFiles.length}`);

    // 3. Filter for source code files
    const sourceFiles = allTreeFiles.filter(f =>
      isSourceFile(f.path) &&
      !isExcludedPath(f.path) &&
      !isBinaryFile(f.path) &&
      (f.size || 0) <= MAX_FILE_SIZE
    );
    console.log(`[github] Source files after filter: ${sourceFiles.length}`);
    if (sourceFiles.length > 0) {
      console.log(`[github] First 5 source files:`, sourceFiles.slice(0, 5).map(f => f.path));
    }

    // 4. Sort by size ascending (smaller = configs, entry points, key modules first)
    sourceFiles.sort((a, b) => (a.size || 0) - (b.size || 0));

    // 5. Pick top N files to fetch content for
    const filesToFetch = sourceFiles.slice(0, MAX_FILES_TO_FETCH);
    const remainingFiles = sourceFiles.slice(MAX_FILES_TO_FETCH);

    // 6. Fetch all file contents in parallel
    const fileContents = await Promise.all(
      filesToFetch.map(f =>
        axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(f.path)}`,
          { headers: ghHeaders() }
        )
          .then(r => ({
            name: f.path.split('/').pop(),
            type: 'file',
            path: f.path,
            size: f.size,
            content: Buffer.from(r.data.content, 'base64').toString('utf8'),
          }))
          .catch(() => ({
            name: f.path.split('/').pop(),
            type: 'file',
            path: f.path,
            size: f.size,
            // No content — fetch failed, skip silently
          }))
      )
    );

    // 7. Build folder_structure array: fetched files (with content) + remaining (without)
    const folderStructure = [
      ...fileContents,
      ...remainingFiles.map(f => ({
        name: f.path.split('/').pop(),
        type: 'file',
        path: f.path,
        size: f.size,
      })),
    ];

    // 8. Smart tech stack detection
    let techStack = [];
    let dependencies = {};
    const allPaths = allTreeFiles.map(f => f.path);

    // Check for known config files
    const techDetectors = [
      { file: 'package.json', tech: 'Node.js', parser: async () => {
        try {
          const r = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers: ghHeaders() });
          const pkg = JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8'));
          dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
          return ['Node.js', ...Object.keys(dependencies).slice(0, 10)];
        } catch { return ['Node.js']; }
      }},
      { file: 'requirements.txt', tech: 'Python' },
      { file: 'pom.xml', tech: 'Java (Maven)' },
      { file: 'go.mod', tech: 'Go' },
      { file: 'Cargo.toml', tech: 'Rust' },
      { file: 'Gemfile', tech: 'Ruby' },
      { file: 'composer.json', tech: 'PHP' },
      { file: 'build.gradle', tech: 'Kotlin/Java (Gradle)' },
    ];

    for (const detector of techDetectors) {
      if (allPaths.includes(detector.file)) {
        if (detector.parser) {
          const stack = await detector.parser();
          techStack.push(...stack);
        } else {
          techStack.push(detector.tech);
        }
      }
    }

    // Fallback: detect from file extensions
    if (techStack.length === 0) {
      const extCounts = {};
      allTreeFiles.forEach(f => {
        const ext = '.' + f.path.split('.').pop().toLowerCase();
        if (SOURCE_EXTENSIONS.has(ext)) {
          extCounts[ext] = (extCounts[ext] || 0) + 1;
        }
      });
      const extMap = {
        '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
        '.java': 'Java', '.go': 'Go', '.rs': 'Rust', '.rb': 'Ruby',
        '.php': 'PHP', '.swift': 'Swift', '.kt': 'Kotlin',
        '.cpp': 'C++', '.c': 'C', '.cs': 'C#',
      };
      Object.entries(extCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([ext]) => {
          if (extMap[ext]) techStack.push(extMap[ext]);
        });
    }

    // 9. Persist to DB
    const result = await pool.query(
      `INSERT INTO repositories (project_id, github_url, repo_name, repo_owner, default_branch, readme, folder_structure, tech_stack, dependencies, last_indexed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (project_id) DO UPDATE SET
         readme = EXCLUDED.readme, folder_structure = EXCLUDED.folder_structure,
         tech_stack = EXCLUDED.tech_stack, dependencies = EXCLUDED.dependencies,
         last_indexed_at = NOW()
       RETURNING *`,
      [req.params.projectId, github_url, repo, owner, defaultBranch, readme,
       JSON.stringify(folderStructure), JSON.stringify(techStack), JSON.stringify(dependencies)]
    );

    // 10. Timeline event
    const indexedCount = fileContents.filter(f => f.content).length;
    await pool.query(
      'INSERT INTO timeline_events (project_id, event_type, title, description, created_by) VALUES ($1, $2, $3, $4, $5)',
      [req.params.projectId, 'repo_connected',
       `GitHub repository connected: ${owner}/${repo}`,
       `Branch: ${defaultBranch} | ${allTreeFiles.length} files in tree | ${indexedCount} source files fetched`,
       req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GitHub connect error:', err.message);
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
