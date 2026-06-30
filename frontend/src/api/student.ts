// src/api/student.ts
import { apiClient } from './client';

export const studentApi = {
  // Dashboard
  getDashboardStats: () => 
    apiClient.get('/student/dashboard/stats'),

  // Course Browsing - Fixed to accept all parameters
  browseCourses: (params?: { 
    search?: string; 
    limit?: number;
    category?: string;
    difficulty?: string;
  }) =>
    apiClient.get('/student/courses', { params }),
  
  getMyCourses: () =>
    apiClient.get('/student/my-courses'),
  
  enrollInCourse: (courseId: string) =>
    apiClient.post(`/student/enroll/${courseId}`),
  
  getCourse: (courseId: string) =>
    apiClient.get(`/student/course/${courseId}`),
  
  // AI Tutor
  sendTutorMessage: (courseId: string, message: string) =>
    apiClient.post(`/student/course/${courseId}/chat`, { message }),
  
  getTutorConversation: (courseId: string) =>
    apiClient.get(`/student/course/${courseId}/chat`),
  
  // Quiz
  submitQuiz: (courseId: string, answers: string[]) =>
    apiClient.post(`/student/course/${courseId}/quiz/submit`, { answers }),
};