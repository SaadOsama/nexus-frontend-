import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
// ✅ Fix (goes up 2 levels from src/components/Auth/ to reach root api)
import { useRegister } from "@/api/client/auth";

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { addRegisterAsync, isPending: loading } = useRegister({
    onSuccess: () => {
      setSuccess('Account registered successfully! Redirecting to login...');
      setFullName('');
      setEmail('');
      setPassword('');
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong during sign up!');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      await addRegisterAsync({ fullName, email, password });
    } catch {
      // onError above already set the error message.
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="w-full max-w-5xl h-full max-h-[94vh] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* Left Branding Banner */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#0f9f59] p-8 xl:p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              PROJECT NEXUS
            </span>
            <h2 className="text-2xl xl:text-4xl font-extrabold mt-6 leading-tight tracking-tight">
              Start your journey with Nexus.
            </h2>
            <p className="text-emerald-100/90 text-sm mt-4 leading-relaxed font-normal">
              Join thousands of innovators building impactful tech projects, connecting with advisors, and growing.
            </p>
          </div>

          <div className="relative z-10 pt-8">
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white uppercase tracking-wider">Account Creation</p>
                <p className="text-emerald-100 font-medium">Standard User Account</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center bg-white overflow-y-auto">
          <div className="max-w-md w-full mx-auto space-y-4 sm:space-y-5">

            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create an account
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your details to create your Nexus user account.
              </p>
            </div>

            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#0f9f59] rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Jordan Lee"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f9f59] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="jordan@nexus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f9f59] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f9f59] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full bg-[#0f9f59] text-white text-sm font-bold py-3 sm:py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 font-medium">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-[#0f9f59] font-bold hover:underline cursor-pointer">
                Sign In
              </button>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
