// src/components/professor/ProblemManager.tsx
import React, { useState, useEffect } from 'react';
import { practiceApi } from '../../api/practice';
import { Plus, Trash2, Edit, Search, Filter, X } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
  acceptanceRate: number;
  createdAt: string;
}

interface ProblemManagerProps {
  className?: string;
}

export function ProblemManager({ className = '' }: ProblemManagerProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
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
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await practiceApi.getProblems({
        search: search || undefined,
        difficulty: filterDifficulty || undefined,
        category: filterCategory || undefined,
        limit: 100
      });
      setProblems(response.data);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filterDifficulty, filterCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      await practiceApi.deleteProblem(id);
      setProblems(problems.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem. Please try again.');
    }
  };

  const handleCreate = async () => {
    try {
      const response = await practiceApi.createProblem(formData);
      setProblems([response.data, ...problems]);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: 'Easy',
        topics: [],
        acceptanceRate: 0,
      });
    } catch (error) {
      console.error('Error creating problem:', error);
      alert('Failed to create problem. Please try again.');
    }
  };

  const handleEdit = async () => {
    if (!editingProblem) return;
    try {
      // In a real app, you'd have a PUT endpoint
      // For now, we'll just update the local state
      const updated = problems.map(p => 
        p.id === editingProblem.id ? { ...p, ...formData } : p
      );
      setProblems(updated);
      setEditingProblem(null);
    } catch (error) {
      console.error('Error updating problem:', error);
      alert('Failed to update problem. Please try again.');
    }
  };

  const openEditModal = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      description: problem.description,
      category: problem.category,
      difficulty: problem.difficulty,
      topics: problem.topics,
      acceptanceRate: problem.acceptanceRate,
    });
  };

  const categories = ['Algorithms', 'Data Structures', 'System Design', 'Behavioral', 'Database'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Practice Problems</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Difficulties</option>
          {difficulties.map(d => (
            <option key={d} value={d.toLowerCase()}>{d}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterDifficulty || filterCategory || search) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterDifficulty('');
              setFilterCategory('');
            }}
            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Problem List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-400">Loading problems...</div>
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No problems found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Create your first problem →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topics</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acceptance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{problem.title}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{problem.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.topics.slice(0, 2).map(topic => (
                        <span key={topic} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                          {topic}
                        </span>
                      ))}
                      {problem.topics.length > 2 && (
                        <span className="text-xs text-gray-400">+{problem.topics.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{problem.acceptanceRate}%</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(problem)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors mr-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(problem.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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

      {/* Create Modal */}
      {showCreateModal && (
        <ProblemFormModal
          title="Create New Problem"
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          difficulties={difficulties}
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingProblem && (
        <ProblemFormModal
          title="Edit Problem"
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          difficulties={difficulties}
          onSave={handleEdit}
          onClose={() => setEditingProblem(null)}
        />
      )}
    </div>
  );
}

// Helper component for the modal
interface ProblemFormModalProps {
  title: string;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  categories: string[];
  difficulties: string[];
  onSave: () => void;
  onClose: () => void;
}

function ProblemFormModal({ title, formData, setFormData, categories, difficulties, onSave, onClose }: ProblemFormModalProps) {
  const [topicInput, setTopicInput] = useState('');

  const addTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData({
        ...formData,
        topics: [...formData.topics, topicInput.trim()]
      });
      setTopicInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter((t: string) => t !== topic)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acceptance Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.acceptanceRate}
              onChange={(e) => setFormData({ ...formData, acceptanceRate: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                placeholder="Add a topic"
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTopic}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.topics.map((topic: string) => (
                <span key={topic} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {topic}
                  <button onClick={() => removeTopic(topic)} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Problem
          </button>
        </div>
      </div>
    </div>
  );
}