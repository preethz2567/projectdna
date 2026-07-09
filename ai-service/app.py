from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'projectdna-ai'})


@app.route('/index', methods=['POST'])
def index_repository():
    """
    Day 2: Will chunk repository content, generate embeddings, store in FAISS
    For now: accepts the payload and returns a placeholder
    """
    data = request.json
    return jsonify({
        'status': 'indexing_queued',
        'repository_id': data.get('repository_id'),
        'message': 'RAG pipeline not yet implemented - Day 2'
    })


@app.route('/chat', methods=['POST'])
def chat():
    """
    Day 2: Will retrieve relevant chunks and call LLM
    """
    data = request.json
    return jsonify({
        'response': f"AI response placeholder for: {data.get('message', '')}",
        'agent': 'general',
        'sources': []
    })


@app.route('/generate/documentation', methods=['POST'])
def generate_docs():
    """Day 2: Documentation Agent"""
    return jsonify({'status': 'not_yet_implemented'})


@app.route('/generate/interview-questions', methods=['POST'])
def generate_interview_questions():
    """Day 2: Interview Agent"""
    return jsonify({'status': 'not_yet_implemented'})


@app.route('/generate/improvements', methods=['POST'])
def generate_improvements():
    """Day 2: Improvement Agent"""
    return jsonify({'status': 'not_yet_implemented'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)), debug=False)
