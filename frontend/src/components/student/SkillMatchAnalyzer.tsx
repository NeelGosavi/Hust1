// src/components/student/SkillMatchAnalyzer.tsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface SkillMatchAnalyzerProps {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  className?: string;
  onApply?: () => void;
  isApplying?: boolean;
}

export function SkillMatchAnalyzer({ 
  matchedSkills = [],
  missingSkills = [],
  matchPercentage = 0,
  className = '',
  onApply,
  isApplying = false
}: SkillMatchAnalyzerProps) {
  const [showAllMatched, setShowAllMatched] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);

  const displayedMatched = showAllMatched ? matchedSkills : matchedSkills.slice(0, 5);
  const displayedMissing = showAllMissing ? missingSkills : missingSkills.slice(0, 5);

  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchBackground = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Skill Match Analysis</h3>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${getMatchColor(matchPercentage)}`} />
          <span className={`text-2xl font-bold ${getMatchColor(matchPercentage)}`}>
            {matchPercentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Match Score</span>
          <span className="font-medium">{matchPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-700 ${getMatchBackground(matchPercentage)}`}
            style={{ width: `${Math.min(100, matchPercentage)}%` }}
          />
        </div>
      </div>

      {/* Skills Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div>
          <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Matched Skills ({matchedSkills.length})
          </h4>
          <div className="space-y-1.5">
            {displayedMatched.length > 0 ? (
              displayedMatched.map((skill) => (
                <div key={skill} className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{skill}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No matching skills found</p>
            )}
            {matchedSkills.length > 5 && (
              <button
                onClick={() => setShowAllMatched(!showAllMatched)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllMatched ? 'Show less' : `Show ${matchedSkills.length - 5} more`}
              </button>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div>
          <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Missing Skills ({missingSkills.length})
          </h4>
          <div className="space-y-1.5">
            {displayedMissing.length > 0 ? (
              displayedMissing.map((skill) => (
                <div key={skill} className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{skill}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Perfect match! No missing skills.</span>
              </div>
            )}
            {missingSkills.length > 5 && (
              <button
                onClick={() => setShowAllMissing(!showAllMissing)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllMissing ? 'Show less' : `Show ${missingSkills.length - 5} more`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {missingSkills.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Skills to Develop</p>
              <p className="text-sm text-yellow-700 mt-1">
                Focus on developing these {missingSkills.length} skill{missingSkills.length > 1 ? 's' : ''} to improve your match percentage.
                {missingSkills.length > 3 && ` Consider taking courses in ${missingSkills.slice(0, 3).join(', ')}.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      {onApply && (
        <button
          onClick={onApply}
          disabled={isApplying}
          className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? 'Applying...' : 'Apply to this Position'}
        </button>
      )}
    </div>
  );
}