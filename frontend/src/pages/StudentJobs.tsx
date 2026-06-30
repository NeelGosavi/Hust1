// src/pages/StudentJobs.tsx
import React, { useState, useEffect } from 'react';
import { careerApi } from '../api/career';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, ChevronRight, Building2 } from 'lucide-react';

interface Job {
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
}

export default function StudentJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [search]);

  const fetchJobs = async () => {
    try {
      const response = await careerApi.getJobs({ search: search || undefined, limit: 50 });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
            <p className="text-gray-500 mt-1">{jobs.length} jobs found</p>
          </div>
          <Link to="/student/career" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title, company, or skills..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link to={`/student/jobs/${job.id}`} key={job.id} className="block">
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {job.company.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-600">{job.company}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-gray-400">{formatDate(job.postedAt)}</span>
                          {job.matchPercentage !== undefined && (
                            <div className="mt-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                job.matchPercentage >= 70 ? 'bg-green-100 text-green-700' :
                                job.matchPercentage >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {job.matchPercentage}% Match
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs font-medium px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {job.type}
                        </span>
                        {job.salary && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salary}
                          </span>
                        )}
                        {job.skills && job.skills.length > 0 && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {job.skills.slice(0, 2).join(', ')}
                            {job.skills.length > 2 && ` +${job.skills.length - 2}`}
                          </span>
                        )}
                        {job.isApplied && (
                          <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Applied
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
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