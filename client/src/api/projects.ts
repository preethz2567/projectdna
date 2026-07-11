import api from './client';

export const createProject = (data: { title: string; description: string; vision: string }) =>
  api.post('/projects', data).then(r => r.data);

export const listProjects = () => api.get('/projects').then(r => r.data);

export const getProject = (id: string) => api.get(`/projects/${id}`).then(r => r.data);

export const connectRepo = (projectId: string, github_url: string) =>
  api.post(`/projects/${projectId}/repository`, { github_url }).then(r => r.data);

export const getRepo = (projectId: string) =>
  api.get(`/projects/${projectId}/repository`).then(r => r.data);

export const getTasks = (projectId: string) =>
  api.get(`/projects/${projectId}/tasks`).then(r => r.data);

export const createTask = (projectId: string, data: object) =>
  api.post(`/projects/${projectId}/tasks`, data).then(r => r.data);

export const updateTask = (projectId: string, taskId: string, data: object) =>
  api.patch(`/projects/${projectId}/tasks/${taskId}`, data).then(r => r.data);

export const deleteTask = (projectId: string, taskId: string) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}`).then(r => r.data);

export const inviteMember = (projectId: string, email: string, role: string) =>
  api.post(`/projects/${projectId}/members`, { email, role }).then(r => r.data);
