// src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  // NOTE: don't hard-set Content-Type here. axios auto-sets application/json for
  // object bodies, and for FormData (résumé upload) it must be left unset so the
  // browser adds the multipart boundary. A forced application/json default makes
  // axios serialize FormData to JSON -> the file is dropped -> backend 422.
});

// Response interceptor for error logging. Auth state is owned by Clerk, so we
// don't hard-redirect on 401 (that would full-page reload to the landing page).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);

// Export as both default and named export for compatibility
export default api;
export { api as apiClient };

// Setup interceptors function for Clerk auth
export const setupInterceptors = (fetchToken: () => Promise<string | null>) => {
  const interceptorId = api.interceptors.request.use(
    async (config) => {
      const token = await fetchToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  return interceptorId;
};