// src/pages/ProfessorPractice.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from '../api/client';
import { Loader2, Plus, Trash2, Edit, Search, X, AlertCircle } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
  acceptanceRate: number;
  created_at: string;
}

export default function ProfessorPractice() {
  const { getToken, isSignedIn } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    topics: [] as string[],
    acceptanceRate: 0,
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchProblems();
    }
  }, [isSignedIn]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiClient.get('/practice/problems', {
        params: { search: search || undefined, limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProblems(res.data);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/practice/problems/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProblems(problems.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem');
    }
  };

  const categories = ['Algorithms', 'Data Structures', 'System Design', 'Behavioral', 'Database'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-white">
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-bold mb-4">Practice Management</h1>
          <p className="text-slate-300">Please sign in to manage practice problems.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Practice Management</h1>
          <p className="text-slate-300 mt-1">Create and manage practice problems</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Problem
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search problems..."
          className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : problems.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-300">
          <p className="text-xl mb-2">No problems created yet</p>
          <p className="text-sm mb-6">Start adding practice problems for your students</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Acceptance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{problem.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{problem.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{problem.acceptanceRate}%</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditingProblem(problem)}
                      className="p-1 text-slate-400 hover:text-blue-400 transition-colors mr-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(problem.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple Create/Edit Modal */}
      {(showCreateModal || editingProblem) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {editingProblem ? 'Edit Problem' : 'Create New Problem'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProblem(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-white"
                  placeholder="Problem title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-white"
                  placeholder="Problem description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {difficulties.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Acceptance Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.acceptanceRate}
                  onChange={(e) => setFormData({ ...formData, acceptanceRate: Number(e.target.value) })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <button
                onClick={() => {
                  // Handle save
                  setShowCreateModal(false);
                  setEditingProblem(null);
                  fetchProblems();
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save Problem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}