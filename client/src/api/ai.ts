import api from './client';

const base = (projectId: string) => `/projects/${projectId}/ai`;

export const indexRepo = (projectId: string) =>
  api.post(`${base(projectId)}/index`, {}).then(r => r.data);

export const sendChat = (projectId: string, message: string) =>
  api.post(`${base(projectId)}/chat`, { message }).then(r => r.data);

export const getChatHistory = (projectId: string) =>
  api.get(`${base(projectId)}/chat/history`).then(r => r.data);

export const generateDoc = (projectId: string, doc_type: string) =>
  api.post(`${base(projectId)}/generate/documentation`, { doc_type }).then(r => r.data);

export const getDocuments = (projectId: string) =>
  api.get(`${base(projectId)}/documents`).then(r => r.data);

export const generateInterviewQuestions = (projectId: string, category: string) =>
  api.post(`${base(projectId)}/generate/interview-questions`, { category }).then(r => r.data);

export const getInterviewQuestions = (projectId: string, category?: string) =>
  api.get(`${base(projectId)}/interview-questions${category ? `?category=${category}` : ''}`).then(r => r.data);

export const generateImprovements = (projectId: string) =>
  api.post(`${base(projectId)}/generate/improvements`, {}).then(r => r.data);

export const generateArchitecture = (projectId: string) =>
  api.post(`${base(projectId)}/generate/architecture`, {}).then(r => r.data);

export const getTimeline = (projectId: string) =>
  api.get(`${base(projectId)}/timeline`).then(r => r.data);

export const getFeedback = (projectId: string) =>
  api.get(`${base(projectId)}/feedback`).then(r => r.data);

export const addFeedback = (projectId: string, data: object) =>
  api.post(`${base(projectId)}/feedback`, data).then(r => r.data);

export const getExperiences = (projectId: string) =>
  api.get(`${base(projectId)}/experiences`).then(r => r.data);

export const addExperience = (projectId: string, data: object) =>
  api.post(`${base(projectId)}/experiences`, data).then(r => r.data);

export const generateRevision = (projectId: string) =>
  api.post(`${base(projectId)}/generate/revision`, {}).then(r => r.data);

export const generateRecommendations = (projectId: string) =>
  api.post(`${base(projectId)}/ai/recommendations`, {}).then(r => r.data);

export const generateImprovements2 = (projectId: string) =>
  api.post(`${base(projectId)}/generate/improvements`, {}).then(r => r.data);

export const generateDiagram = (projectId: string, diagram_type: string) =>
  api.post(`${base(projectId)}/generate/diagram`, { diagram_type }).then(r => r.data);

export const getDiagrams = (projectId: string) =>
  api.get(`${base(projectId)}/diagrams`).then(r => r.data);

export const generateQuiz = (projectId: string, difficulty: string) =>
  api.post(`${base(projectId)}/generate/quiz`, { difficulty }).then(r => r.data);

export const generateDeck = (projectId: string, deck_type: string) =>
  api.post(`${base(projectId)}/generate/deck`, { deck_type }).then(r => r.data);

export const getHealthScore = (projectId: string) =>
  api.get(`${base(projectId)}/health-score`).then(r => r.data);

export const diffAnalyze = (projectId: string) =>
  api.post(`${base(projectId)}/diff-analyze`, {}).then(r => r.data);

export const compressMemory = (projectId: string) =>
  api.post(`${base(projectId)}/compress-memory`, {}).then(r => r.data);
