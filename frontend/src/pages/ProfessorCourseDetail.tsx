// frontend/src/pages/ProfessorCourseDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '@clerk/clerk-react';
import { 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight,
  QrCode,
  Download,
  Share2,
  Users,
  Calendar,
  Clock,
  Copy,
  Check
} from 'lucide-react';

interface Slide {
  title: string;
  content: string;
  image_suggestion: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface CourseDetail {
  _id: string;
  title: string;
  description: string;
  script: string;
  slides: Slide[];
  quiz: QuizQuestion[];
  created_at: string;
  professor_id: string;
  professor_email?: string;
  is_published?: boolean;
  enrollment_count?: number;
  qr_code?: string;
}

export default function ProfessorCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [showQuizAnswers, setShowQuizAnswers] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      generateQRCode();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await apiClient.get(`/api/professor/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCourse(res.data);
    } catch (error: any) {
      console.error("Failed to fetch course details:", error);
      setError(error?.response?.data?.detail || "Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const token = await getToken();
      // Generate QR code for student access
      const studentUrl = `${window.location.origin}/student/course/${courseId}`;
      
      // You can either generate on frontend or fetch from backend
      // Option 1: Generate on frontend (if you have qrcode library in frontend)
      // Option 2: Fetch from backend
      
      // For now, let's create a QR code URL using a free API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(studentUrl)}`;
      setQrCode(qrApiUrl);
      
      // Or if you want to use the backend QR service:
      // const res = await apiClient.get(`/api/professor/courses/${courseId}/qr`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setQrCode(res.data.qr_code);
      
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const toggleSlide = (index: number) => {
    setExpandedSlide(expandedSlide === index ? null : index);
  };

  const handleCopyLink = async () => {
    const studentUrl = `${window.location.origin}/student/course/${courseId}`;
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-code-${course?.title || 'course'}.png`;
      link.href = qrCode;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
        <p className="text-white mt-4">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Course</h2>
          <p className="text-slate-300">{error || 'Course not found'}</p>
          <button 
            onClick={() => navigate('/professor/dashboard')}
            className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/professor/dashboard')}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Course Header with QR Code */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{course.title}</h1>
              {course.is_published && (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                  Published
                </span>
              )}
            </div>
            <p className="text-slate-300">{course.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created: {new Date(course.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {course.slides?.length || 0} slides
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                {course.quiz?.length || 0} quiz questions
              </span>
              {course.enrollment_count !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.enrollment_count} students
                </span>
              )}
            </div>
          </div>
          
          {/* QR Code Section */}
          <div className="flex flex-col items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
            {qrCode ? (
              <>
                <div className="bg-white p-2 rounded-lg shadow-lg mb-2">
                  <img 
                    src={qrCode} 
                    alt={`QR Code for ${course.title}`}
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      // Show fallback
                      const fallback = document.createElement('div');
                      fallback.className = 'w-32 h-32 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400';
                      fallback.textContent = 'QR Code';
                      (e.target as HTMLImageElement).parentNode?.replaceChild(fallback, e.target);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                  <button
                    onClick={handleDownloadQR}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Download QR Code"
                  >
                    <Download className="w-4 h-4 text-slate-300" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.share?.({
                        title: course.title,
                        text: `Join my course: ${course.title}`,
                        url: `${window.location.origin}/student/course/${courseId}`
                      });
                    }}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  Scan to share
                </p>
              </>
            ) : (
              <div className="w-32 h-32 bg-slate-700 rounded-lg flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lecture Script */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-semibold text-white">Lecture Script</h2>
          <span className="text-xs text-slate-400 ml-2 bg-slate-700/50 px-2 py-1 rounded">
            {course.script?.split(/\s+/).length || 0} words
          </span>
        </div>
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-slate-300 font-sans text-base leading-relaxed bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
            {course.script || 'No script available'}
          </pre>
        </div>
      </div>

      {/* Slides */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-semibold text-white">Course Slides</h2>
          <span className="text-sm text-slate-400 ml-2">({course.slides?.length || 0} slides)</span>
        </div>
        
        <div className="space-y-3">
          {course.slides?.map((slide, index) => (
            <div 
              key={index} 
              className="bg-slate-800/30 rounded-lg overflow-hidden border border-slate-700/50 hover:border-indigo-500/30 transition-colors"
            >
              <button
                onClick={() => toggleSlide(index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <h3 className="text-lg font-medium text-white group-hover:text-indigo-300 transition-colors">
                    {slide.title || `Slide ${index + 1}`}
                  </h3>
                </div>
                {expandedSlide === index ? (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                )}
              </button>
              
              {expandedSlide === index && (
                <div className="p-4 pt-0 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="prose prose-invert max-w-none">
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {slide.content?.split('\n').filter((line: string) => line.trim()).map((point: string, i: number) => (
                        <li key={i} className="py-0.5">{point.replace(/^[•\-]\s*/, '')}</li>
                      )) || <li>No content available</li>}
                    </ul>
                  </div>
                  
                  {slide.image_suggestion && (
                    <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <p className="text-xs text-indigo-300 font-medium">🎨 Image Generation Prompt:</p>
                      <p className="text-sm text-slate-400 mt-1">{slide.image_suggestion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quiz */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-semibold text-white">Quiz</h2>
            <span className="text-sm text-slate-400">({course.quiz?.length || 0} questions)</span>
          </div>
          <button
            onClick={() => setShowQuizAnswers(!showQuizAnswers)}
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {showQuizAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>
        </div>
        
        <div className="space-y-6">
          {course.quiz?.map((q, index) => (
            <div key={index} className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
              <p className="text-white font-medium mb-3 flex items-start gap-2">
                <span className="text-indigo-400 font-mono text-sm bg-indigo-500/10 px-2 py-0.5 rounded">Q{index + 1}</span>
                <span>{q.question}</span>
              </p>
              <div className="space-y-2 ml-4">
                {q.options?.map((option: string, optIndex: number) => {
                  const isCorrect = showQuizAnswers && option === q.answer;
                  return (
                    <div 
                      key={optIndex}
                      className={`p-2.5 rounded-lg text-sm transition-colors ${
                        isCorrect
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                          : showQuizAnswers && option !== q.answer
                          ? 'bg-slate-700/30 text-slate-400'
                          : 'bg-slate-700/30 text-slate-300 hover:bg-slate-600/30'
                      }`}
                    >
                      <span className="font-mono text-slate-500 mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                      {option}
                      {isCorrect && (
                        <span className="ml-2 text-emerald-400 text-xs font-medium">✓ Correct</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}