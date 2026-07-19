import api from './client';

export const getNotifications = () =>
  api.get('/notifications').then(r => r.data);

export const markNotificationRead = (id: string) =>
  api.post(`/notifications/${id}/read`).then(r => r.data);
