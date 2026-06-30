// src/api/career.ts
import { apiClient } from './client';

export const careerApi = {
  getJobs: (params?: { search?: string; limit?: number }) =>
    apiClient.get('/career/jobs', { params }),
  
  getJob: (id: string) =>
    apiClient.get(`/career/jobs/${id}`),
  
  uploadResume: (file: File) => {
    const formData = new FormData();
    // Try both field names - backend will pick the one it expects
    formData.append('file', file);
    formData.append('resume', file);
    
    return apiClient.post('/career/upload-resume', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  analyzeSkills: (resumeText: string, jobId: string) =>
    apiClient.post('/career/analyze-skills', { resume_text: resumeText, job_id: jobId }),
  
  apply: (jobId: string, resumeText: string) =>
    apiClient.post('/career/apply', { job_id: jobId, resume_text: resumeText }),
  
  getApplications: () =>
    apiClient.get('/career/applications'),
  
  getApplicants: (jobId: string) =>
    apiClient.get(`/career/jobs/${jobId}/applicants`),
  
  updateApplicationStatus: (applicationId: string, status: string) =>
    apiClient.put(`/career/applications/${applicationId}/status`, { status }),
  
  createJob: (data: any) =>
    apiClient.post('/career/jobs', data),
  
  deleteJob: (id: string) =>
    apiClient.delete(`/career/jobs/${id}`),
};