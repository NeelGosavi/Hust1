// src/api/practice.ts
import { apiClient } from './client';

export const practiceApi = {
  getProblems: (params?: {
    category?: string;
    difficulty?: string;
    topic?: string;
    search?: string;
    limit?: number;
  }) =>
    apiClient.get('/practice/problems', { params }),
  
  getProblem: (id: string) =>
    apiClient.get(`/practice/problems/${id}`),
  
  updateProgress: (id: string, status: 'todo' | 'attempted' | 'solved') =>
    apiClient.put(`/practice/problems/${id}/progress`, { status }),
  
  getStats: () =>
    apiClient.get('/practice/stats'),
  
  // Professor only
  createProblem: (data: any) =>
    apiClient.post('/practice/problems', data),
  
  deleteProblem: (id: string) =>
    apiClient.delete(`/practice/problems/${id}`),
};