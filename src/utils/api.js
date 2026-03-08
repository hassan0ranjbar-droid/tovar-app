import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from './config';

export async function apiRequest(method, path, body = null, multipart = false) {
  const token = await AsyncStorage.getItem('token');
  const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
  if (!multipart && body) headers['Content-Type'] = 'application/json';
  const options = { method, headers };
  if (body) options.body = multipart ? body : JSON.stringify(body);
  const response = await fetch(`${SERVER_URL}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'خطای سرور');
  return data;
}

export const api = {
  login: (username, password) => apiRequest('POST', '/api/login', { username, password }),
  logout: () => apiRequest('POST', '/api/logout'),
  getGroups: () => apiRequest('GET', '/api/groups'),
  getUsers: () => apiRequest('GET', '/api/users'),
  getMessages: (groupId, toUserId) => {
    if (groupId) return apiRequest('GET', `/api/messages?groupId=${groupId}`);
    if (toUserId) return apiRequest('GET', `/api/messages?toUserId=${toUserId}`);
  },
  sendMessage: (data) => apiRequest('POST', '/api/messages', data),
  sendFile: (formData) => apiRequest('POST', '/api/messages', formData, true),
  editMessage: (msgId, text) => apiRequest('PATCH', `/api/messages/${msgId}`, { text }),
  deleteMessage: (msgId) => apiRequest('DELETE', `/api/messages/${msgId}`),
  markRead: (msgId) => apiRequest('POST', `/api/messages/${msgId}/read`),
  createGroup: (data) => apiRequest('POST', '/api/groups', data),
  createUser: (data) => apiRequest('POST', '/api/users', data),
  deleteUser: (userId) => apiRequest('DELETE', `/api/users/${userId}`),
  changePassword: (old, newP) => apiRequest('POST', '/api/change-password', { oldPassword: old, newPassword: newP }),
  getPins: (chatId) => apiRequest('GET', `/api/pin/${chatId}`),
  pinMessage: (chatId, messageId) => apiRequest('POST', `/api/pin/${chatId}`, { messageId }),
  unpinMessage: (chatId, msgId) => apiRequest('DELETE', `/api/pin/${chatId}?msgId=${msgId}`),
};
