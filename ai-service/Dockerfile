FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model so it's baked into the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Create the data directory for FAISS indexes
RUN mkdir -p /tmp/faiss

COPY . .

EXPOSE 5001
ENV PORT=5001

CMD ["python", "app.py"]