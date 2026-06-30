// src/components/student/PracticeProblemCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, Clock, ArrowRight, Tag, TrendingUp } from 'lucide-react';

interface PracticeProblemCardProps {
  problem: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'todo' | 'attempted' | 'solved';
    acceptanceRate?: number;
    timeLimit?: string;
    topics?: string[];
  };
  onUpdateProgress: (problemId: string, status: 'todo' | 'attempted' | 'solved') => void;
  className?: string;
}

export function PracticeProblemCard({ 
  problem, 
  onUpdateProgress,
  className = ''
}: PracticeProblemCardProps) {
  const { id, title, description, category, difficulty, status, acceptanceRate, timeLimit, topics = [] } = problem;

  const statusIcons = {
    todo: <Circle className="w-5 h-5 text-gray-400" />,
    attempted: <Clock className="w-5 h-5 text-yellow-500" />,
    solved: <CheckCircle className="w-5 h-5 text-green-500" />
  };

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700'
  };

  const difficultyBadges = {
    Easy: '🟢 Easy',
    Medium: '🟡 Medium',
    Hard: '🔴 Hard'
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextStatus: Record<string, 'todo' | 'attempted' | 'solved'> = {
      todo: 'attempted',
      attempted: 'solved',
      solved: 'todo'
    };
    onUpdateProgress(id, nextStatus[status] || 'todo');
  };

  return (
    <Link to={`/student/practice/${id}`} className="block">
      <div className={`bg-white rounded-lg shadow hover:shadow-md transition-all p-5 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
                {difficultyBadges[difficulty]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                {category}
              </span>
              {topics.slice(0, 3).map((topic) => (
                <span key={topic} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                  {topic}
                </span>
              ))}
              {topics.length > 3 && (
                <span className="text-xs text-gray-400">+{topics.length - 3} more</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            {acceptanceRate !== undefined && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>{acceptanceRate}%</span>
              </div>
            )}
            <button
              onClick={handleStatusClick}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              title={`Mark as ${status === 'todo' ? 'attempted' : status === 'attempted' ? 'solved' : 'todo'}`}
            >
              {statusIcons[status]}
            </button>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}