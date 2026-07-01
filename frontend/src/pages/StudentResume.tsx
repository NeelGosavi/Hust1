// src/pages/StudentResume.tsx
import React, { useState, useEffect } from 'react';
import { careerApi } from '../api/career';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, TrendingUp, AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  company: string;
}

interface AnalysisResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export default function StudentResume() {
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await careerApi.getJobs({ limit: 50 });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          setUploadError('File is too large. Maximum size is 5MB.');
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          setUploadError('Please upload a PDF, DOC, DOCX, or TXT file.');
        } else {
          setUploadError('Failed to upload file. Please try again.');
        }
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;
      
      setFile(file);
      setUploadError(null);
      await uploadResume(file);
    }
  });

  const uploadResume = async (file: File) => {
    setLoading(true);
    setUploadError(null);
    
    try {
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const response = await careerApi.uploadResume(file);
      console.log('Upload response:', response.data);
      
      // ✅ FIX: Check for 'extracted_text' field (what backend returns)
      // Also check for 'text' as fallback
      const extractedText = response.data.extracted_text || 
                           response.data.text || 
                           response.data.content || 
                           response.data.resume_text || 
                           '';
      
      if (extractedText && extractedText.trim().length > 0) {
        setResumeText(extractedText);
        setUploadError(null);
        console.log('✅ Resume text extracted successfully:', extractedText.length, 'characters');
      } else {
        setUploadError('File uploaded but text could not be extracted. Please try another file.');
      }
      
      // Fetch jobs if not already loaded
      if (jobs.length === 0) {
        await fetchJobs();
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      
      // Better error messages based on status code
      if (error.response?.status === 422) {
        setUploadError('The file format is not supported. Please upload a valid PDF, DOC, or TXT file.');
      } else if (error.response?.status === 413) {
        setUploadError('File is too large. Maximum size is 5MB.');
      } else if (error.response?.status === 400) {
        setUploadError(error.response?.data?.detail || error.response?.data?.message || 'Invalid file. Please try again.');
      } else if (error.response?.status === 404) {
        setUploadError('Upload service not available. Please try again later.');
      } else {
        setUploadError('Failed to upload resume. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkills = async () => {
    if (!resumeText || !selectedJobId) return;
    
    setAnalyzing(true);
    try {
      const response = await careerApi.analyzeSkills(resumeText, selectedJobId);
      const d = response.data;
      // Backend returns snake_case; map to the shape this page renders.
      setAnalysis({
        matchPercentage: d.match_percentage ?? 0,
        matchedSkills: d.matched_skills ?? [],
        missingSkills: d.missing_skills ?? [],
      });
    } catch (error) {
      console.error('Error analyzing skills:', error);
      alert('Failed to analyze skills. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!resumeText || !selectedJobId) return;
    
    setApplying(true);
    try {
      const response = await careerApi.apply(selectedJobId, resumeText);
      alert(`✅ Application submitted! Status: ${response.data.status}`);
    } catch (error: any) {
      console.error('Error applying:', error);
      alert(error.response?.data?.detail || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const clearResume = () => {
    setFile(null);
    setResumeText('');
    setAnalysis(null);
    setUploadError(null);
  };

  const isAnalyzeDisabled = !selectedJobId || analyzing || !resumeText;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/student/career" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Career
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Analyzer</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload your resume to get AI-powered skill analysis and job matching</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
              uploadError 
                ? 'border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-500/10' 
                : isDragActive
                ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-500/5'
            }`}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
                <p className="text-gray-600 dark:text-gray-300">Uploading your resume...</p>
              </div>
            ) : (
              <>
                <Upload className={`w-10 h-10 mx-auto mb-3 ${
                  uploadError ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500'
                }`} />
                <p className="text-gray-600 dark:text-gray-300">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here, or click to browse'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Supports PDF, DOC, DOCX, TXT (Max 5MB)
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadError}
              </p>
            </div>
          )}

          {/* File Info */}
          {file && !uploadError && (
            <div className="mt-4 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
              <div className="flex items-center gap-2 min-w-0">
                <File className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button 
                onClick={clearResume}
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {resumeText && !uploadError && (
            <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Resume processed successfully! ({resumeText.length} characters extracted)
            </div>
          )}
        </div>

        {/* Job Selection & Analysis */}
        {resumeText && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Analyze Against Job</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              >
                <option value="">Select a job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
              <button
                onClick={analyzeSkills}
                disabled={isAnalyzeDisabled}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Skills'
                )}
              </button>
            </div>
            {selectedJobId && !analyzing && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Click "Analyze Skills" to see how your resume matches this job
              </p>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Skill Match Analysis</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            
            {/* Match Percentage */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Match Percentage</span>
                <span className={`text-lg font-bold ${
                  analysis.matchPercentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                  analysis.matchPercentage >= 40 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {analysis.matchPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    analysis.matchPercentage >= 70 ? 'bg-emerald-500' :
                    analysis.matchPercentage >= 40 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${analysis.matchPercentage}%` }}
                />
              </div>
            </div>

            {/* Skills Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Matched Skills ({analysis.matchedSkills?.length || 0})
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {analysis.matchedSkills?.length > 0 ? (
                    analysis.matchedSkills.map((skill) => (
                      <div key={skill} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                        {skill}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">No matching skills found</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Missing Skills ({analysis.missingSkills?.length || 0})
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {analysis.missingSkills?.length > 0 ? (
                    analysis.missingSkills.map((skill) => (
                      <div key={skill} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                        <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        {skill}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">🎉 Great match! No missing skills.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              disabled={!selectedJobId || applying}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Apply to this Position'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}