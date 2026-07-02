// src/components/OnboardingGate.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { userApi, type UserRole } from '../api/user';
import { GraduationCap, BookOpen, Briefcase, Loader2, ArrowRight } from 'lucide-react';

const DEST: Record<UserRole, string> = {
  student: '/student/dashboard',
  professor: '/professor/dashboard',
  hiring: '/student/jobs',
};

/**
 * Shown as a full-screen overlay once, right after a user first signs in, until
 * they pick a role. Reads GET /user/me; if `onboarded` is false, forces the
 * choice and POSTs it to /user/role.
 */
export function OnboardingGate() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'needed' | 'done'>('loading');
  const [saving, setSaving] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await userApi.getMe(token || undefined);
        if (!cancelled) setStatus(res.data?.onboarded ? 'done' : 'needed');
      } catch {
        // Don't block the app if the check fails.
        if (!cancelled) setStatus('done');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const pick = async (role: UserRole) => {
    setSaving(role);
    try {
      const token = await getToken();
      await userApi.setRole(role, token || undefined);
      setStatus('done');
      navigate(DEST[role]);
    } catch {
      setSaving(null);
    }
  };

  if (status !== 'needed') return null;

  const cards: Array<{ role: UserRole; icon: typeof BookOpen; title: string; desc: string }> = [
    { role: 'student', icon: BookOpen, title: 'Student', desc: 'Learn with AI courses, tutors, and practice problems' },
    { role: 'professor', icon: GraduationCap, title: 'Professor', desc: 'Create AI-powered courses and practice sets' },
    { role: 'hiring', icon: Briefcase, title: 'Recruiter', desc: 'Post jobs and review applicants' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome! How will you use EduAI?</h1>
          <p className="text-gray-400 mt-2">Pick your role to get started.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map(({ role, icon: Icon, title, desc }) => (
            <button
              key={role}
              onClick={() => pick(role)}
              disabled={saving !== null}
              className="text-left bg-slate-800/60 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/60 hover:bg-slate-800 transition-all disabled:opacity-60"
            >
              <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-4">
                <Icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400 mt-1">{desc}</p>
              <div className="mt-4 text-sm text-indigo-400 font-medium inline-flex items-center gap-1">
                {saving === role ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
