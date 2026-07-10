from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json
import os
import psycopg2
from datetime import datetime

EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
model = SentenceTransformer(EMBEDDING_MODEL)

FAISS_DIR = os.getenv('FAISS_INDEX_PATH', './data')
os.makedirs(FAISS_DIR, exist_ok=True)


def get_db():
    return psycopg2.connect(os.getenv('DATABASE_URL'))


def chunk_repository(repo_data: dict) -> list[dict]:
    """
    Takes raw repository data and returns a list of text chunks with metadata.
    Each chunk is a dict: { content, chunk_type, file_path }
    Strategy: chunk by logical section, not by fixed token count.
    This gives the retriever more meaningful units to work with.
    """
    chunks = []

    readme = repo_data.get('readme', '')
    if readme:
        sections = readme.split('\n## ')
        for i, section in enumerate(sections):
            if section.strip():
                chunks.append({
                    'content': section.strip()[:2000],
                    'chunk_type': 'readme',
                    'file_path': 'README.md'
                })

    folder_structure = repo_data.get('folder_structure', [])
    if folder_structure:
        structure_text = "Project folder structure:\n"
        for item in folder_structure[:50]:
            structure_text += f"- {item.get('type', 'file')}: {item.get('path', item.get('name', ''))}\n"
        chunks.append({
            'content': structure_text,
            'chunk_type': 'structure',
            'file_path': 'root'
        })

    tech_stack = repo_data.get('tech_stack', [])
    if tech_stack:
        chunks.append({
            'content': f"Technology stack: {', '.join(tech_stack if isinstance(tech_stack, list) else [])}",
            'chunk_type': 'config',
            'file_path': 'package.json / requirements.txt'
        })

    dependencies = repo_data.get('dependencies', {})
    if dependencies:
        dep_text = "Dependencies:\n"
        for name, version in (dependencies.items() if isinstance(dependencies, dict) else {}.items()):
            dep_text += f"- {name}: {version}\n"
        chunks.append({
            'content': dep_text[:2000],
            'chunk_type': 'config',
            'file_path': 'package.json / requirements.txt'
        })

    vision = repo_data.get('vision', '')
    description = repo_data.get('description', '')
    if vision or description:
        chunks.append({
            'content': f"Project vision: {vision}\nProject description: {description}",
            'chunk_type': 'docs',
            'file_path': 'project_metadata'
        })

    return chunks


def index_repository(repository_id: str, repo_data: dict) -> int:
    """
    Full indexing pipeline:
    1. Chunk the repository content
    2. Generate embeddings for each chunk
    3. Store in FAISS index on disk
    4. Save chunk metadata to PostgreSQL repo_chunks table
    Returns number of chunks indexed.
    """
    chunks = chunk_repository(repo_data)
    if not chunks:
        return 0

    texts = [c['content'] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings).astype('float32')

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    index_path = os.path.join(FAISS_DIR, f'faiss_{repository_id}.index')
    faiss.write_index(index, index_path)

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('DELETE FROM repo_chunks WHERE repository_id = %s', (repository_id,))
        for i, chunk in enumerate(chunks):
            cur.execute(
                '''INSERT INTO repo_chunks (repository_id, content, chunk_type, file_path, embedding_id)
                   VALUES (%s, %s, %s, %s, %s)''',
                (repository_id, chunk['content'], chunk['chunk_type'], chunk['file_path'], str(i))
            )
        conn.commit()
    finally:
        cur.close()
        conn.close()

    return len(chunks)


def retrieve(repository_id: str, query: str, top_k: int = 4) -> list[dict]:
    """
    Given a query string, find the top_k most relevant chunks from the repository.
    Returns list of chunk dicts with content and metadata.
    """
    index_path = os.path.join(FAISS_DIR, f'faiss_{repository_id}.index')
    if not os.path.exists(index_path):
        return []

    index = faiss.read_index(index_path)

    query_embedding = model.encode([query], show_progress_bar=False)
    query_embedding = np.array(query_embedding).astype('float32')

    distances, indices = index.search(query_embedding, top_k)

    conn = get_db()
    cur = conn.cursor()
    try:
        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1:
                continue
            cur.execute(
                '''SELECT content, chunk_type, file_path
                   FROM repo_chunks
                   WHERE repository_id = %s AND embedding_id = %s''',
                (repository_id, str(idx))
            )
            row = cur.fetchone()
            if row:
                results.append({
                    'content': row[0],
                    'chunk_type': row[1],
                    'file_path': row[2],
                    'distance': float(distances[0][i])
                })
        return results
    finally:
        cur.close()
        conn.close()
