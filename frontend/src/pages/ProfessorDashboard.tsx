// frontend/src/pages/ProfessorDashboard.tsx

import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Plus, X, Calendar, BookOpen, Eye, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
  qr_code: string | null;
}

interface CourseResponse {
  course_id: string;
  qr_code: string;
  title: string;
}

// Create Course Modal Component (inside same file)
function CreateCourseModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onGenerate: (data: { title: string; description: string; prompt: string }) => Promise<void>;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title || !description || !prompt) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      await onGenerate({ title, description, prompt });
      // Reset form on success
      setTitle('');
      setDescription('');
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate course');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-white">Create New AI Course</h2>
              <p className="text-sm text-slate-400 mt-1">Generate a complete course with AI</p>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Course Title <span className="text-red-400">*</span>
            </label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="e.g. Quantum Mechanics 101"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Short Description <span className="text-red-400">*</span>
            </label>
            <input 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="e.g. Introduction to quantum physics for 2nd year BSc"
              disabled={isLoading}
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              AI Generation Prompt <span className="text-red-400">*</span>
            </label>
            <textarea 
              required
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-slate-500"
              placeholder="e.g. Create a lesson on Quantum Mechanics for 2nd-year BSc Physics in Hindi, focusing on wave-particle duality."
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1">
              💡 Be specific about topics, audience, and format for better results
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading || !title || !description || !prompt}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" /> 
                Generating Course Content...
              </>
            ) : (
              "Generate AI Course & Materials"
            )}
          </button>

          {/* Progress Bar */}
          {isLoading && (
            <div className="mt-2">
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                ⏳ This may take 10-15 seconds depending on the complexity
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ProfessorDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<CourseResponse | null>(null);

  const { isSignedIn, getToken } = useAuth();

  const fetchCourses = async () => {
    setLoadingCourses(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication failed. Please sign in again.');
        setLoadingCourses(false);
        return;
      }

      const res = await apiClient.get('/api/professor/courses', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCourses(res.data);
    } catch (error: any) {
      console.error("Failed to fetch courses:", error?.response?.data || error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to load courses. Please try again.";
      setError(errorMessage);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchCourses();
    }
  }, [isSignedIn]);

  const handleGenerate = async (data: { title: string; description: string; prompt: string }) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication failed. Please sign in again.');
      }

      const res = await apiClient.post('/api/professor/create-course', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCourseData(res.data);
      await fetchCourses();
      setShowCreate(false);
      
    } catch (error: any) {
      console.error("Course generation failed:", error?.response?.data || error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to generate course. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseSuccess = () => {
    setCourseData(null);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/professor/course/${courseId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-white">
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-bold mb-4">Professor Dashboard</h1>
          <p className="text-slate-300">Please sign in with Clerk before creating or viewing courses.</p>
        </div>
      </div>
    );
  }

  // Success State
  if (courseData) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="glass-panel p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-emerald-400">✓</div>
          </div>
          <h2 className="text-3xl font-bold text-emerald-400 mb-4">Course Generated!</h2>
          <p className="text-xl text-white mb-2">{courseData.title}</p>
          <p className="text-slate-300 mb-8">Your AI course has been created successfully.</p>
          
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-white p-4 rounded-xl shadow-2xl mb-4">
              {courseData.qr_code && courseData.qr_code.trim() !== '' ? (
                <img 
                  src={courseData.qr_code} 
                  alt="Course QR Code" 
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400';
                    fallback.textContent = 'QR Code unavailable';
                    (e.target as HTMLImageElement).parentNode?.replaceChild(fallback, e.target as HTMLImageElement);
                  }}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  QR Code unavailable
                </div>
              )}
            </div>
            <p className="text-slate-300">Scan to access the Student Portal</p>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={handleCloseSuccess}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => navigate(`/professor/course/${courseData.course_id}`)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              View Course Details
            </button>
            <button 
              onClick={() => window.open(`/student/course/${courseData.course_id}`, '_blank')}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Open Student View
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Professor Dashboard</h1>
          <p className="text-slate-300 mt-1">Manage your AI-powered courses</p>
        </div>
        {!showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Course
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-sm text-red-300">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-md text-sm text-red-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setError(null);
        }}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
      />

      {/* Course List */}
      {!showCreate && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Your Courses</h2>
            <span className="text-sm text-slate-400">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          </div>

          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-300">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              <p className="text-xl mb-2">No courses created yet</p>
              <p className="text-sm mb-6">Start by creating your first AI-powered course</p>
              <button 
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div 
                  key={course.id} 
                  className="glass-panel p-6 flex flex-col hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer group"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white line-clamp-1 flex-1 group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1 group-hover:text-slate-300 transition-colors">
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center text-xs text-slate-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(course.created_at)}
                    </div>
                    
                    {course.qr_code && course.qr_code.trim() !== '' && (
                      <div className="relative group/qr">
                        <img 
                          src={course.qr_code} 
                          alt={`QR Code for ${course.title}`}
                          className="w-8 h-8 object-contain cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover/qr:block bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          Scan to join
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                    Click to view details →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}