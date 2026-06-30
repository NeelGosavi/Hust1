// src/pages/ProfessorCourses.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from '../api/client';
import { Loader2, Plus, BookOpen, Eye, ChevronRight, Calendar, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
  qr_code: string | null;
  student_count?: number;
}

export default function ProfessorCourses() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchCourses();
    }
  }, [isSignedIn]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication failed. Please sign in again.');
        setLoading(false);
        return;
      }

      const res = await apiClient.get('/professor/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (error: any) {
      console.error("Failed to fetch courses:", error);
      setError(error?.response?.data?.detail || error?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const token = await getToken();
      await apiClient.delete(`/professor/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
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
          <h1 className="text-3xl font-bold mb-4">My Courses</h1>
          <p className="text-slate-300">Please sign in to view your courses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">My Courses</h1>
          <p className="text-slate-300 mt-1">Manage all your AI-powered courses</p>
        </div>
        <Link
          to="/professor/dashboard"
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Course
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-300">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <p className="text-xl mb-2">No courses created yet</p>
          <p className="text-sm mb-6">Start by creating your first AI-powered course</p>
          <Link
            to="/professor/dashboard"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.id} 
              className="glass-panel p-6 flex flex-col hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer group"
              onClick={() => navigate(`/professor/course/${course.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-white line-clamp-1 flex-1 group-hover:text-indigo-400 transition-colors">
                  {course.title}
                </h3>
                <button
                  onClick={(e) => handleDelete(course.id, e)}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1 group-hover:text-slate-300 transition-colors">
                {course.description || 'No description available'}
              </p>
              
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-700/50">
                <div className="flex items-center text-xs text-slate-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(course.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  {course.student_count !== undefined && (
                    <span className="text-xs text-slate-400">
                      {course.student_count} students
                    </span>
                  )}
                  <Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}