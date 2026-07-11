import api from './client';

export const register = (data: { email: string; password: string; display_name: string; role?: string }) =>
  api.post('/auth/register', data).then(r => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then(r => r.data);

export const getMe = () => api.get('/auth/me').then(r => r.data);
