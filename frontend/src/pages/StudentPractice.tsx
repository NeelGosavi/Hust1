// src/pages/StudentPractice.tsx
import React, { useState, useEffect } from 'react';
import { practiceApi } from '../api/practice';
import { Link } from 'react-router-dom';
import { Search, Filter, X, CheckCircle, Clock, Circle, ChevronRight, TrendingUp, Tag } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'todo' | 'attempted' | 'solved';
  topics: string[];
  acceptanceRate: number;
}

export default function StudentPractice() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const categories = ['Algorithms', 'Data Structures', 'System Design', 'Behavioral'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const statuses = ['todo', 'attempted', 'solved'];

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedDifficulty, selectedStatus]);

  const fetchData = async () => {
    try {
      const [problemsRes, statsRes] = await Promise.all([
        practiceApi.getProblems({
          search: search || undefined,
          category: selectedCategory || undefined,
          difficulty: selectedDifficulty?.toLowerCase() || undefined,
          limit: 100,
        }),
        practiceApi.getStats(),
      ]);
      setProblems(problemsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching practice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (problemId: string, status: 'todo' | 'attempted' | 'solved') => {
    try {
      await practiceApi.updateProgress(problemId, status);
      fetchData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'attempted': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'solved': return 'Solved';
      case 'attempted': return 'Attempted';
      default: return 'To Do';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedStatus('');
  };

  const hasActiveFilters = search || selectedCategory || selectedDifficulty || selectedStatus;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading practice problems...</div>
      </div>
    );
  }

  const filteredProblems = problems.filter(p => {
    if (selectedStatus && p.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Practice Hub</h1>
          <p className="text-gray-500 mt-1">Master DSA, System Design, and Interview prep</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            <p className="text-sm text-gray-500">Total Problems</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats?.solved || 0}</p>
            <p className="text-sm text-gray-500">Solved</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats?.attempted || 0}</p>
            <p className="text-sm text-gray-500">Attempted</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            >
              <option value="">All Status</option>
              {statuses.map(s => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Problem List */}
        {filteredProblems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No problems found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProblems.map((problem) => (
              <Link to={`/student/practice/${problem.id}`} key={problem.id} className="block">
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(problem.status)}
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {problem.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                          {problem.category}
                        </span>
                        {problem.topics?.slice(0, 2).map(topic => (
                          <span key={topic} className="text-xs text-gray-500 px-2 py-0.5 bg-gray-50 rounded-full">
                            {topic}
                          </span>
                        ))}
                        {problem.topics?.length > 2 && (
                          <span className="text-xs text-gray-400">+{problem.topics.length - 2}</span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {problem.acceptanceRate}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        problem.status === 'solved' ? 'bg-emerald-100 text-emerald-700' :
                        problem.status === 'attempted' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {getStatusLabel(problem.status)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}