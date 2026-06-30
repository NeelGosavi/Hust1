// src/pages/StudentCourseView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentApi } from '../api/student';
import { AITutorChat } from '../components/student/AITutorChat';
import { QuizModal } from '../components/student/QuizModal';
import { BookOpen, MessageCircle, ClipboardList, ChevronLeft, CheckCircle, Circle, Clock } from 'lucide-react';

export default function StudentCourseView() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'tutor' | 'quiz'>('content');
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await studentApi.getCourse(id!);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async (answers: string[]) => {
    try {
      const response = await studentApi.submitQuiz(id!, answers);
      setQuizSubmitted(true);
      console.log('Quiz results:', response.data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Course Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500 mt-2">{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {course.progress || 0}% Complete
            </span>
            <span className="text-sm text-gray-500">
              Instructor: {course.instructor?.name || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'content'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Content
              </button>
              <button
                onClick={() => setActiveTab('tutor')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'tutor'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                AI Tutor
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'quiz'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Quiz
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'content' && (
              <div className="space-y-4">
                {course.modules?.map((module: any, index: number) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Module {index + 1}: {module.title}</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {module.lessons?.map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {lesson.completed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-gray-700">{lesson.title}</span>
                          </div>
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {lesson.duration || 5}min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tutor' && id && (
              <AITutorChat courseId={id} />
            )}

            {activeTab === 'quiz' && (
              <div>
                {quizSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Quiz Submitted!</h3>
                    <p className="text-gray-500 mt-2">Check your results in the grades section.</p>
                  </div>
                ) : (
                  <QuizModal courseId={id!} onSubmit={handleQuizSubmit} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}