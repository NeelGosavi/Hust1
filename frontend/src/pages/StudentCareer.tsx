// src/pages/StudentCareer.tsx
import React, { useState, useEffect } from 'react';
import { careerApi } from '../api/career';
import { Link } from 'react-router-dom';
import { Briefcase, Upload, FileText, TrendingUp, ArrowRight, MapPin, Building2, Clock } from 'lucide-react';

export default function StudentCareer() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCareerData();
  }, []);

  const fetchCareerData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        careerApi.getJobs({ limit: 5 }),
        careerApi.getApplications(),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (error) {
      console.error('Error fetching career data:', error);
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
        <div className="text-gray-400">Loading career data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Career Center</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/student/jobs" className="group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
                  <p className="text-sm text-gray-500">Find opportunities</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/student/resume" className="group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload Resume</h3>
                  <p className="text-sm text-gray-500">Get your resume analyzed</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/student/applications" className="group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Applications</h3>
                  <p className="text-sm text-gray-500">{applications.length} applications</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Job Postings</h2>
            <Link to="/student/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No jobs available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link to={`/student/jobs/${job.id}`} key={job.id} className="block">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {job.company?.charAt(0) || 'J'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <span>{job.company}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(job.postedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}