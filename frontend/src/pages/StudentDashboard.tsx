// src/pages/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import { studentApi } from '../api/student';
import { practiceApi } from '../api/practice';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Code,
  Briefcase,
  Award,
  ChevronRight,
  Clock,
  ArrowRight,
  GraduationCap,
  Target,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  totalCourses: number;
  inProgress: number;
  completed: number;
  averageScore: number;
  applications: number;
  recentCourses: Array<{
    id: string;
    title: string;
    progress: number;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    courseName: string;
    dueDate: string;
  }>;
}

interface PracticeStats {
  total: number;
  solved: number;
  attempted: number;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, practiceRes] = await Promise.all([
        studentApi.getDashboardStats(),
        practiceApi.getStats(),
      ]);
      setStats(statsRes.data);
      setPracticeStats(practiceRes.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Good morning, Student</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your learning journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalCourses || 0}</p>
                <p className="text-xs text-gray-400 mt-1">{stats?.inProgress || 0} in progress</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <Link to="/student/my-courses" className="text-xs text-blue-600 hover:text-blue-700 mt-3 inline-block font-medium">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Practice Problems</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{practiceStats?.solved || 0}</p>
                <p className="text-xs text-gray-400 mt-1">{practiceStats?.total || 0} total</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg">
                <Code className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <Link to="/student/practice" className="text-xs text-emerald-600 hover:text-emerald-700 mt-3 inline-block font-medium">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Career Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.applications || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Job applications</p>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <Link to="/student/career" className="text-xs text-purple-600 hover:text-purple-700 mt-3 inline-block font-medium">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.averageScore || 0}%</p>
                <p className="text-xs text-gray-400 mt-1">Across all courses</p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/student/courses" className="group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Browse Courses</h3>
                    <p className="text-sm text-gray-500">Discover new courses</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link to="/student/practice" className="group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <Code className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Practice Hub</h3>
                    <p className="text-sm text-gray-500">Solve problems</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link to="/student/career" className="group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Career Center</h3>
                    <p className="text-sm text-gray-500">Find opportunities</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
              <Link to="/student/my-courses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            {stats?.recentCourses?.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No recent courses</p>
                <Link to="/student/courses" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Browse courses →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentCourses?.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${course.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{course.progress}%</span>
                      </div>
                    </div>
                    <Link to={`/student/course/${course.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            {stats?.upcomingDeadlines?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.upcomingDeadlines?.slice(0, 3).map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="font-medium text-gray-900">{deadline.title}</p>
                      <p className="text-sm text-gray-500">{deadline.courseName}</p>
                    </div>
                    <span className="text-sm text-amber-700 font-medium">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}