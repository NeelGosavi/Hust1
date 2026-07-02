// src/api/user.ts
import { apiClient } from './client';

export type UserRole = 'student' | 'professor' | 'hiring';

export const userApi = {
  getMe: (token?: string) =>
    apiClient.get('/user/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
  setRole: (role: UserRole, token?: string) =>
    apiClient.post('/user/role', { role }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
};
