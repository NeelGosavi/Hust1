import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Loader2, Upload, Briefcase, FileCheck, CheckCircle } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  company: string;
  required_skills: string[];
  description: string;
}

interface SkillGap {
  match_percentage: number;
  missing_skills: string[];
  recommendations: string;
}

export default function StudentCareer() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingJob, setAnalyzingJob] = useState<string | null>(null);
  const [skillGaps, setSkillGaps] = useState<Record<string, SkillGap>>({});
  const [applyingJob, setApplyingJob] = useState<string | null>(null);
  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient.get('/api/career/jobs').then(res => setJobs(res.data));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient.post('/api/career/upload-resume', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResumeText(res.data.extracted_text);
    } catch (error) {
      console.error(error);
      alert("Failed to parse resume");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeCorrect = async (jobId: string) => {
    if (!resumeText) return;
    setAnalyzingJob(jobId);
    try {
      const res = await apiClient.post('/api/career/analyze-skills', {
        resume_text: resumeText,
        job_id: jobId,
      });
      setSkillGaps(prev => ({ ...prev, [jobId]: res.data }));
    } catch (error) {
      console.error(error);
      alert("Analysis failed.");
    } finally {
      setAnalyzingJob(null);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!resumeText) return;
    setApplyingJob(jobId);
    try {
      const res = await apiClient.post('/api/career/apply', {
        resume_text: resumeText,
        job_id: jobId,
      });
      setCoverLetters(prev => ({ ...prev, [jobId]: res.data.cover_letter }));
    } catch (error) {
      console.error(error);
      alert("Application failed.");
    } finally {
      setApplyingJob(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Student Career Portal</h1>
        <p className="text-slate-400 text-lg">Upload your resume to get matched with jobs and auto-generate personalized cover letters.</p>
      </div>

      {/* Resume Upload Section */}
      <div className="glass-panel p-8 flex flex-col items-center justify-center border-dashed border-2 border-slate-600">
        {!resumeText ? (
          <>
            <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Upload Resume (PDF)</h2>
            <p className="text-slate-400 mb-6 text-center max-w-md">Our Document AI will parse your skills and experience to find the best job matches.</p>
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-all">
              {uploading ? <span className="flex items-center"><Loader2 className="animate-spin mr-2"/> Parsing...</span> : "Select PDF File"}
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </>
        ) : (
          <div className="flex items-center flex-col text-center">
            <div className="bg-emerald-500/20 p-4 rounded-full mb-4">
              <FileCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Resume Parsed Successfully!</h2>
            <p className="text-slate-300 max-w-lg mb-6 line-clamp-3">Extracted: {resumeText}</p>
            <button onClick={() => setResumeText(null)} className="text-indigo-400 hover:text-indigo-300 underline">Upload a different resume</button>
          </div>
        )}
      </div>

      {/* Jobs Section */}
      {resumeText && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Briefcase className="mr-3 text-indigo-400" /> Recommended Jobs
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map(job => (
              <div key={job._id} className="glass-panel p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{job.title}</h3>
                    <p className="text-slate-400">{job.company}</p>
                  </div>
                  {skillGaps[job._id] && (
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${skillGaps[job._id].match_percentage > 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {skillGaps[job._id].match_percentage}% Match
                    </div>
                  )}
                </div>
                
                <p className="text-slate-300 text-sm mb-4">{job.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.required_skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-800 rounded-md text-xs text-slate-300 border border-slate-700">{skill}</span>
                  ))}
                </div>

                {/* Analysis Results */}
                {skillGaps[job._id] && (
                  <div className="mb-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3">
                    {skillGaps[job._id].missing_skills.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-rose-400 uppercase">Missing Skills</span>
                        <p className="text-sm text-slate-300">{skillGaps[job._id].missing_skills.join(", ")}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-indigo-400 uppercase">AI Recommendation</span>
                      <p className="text-sm text-slate-300">{skillGaps[job._id].recommendations}</p>
                    </div>
                  </div>
                )}

                {/* Cover Letter Results */}
                {coverLetters[job._id] && (
                  <div className="mb-6 bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center text-emerald-400 font-semibold mb-2">
                      <CheckCircle className="w-4 h-4 mr-2" /> Application Sent
                    </div>
                    <p className="text-sm text-emerald-200/70 line-clamp-3 italic">"{coverLetters[job._id]}"</p>
                  </div>
                )}

                <div className="mt-auto flex gap-3">
                  {!skillGaps[job._id] ? (
                    <button 
                      onClick={() => handleAnalyzeCorrect(job._id)}
                      disabled={analyzingJob === job._id}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex justify-center items-center"
                    >
                      {analyzingJob === job._id ? <Loader2 className="w-4 h-4 animate-spin"/> : "Analyze Skill Gap"}
                    </button>
                  ) : !coverLetters[job._id] ? (
                    <button 
                      onClick={() => handleApply(job._id)}
                      disabled={applyingJob === job._id}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-indigo-500/20"
                    >
                      {applyingJob === job._id ? <Loader2 className="w-4 h-4 animate-spin"/> : "One-Click Apply"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
