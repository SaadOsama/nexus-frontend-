import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLogin } from "@/api/client/auth";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // useLogin dispatches loginSuccess to Redux (requirement #5) and saves
  // the token under the "iccd_token" key that both the axios interceptor
  // and ProtectedRoute rely on. Navigation is handled here, by role,
  // instead of inside the hook, since where to go depends on this screen.
  const { userLoginAsync, isPending: loading } = useLogin({
    onSuccess: (response) => {
      const user = response?.data?.user;
      if (onLoginSuccess) onLoginSuccess(user);
      navigate(user?.role === 'admin' ? '/admin' : '/overview');
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      // No client-guessed "role" sent — the backend looks the user up by
      // email/password alone and returns whatever role is actually on
      // their account. Guessing role from the email string used to break
      // login for any real admin whose email didn't contain "admin".
      await userLoginAsync({ email, password });
    } catch {
      // onError above already set the error message.
    }
  };

  const isAdminEmail = email.toLowerCase().includes('admin');

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="w-full max-w-5xl h-full max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* Left Branding */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#0f9f59] p-8 xl:p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              PROJECT NEXUS
            </span>
            <h2 className="text-2xl xl:text-4xl font-extrabold mt-6 leading-tight tracking-tight">
              {isAdminEmail ? 'Control & Manage the Platform' : 'Build what matters with the right people.'}
            </h2>
          </div>

          <div className="relative z-10 pt-8">
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {isAdminEmail ? <ShieldCheck className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
              </div>
              <div className="text-xs">
                <p className="font-bold text-white uppercase tracking-wider">Logging in as</p>
                {/* This banner is cosmetic only now — a hint based on what
                    they've typed so far, not something sent to the server. */}
                <p className="text-emerald-100 capitalize font-medium">{isAdminEmail ? 'admin' : 'user'} Mode Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center bg-white overflow-y-auto">
          <div className="max-w-md w-full mx-auto space-y-4 sm:space-y-5">

            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Please enter your credentials to continue.</p>
            </div>

            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@nexus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0f9f59]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0f9f59]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: isAdminEmail ? '#0f172a' : '#0f9f59' }}
                className="w-full text-white text-sm font-bold py-3 sm:py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 mt-2 sm:mt-4 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 font-medium">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/signup')} className="text-[#0f9f59] font-bold hover:underline cursor-pointer">
                Sign Up
              </button>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
