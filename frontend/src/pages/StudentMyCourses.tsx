// src/pages/StudentMyCourses.tsx
import React, { useState, useEffect } from 'react';
import { studentApi } from '../api/student';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, ArrowRight, ChevronRight, GraduationCap } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  instructor: {
    name: string;
    avatar?: string;
  };
  lastAccessed: string;
  totalLessons: number;
  completedLessons: number;
}

export default function StudentMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await studentApi.getMyCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'in-progress') return course.progress < 100;
    if (activeFilter === 'completed') return course.progress >= 100;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1">{courses.length} courses enrolled</p>
          </div>
          <Link
            to="/student/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Browse More Courses
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'in-progress', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'in-progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No courses found</p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                View all courses
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={`/student/course/${course.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>{course.instructor?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                      {course.lastAccessed && (
                        <>
                          <span>•</span>
                          <span>Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{Math.round(course.progress)}%</span>
                      {course.progress >= 100 && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          course.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, course.progress)}%` }}
                      />
                    </div>
                    <Link
                      to={`/student/course/${course.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {course.progress >= 100 ? 'Review' : 'Continue'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}