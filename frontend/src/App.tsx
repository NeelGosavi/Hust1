// src/App.tsx
import { Routes, Route, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, RedirectToSignIn } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { apiClient, setupInterceptors } from './api/client';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorCourseDetail from './pages/ProfessorCourseDetail';
import ProfessorCourses from './pages/ProfessorCourses';
import ProfessorPractice from './pages/ProfessorPractice';
import StudentCourseView from './pages/StudentCourseView';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentMyCourses from './pages/StudentMyCourses';
import StudentPractice from './pages/StudentPractice';
import StudentPracticeProblem from './pages/StudentPracticeProblem';
import StudentCareer from './pages/StudentCareer';
import StudentJobs from './pages/StudentJobs';
import StudentJobDetail from './pages/StudentJobDetail';
import StudentApplications from './pages/StudentApplications';
import StudentResume from './pages/StudentResume';
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  Code, 
  Briefcase,
  Menu,
  X
} from 'lucide-react';

function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Education Platform</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Next-Gen
          <span className="text-blue-400"> Education</span>
        </h1>
        
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Empowering Professors with AI course generation. Elevating Students with 
          interactive RAG Tutors and intelligent Career Growth.
        </p>
        
        {!isSignedIn && (
          <div className="mt-8">
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignInButton>
          </div>
        )}
      </div>

      {/* Role Cards */}
      <SignedIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link 
            to="/professor/dashboard" 
            className="group bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 hover:bg-slate-800 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Professor</h3>
                <p className="text-sm text-gray-400 mt-1">Create AI-powered courses</p>
                <div className="mt-3 text-sm text-blue-400 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/student/dashboard" 
            className="group bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Student</h3>
                <p className="text-sm text-gray-400 mt-1">Learn with AI tutors & practice</p>
                <div className="mt-3 text-sm text-emerald-400 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          <Link 
            to="/student/practice" 
            className="group bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-purple-500/50 hover:bg-slate-800 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <Code className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Practice Hub</h3>
                <p className="text-sm text-gray-400 mt-1">Solve DSA & interview problems</p>
                <div className="mt-3 text-sm text-purple-400 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Start Practicing
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </SignedIn>

      {/* Features Section */}
      <div className="border-t border-slate-700/50 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-semibold text-white">AI Course Generation</h4>
            <p className="text-sm text-gray-400 mt-1">Create courses instantly with AI</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="font-semibold text-white">Interactive Learning</h4>
            <p className="text-sm text-gray-400 mt-1">Engaging content with RAG tutors</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-semibold text-white">Career Growth</h4>
            <p className="text-sm text-gray-400 mt-1">Smart career guidance and tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-900 border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              AI
            </div>
            <span className="text-xl font-bold text-white">
              Edu<span className="text-blue-400">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isSignedIn && (
              <>
                <Link 
                  to="/student/dashboard" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Student
                </Link>
                <Link 
                  to="/professor/dashboard" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Professor
                </Link>
                <Link 
                  to="/student/career" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Career
                </Link>
              </>
            )}
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-400" />
            ) : (
              <Menu className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50">
            <div className="flex flex-col gap-3">
              {isSignedIn ? (
                <>
                  <Link 
                    to="/student/dashboard" 
                    className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Student Dashboard
                  </Link>
                  <Link 
                    to="/professor/dashboard" 
                    className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Professor Dashboard
                  </Link>
                  <Link 
                    to="/student/career" 
                    className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Career Center
                  </Link>
                  <div className="pt-2 border-t border-slate-700/50">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetchToken = async () => {
    try {
      if (!isSignedIn) return null;
      const token = await getToken();
      return token;
    } catch (error) {
      console.warn("Could not fetch Clerk token", error);
      return null;
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    
    const interceptorId = setupInterceptors(fetchToken);
    
    return () => {
      if (interceptorId !== undefined) {
        apiClient.interceptors.request.eject(interceptorId);
      }
    };
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Professor Routes */}
          <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
          <Route path="/professor/courses" element={<ProfessorCourses />} />
          <Route path="/professor/course/:courseId" element={<ProfessorCourseDetail />} />
          <Route path="/professor/practice" element={<ProfessorPractice />} />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/my-courses" element={<StudentMyCourses />} />
          <Route path="/student/course/:courseId" element={<StudentCourseView />} />
          <Route path="/student/practice" element={<StudentPractice />} />
          <Route path="/student/practice/:problemId" element={<StudentPracticeProblem />} />
          <Route path="/student/career" element={<StudentCareer />} />
          <Route path="/student/jobs" element={<StudentJobs />} />
          <Route path="/student/jobs/:jobId" element={<StudentJobDetail />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/resume" element={<StudentResume />} />
          
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 EduAI - Next-Gen Education Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;