import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Loader2, Send, ChevronRight, BookOpen, MessageCircleQuestion, FileQuestion } from 'lucide-react';

interface Slide {
  title: string;
  content: string;
  image_suggestion: string;
}

interface QuizItem {
  question: string;
  options: string[];
  answer: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  script: string;
  slides: Slide[];
  quiz: QuizItem[];
}

interface ChatMessage {
  role: 'user' | 'tutor';
  text: string;
}

export default function StudentCourseView() {
  const { courseId } = useParams<{courseId: string}>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'learn' | 'tutor' | 'quiz'>('learn');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([{role: 'tutor', text: "Hello! I am your AI Tutor for this course. What questions do you have?"}]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await apiClient.get(`/api/student/course/${courseId}`);
        setCourse(res.data);
      } catch (error) {
        console.error(error);
        alert("Failed to load course");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: chatInput };
    const updatedMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatInput("");
    setChatting(true);

    try {
      const res = await apiClient.post(`/api/student/course/${courseId}/chat`, {
        message: chatInput
      });
      const tutorMessage: ChatMessage = { role: 'tutor', text: res.data.reply };
      setMessages([...updatedMessages, tutorMessage]);
    } catch (error) {
      console.error(error);
      const tutorMessage: ChatMessage = { role: 'tutor', text: "Sorry, I had trouble answering that." };
      setMessages([...updatedMessages, tutorMessage]);
    } finally {
      setChatting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>;
  }

  if (!course) return <div className="text-white text-center">Course not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Course Material */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
          <p className="text-slate-300 mb-6">{course.description}</p>
          
          <div className="flex gap-4 border-b border-slate-700 pb-4 mb-6">
            <button 
              onClick={() => setActiveTab('learn')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === 'learn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <BookOpen className="w-5 h-5 mr-2"/> Learn
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === 'quiz' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <FileQuestion className="w-5 h-5 mr-2"/> Take Quiz
            </button>
            {/* Mobile Chat button */}
            <button 
              onClick={() => setActiveTab('tutor')}
              className={`lg:hidden flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === 'tutor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <MessageCircleQuestion className="w-5 h-5 mr-2"/> AI Tutor
            </button>
          </div>

          {activeTab === 'learn' && (
            <div className="animate-in fade-in duration-500">
              <div className="bg-slate-800/50 rounded-xl p-8 mb-6 border border-slate-700 min-h-[300px]">
                <h3 className="text-2xl font-bold text-white mb-4">{course.slides[currentSlide]?.title}</h3>
                <div className="text-slate-200 whitespace-pre-wrap text-lg leading-relaxed">
                  {course.slides[currentSlide]?.content}
                </div>
                <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-xs text-indigo-300 font-semibold uppercase mb-1">Image Suggestion</p>
                  <p className="text-sm text-indigo-200 italic">{course.slides[currentSlide]?.image_suggestion}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <button 
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="text-slate-400">Slide {currentSlide + 1} of {course.slides.length}</span>
                <button 
                  disabled={currentSlide === course.slides.length - 1}
                  onClick={() => setCurrentSlide(prev => prev + 1)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1"/>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {course.quiz.map((q, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h4 className="text-xl font-semibold text-white mb-4">{idx + 1}. {q.question}</h4>
                  <div className="space-y-3">
                    {q.options.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-slate-600 transition-all">
                        <input type="radio" name={`quiz-${idx}`} className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-500 focus:ring-indigo-500" />
                        <span className="text-slate-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-emerald-500/25">
                Submit Quiz
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Right Column: AI Tutor Chat (Hidden on mobile if not active tab) */}
      <div className={`lg:block ${activeTab === 'tutor' ? 'block' : 'hidden'}`}>
        <div className="glass-panel flex flex-col h-[600px] sticky top-8">
          <div className="p-4 border-b border-slate-700 flex items-center">
            <MessageCircleQuestion className="w-6 h-6 text-indigo-400 mr-2" />
            <h2 className="text-xl font-bold text-white">AI Tutor</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatting && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChat} className="p-4 border-t border-slate-700">
            <div className="relative">
              <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-slate-800 border border-slate-600 rounded-full py-3 pl-4 pr-12 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={chatting || !chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
