// src/components/student/JobCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Clock, DollarSign, Briefcase, ChevronRight } from 'lucide-react';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
    type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote';
    salary?: string;
    postedAt: string;
    description?: string;
    skills?: string[];
    isApplied?: boolean;
    matchPercentage?: number;
  };
  className?: string;
  compact?: boolean;
}

export function JobCard({ job, className = '', compact = false }: JobCardProps) {
  const {
    id,
    title,
    company,
    companyLogo,
    location,
    type,
    salary,
    postedAt,
    description,
    skills = [],
    isApplied = false,
    matchPercentage
  } = job;

  const typeColors = {
    'Full-time': 'bg-blue-100 text-blue-700',
    'Part-time': 'bg-green-100 text-green-700',
    'Contract': 'bg-orange-100 text-orange-700',
    'Internship': 'bg-purple-100 text-purple-700',
    'Remote': 'bg-indigo-100 text-indigo-700'
  };

  const formatDate = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  if (compact) {
    return (
      <Link to={`/student/jobs/${id}`} className="block">
        <div className={`bg-white rounded-lg shadow hover:shadow-md transition-all p-4 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {companyLogo ? (
                <img src={companyLogo} alt={company} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {company.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{company}</span>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{location}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {matchPercentage !== undefined && (
                <div className="text-sm font-medium">
                  <span className={`${matchPercentage >= 70 ? 'text-green-600' : matchPercentage >= 40 ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {matchPercentage}% Match
                  </span>
                </div>
              )}
              {isApplied && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  Applied
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/student/jobs/${id}`} className="block">
      <div className={`bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 ${className}`}>
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          {companyLogo ? (
            <img src={companyLogo} alt={company} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {company.charAt(0)}
            </div>
          )}

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-gray-600">{company}</span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    {location}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[type]}`}>
                    {type}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <span className="text-sm text-gray-500">{formatDate(postedAt)}</span>
                {isApplied && (
                  <div className="mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    Applied
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {description}
              </p>
            )}

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {salary && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{salary}</span>
                </div>
              )}
              {skills.length > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{skills.slice(0, 3).join(', ')}{skills.length > 3 && ` +${skills.length - 3} more`}</span>
                </div>
              )}
              {matchPercentage !== undefined && (
                <div className={`flex items-center gap-1 font-medium ${
                  matchPercentage >= 70 ? 'text-green-600' : 
                  matchPercentage >= 40 ? 'text-yellow-600' : 
                  'text-gray-500'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>{matchPercentage}% Match</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}