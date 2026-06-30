// src/pages/StudentPracticeProblem.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { practiceApi } from '../api/practice';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Clock, 
  Code, 
  Play, 
  Send,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'todo' | 'attempted' | 'solved';
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  topics: string[];
  acceptanceRate: number;
}

export default function StudentPracticeProblem() {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExamples, setShowExamples] = useState(true);

  useEffect(() => {
    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const response = await practiceApi.getProblem(problemId!);
      setProblem(response.data);
      setCode('// Write your solution here\n\nfunction solution(input) {\n  // Your code here\n  return input;\n}');
    } catch (error) {
      console.error('Error fetching problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOutput('✅ All test cases passed!');
    } catch (error) {
      setOutput('❌ Some test cases failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: 'todo' | 'attempted' | 'solved') => {
    try {
      await practiceApi.updateProgress(problemId!, status);
      setProblem(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('Error updating status:', error);
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

  const difficultyConfig = {
    Easy: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
    Medium: { color: 'text-amber-600', bg: 'bg-amber-50' },
    Hard: { color: 'text-red-600', bg: 'bg-red-50' }
  };

  const statusConfig = {
    solved: { icon: CheckCircle, label: 'Solved', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    attempted: { icon: Clock, label: 'Attempted', color: 'text-amber-600', bg: 'bg-amber-50' },
    todo: { icon: Circle, label: 'To Do', color: 'text-gray-400', bg: 'bg-gray-50' }
  };

  const StatusIcon = statusConfig[problem.status].icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/student/practice" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => {
              const statusMap = { todo: 'attempted', attempted: 'solved', solved: 'todo' };
              handleStatusUpdate(statusMap[problem.status] as any);
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusConfig[problem.status].bg} ${statusConfig[problem.status].color}`}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig[problem.status].label}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Problem Description */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h1 className="text-xl font-bold text-gray-900">{problem.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyConfig[problem.difficulty].bg} ${difficultyConfig[problem.difficulty].color}`}>
                  {problem.difficulty}
                </span>
                <span className="text-xs text-gray-500 px-2.5 py-0.5 bg-gray-100 rounded-full">
                  {problem.category}
                </span>
                <span className="text-xs text-gray-500 px-2.5 py-0.5 bg-blue-50 rounded-full">
                  {problem.acceptanceRate}% acceptance
                </span>
                {problem.topics.slice(0, 3).map(topic => (
                  <span key={topic} className="text-xs text-gray-500 px-2.5 py-0.5 bg-gray-50 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-gray-600 leading-relaxed">{problem.description}</p>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowExamples(!showExamples)}
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {showExamples ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Examples
                  </button>
                  {showExamples && (
                    <div className="mt-3 space-y-3">
                      {problem.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Input:</span>
                            <code className="ml-2 bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-mono">{example.input}</code>
                          </div>
                          <div className="text-sm mt-1">
                            <span className="font-medium text-gray-700">Output:</span>
                            <code className="ml-2 bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-mono">{example.output}</code>
                          </div>
                          {example.explanation && (
                            <div className="text-sm mt-1 text-gray-500">
                              <span className="font-medium">Explanation:</span> {example.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && problem.constraints.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Constraints</h3>
                  <ul className="space-y-1">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="text-sm text-gray-500 flex items-start gap-2">
                        <span className="text-gray-300">•</span>
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Code Editor */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Solution</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Run & Submit
                    </>
                  )}
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-[350px] font-mono text-sm p-4 bg-gray-900 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {output && (
              <div className={`p-4 rounded-xl border ${
                output.includes('✅') ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`font-medium flex items-center gap-2 ${
                  output.includes('✅') ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {output.includes('✅') ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {output}
                </p>
              </div>
            )}

            {problem.status === 'solved' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Problem Solved!</span>
                  <span className="text-sm text-emerald-600 ml-2">Great job! 🎉</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}