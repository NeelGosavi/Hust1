// frontend/src/App.tsx

import { Routes, Route, Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { apiClient, setupInterceptors } from './api/client'
import ProfessorDashboard from './pages/ProfessorDashboard'
import ProfessorCourseDetail from './pages/ProfessorCourseDetail'
import StudentCourseView from './pages/StudentCourseView'
import StudentCareer from './pages/StudentCareer'
import { BookOpen, GraduationCap, Sparkles, ArrowRight } from 'lucide-react'

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Education Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 mb-6">
          Next-Gen Education
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
          Empowering Professors with AI course generation. Elevating Students with 
          interactive RAG Tutors and intelligent Career Growth.
        </p>
      </div>
      
      <SignedOut>
        <div className="glass-panel p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-2 text-white">Welcome to EduAI</h2>
          <p className="text-slate-400 mb-6 text-sm">Sign in to start creating and learning</p>
          <SignInButton mode="modal">
            <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          <Link 
            to="/professor/dashboard" 
            className="glass-panel p-8 hover:border-indigo-500/50 transition-all group hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Professor Dashboard</h2>
            <p className="text-slate-400 text-sm">Create AI-powered courses and manage your content</p>
            <div className="mt-4 text-indigo-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
          
          <Link 
            to="/student/career" 
            className="glass-panel p-8 hover:border-emerald-500/50 transition-all group hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Student Portal</h2>
            <p className="text-slate-400 text-sm">Access courses, career guidance, and AI tutors</p>
            <div className="mt-4 text-emerald-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Go to Portal <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </SignedIn>

      {/* Features Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-white font-medium">AI Course Generation</h3>
          <p className="text-slate-400 text-sm">Create courses instantly with AI</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-white font-medium">Interactive Learning</h3>
          <p className="text-slate-400 text-sm">Engaging content with RAG tutors</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-white font-medium">Career Growth</h3>
          <p className="text-slate-400 text-sm">Smart career guidance and tracking</p>
        </div>
      </div>
    </div>
  )
}

function Navbar() {
  return (
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-slate-800/50">
      <Link to="/" className="text-2xl font-bold text-white tracking-tight hover:text-indigo-400 transition-colors flex items-center gap-2">
        <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm">
          AI
        </span>
        <span>Edu<span className="text-indigo-400">AI</span></span>
      </Link>
      <div className="flex items-center gap-4">
        <SignedIn>
          <Link 
            to="/professor/dashboard" 
            className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            Dashboard
          </Link>
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  )
}

function App() {
  const { getToken, isLoaded } = useAuth();

  const fetchToken = async () => {
    try {
      const token = await getToken();
      return token;
    } catch (error) {
      console.warn("Could not fetch Clerk token", error);
      return null;
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    
    // Setup interceptors for API client
    const interceptorId = setupInterceptors(fetchToken);
    
    // Cleanup on unmount
    return () => {
      if (interceptorId !== undefined) {
        apiClient.interceptors.request.eject(interceptorId);
      }
    };
  }, [isLoaded, getToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
          <Route path="/professor/course/:courseId" element={<ProfessorCourseDetail />} />
          <Route path="/student/course/:courseId" element={<StudentCourseView />} />
          <Route path="/student/career" element={<StudentCareer />} />
          {/* Fallback route */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 EduAI - Next-Gen Education Platform</p>
        </div>
      </footer>
    </div>
  )
}

export default App