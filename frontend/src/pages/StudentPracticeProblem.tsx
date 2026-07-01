// src/pages/StudentPracticeProblem.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { practiceApi } from '../api/practice';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string; // "easy" | "medium" | "hard"
  status: 'todo' | 'attempted' | 'solved';
  topics: string[];
  external_url?: string | null;
}

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  easy: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50' },
  hard: { color: 'text-red-600', bg: 'bg-red-50' },
};

const statusConfig = {
  solved: { icon: CheckCircle, label: 'Solved', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  attempted: { icon: Clock, label: 'Attempted', color: 'text-amber-600', bg: 'bg-amber-50' },
  todo: { icon: Circle, label: 'To Do', color: 'text-gray-400', bg: 'bg-gray-50' },
};

export default function StudentPracticeProblem() {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  useEffect(() => {
    if (problemId) fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const response = await practiceApi.getProblem(problemId!);
      setProblem(response.data);
    } catch (error) {
      console.error('Error fetching problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'todo' | 'attempted' | 'solved') => {
    try {
      await practiceApi.updateProgress(problemId!, status);
      setProblem(prev => (prev ? { ...prev, status } : null));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSolveWithAI = async () => {
    setSolving(true);
    setSolveError(null);
    setSolution(null);
    try {
      const response = await practiceApi.solveWithAI(problemId!);
      setSolution(response.data.solution);
      // Trying the AI solution counts as attempting the problem.
      if (problem?.status === 'todo') handleStatusUpdate('attempted');
    } catch (error) {
      console.error('Error solving with AI:', error);
      setSolveError('The AI solver failed. Please try again.');
    } finally {
      setSolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading problem...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Problem not found</div>
      </div>
    );
  }

  const diff = difficultyConfig[(problem.difficulty || '').toLowerCase()] || difficultyConfig.easy;
  const status = statusConfig[problem.status] || statusConfig.todo;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/student/practice" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => {
              const next = { todo: 'attempted', attempted: 'solved', solved: 'todo' } as const;
              handleStatusUpdate(next[problem.status]);
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status.bg} ${status.color}`}
          >
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </button>
        </div>

        {/* Problem */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${diff.bg} ${diff.color}`}>
              {problem.difficulty}
            </span>
            <span className="text-xs text-gray-500 px-2.5 py-0.5 bg-gray-100 rounded-full capitalize">
              {problem.category?.replace('_', ' ')}
            </span>
            {problem.topics?.map(topic => (
              <span key={topic} className="text-xs text-gray-500 px-2.5 py-0.5 bg-gray-50 rounded-full">
                {topic}
              </span>
            ))}
          </div>
          <p className="text-gray-600 leading-relaxed mt-4 whitespace-pre-wrap">{problem.description}</p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            {problem.external_url && (
              <a
                href={problem.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Solve on LeetCode
              </a>
            )}
            <button
              onClick={handleSolveWithAI}
              disabled={solving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-medium disabled:opacity-60"
            >
              {solving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {solving ? 'Solving…' : 'Solve with AI'}
            </button>
          </div>
        </div>

        {/* AI solution */}
        {solveError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {solveError}
          </div>
        )}
        {solving && (
          <div className="mt-4 p-6 bg-white border border-gray-200 rounded-xl flex items-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            The AI is working through the problem — approach, code, complexity, and a dry run…
          </div>
        )}
        {solution && !solving && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-900">AI Solution & Dry Run</span>
            </div>
            <pre className="p-5 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed overflow-x-auto">
              {solution}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
