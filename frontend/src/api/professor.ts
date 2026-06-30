// src/api/professor.ts
import { apiClient } from './client';

export const professorApi = {
  getCourses: () =>
    apiClient.get('/professor/courses'),
  
  createCourse: (data: any) =>
    apiClient.post('/professor/create-course', data),
  
  getCourse: (id: string) =>
    apiClient.get(`/professor/courses/${id}`),
  
  getQRCode: (id: string) =>
    apiClient.get(`/professor/courses/${id}/qr`),
  
  deleteCourse: (id: string) =>
    apiClient.delete(`/professor/courses/${id}`),
};