// src/pages/StudentApplications.tsx
import React, { useState, useEffect } from 'react';
import { careerApi } from '../api/career';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, FileText, ArrowRight, Building2, Calendar } from 'lucide-react';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  appliedAt: string;
  coverLetter?: string;
}

export default function StudentApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await careerApi.getApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' };
      case 'reviewing':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Reviewing' };
      case 'accepted':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Accepted' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-500 mt-1">{applications.length} applications submitted</p>
          </div>
          <Link to="/student/career" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Career
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">You haven't applied to any jobs yet</p>
            <Link to="/student/jobs" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
              Browse jobs →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <Link to={`/student/jobs/${app.jobId}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {app.jobTitle}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{app.company}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/student/jobs/${app.jobId}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 flex-shrink-0"
                    >
                      View Job
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}