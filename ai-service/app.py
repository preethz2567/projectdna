from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


def get_db():
    return psycopg2.connect(os.getenv('DATABASE_URL'))


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'projectdna-ai'})


# Indexing
@app.route('/index', methods=['POST'])
def index_repository():
    """
    Called by the Node backend after a repo is connected.
    Fetches full repo data from DB, chunks it, embeds it, stores in FAISS.
    """
    try:
        from rag import index_repository as do_index
        data = request.json
        repository_id = data.get('repository_id')
        repo_data = data.get('repo_data', {})

        count = do_index(repository_id, repo_data)

        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE repositories SET last_indexed_at = NOW() WHERE id = %s', (repository_id,))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({'status': 'indexed', 'chunks': count, 'repository_id': repository_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Chat
@app.route('/chat', methods=['POST'])
def chat():
    """General chat agent — answers any question about the project."""
    try:
        from agents import chat_agent
        data = request.json
        result = chat_agent(
            repository_id=data['repository_id'],
            question=data['message'],
            chat_history=data.get('history', [])
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Documentation Agent
@app.route('/generate/documentation', methods=['POST'])
def generate_docs():
    """Generates a specific doc section and returns it."""
    try:
        from agents import documentation_agent
        data = request.json
        result = documentation_agent(
            repository_id=data['repository_id'],
            doc_type=data.get('doc_type', 'overview'),
            repo_data=data.get('repo_data', {})
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Interview Agent
@app.route('/generate/interview-questions', methods=['POST'])
def generate_interview_questions():
    """Generates interview Q&A for a specific category."""
    try:
        from agents import interview_agent
        data = request.json
        result = interview_agent(
            repository_id=data['repository_id'],
            category=data.get('category', 'technical'),
            repo_data=data.get('repo_data', {})
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Improvement Agent
@app.route('/generate/improvements', methods=['POST'])
def generate_improvements():
    """Analyzes project and returns improvement suggestions."""
    try:
        from agents import improvement_agent
        data = request.json
        result = improvement_agent(
            repository_id=data['repository_id'],
            repo_data=data.get('repo_data', {})
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Architecture Agent
@app.route('/generate/architecture', methods=['POST'])
def generate_architecture():
    """Generates deep architectural explanation."""
    try:
        from agents import architecture_agent
        data = request.json
        result = architecture_agent(
            repository_id=data['repository_id'],
            repo_data=data.get('repo_data', {})
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/generate/revision', methods=['POST'])
def generate_revision():
    try:
        from agents import revision_agent
        data = request.json
        result = revision_agent(
            repository_id=data['repository_id'],
            experiences=data.get('experiences', []),
            questions=data.get('questions', [])
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate/recommendations', methods=['POST'])
def generate_recommendations():
    try:
        from agents import recommendations_agent
        data = request.json
        result = recommendations_agent(user_projects=data.get('projects', []))
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)), debug=False)
