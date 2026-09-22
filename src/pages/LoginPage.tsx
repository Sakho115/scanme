import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [coordinatorId, setCoordinatorId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coordinatorId.trim()) {
      setError('Please enter your Coordinator ID.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your desk PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login(coordinatorId, pin);
      if (res.success && res.coordinator) {
        // If event coordinator, direct to their assigned event scanner
        if (res.coordinator.role === 'EVENT_COORDINATOR' && res.coordinator.assignedEventSlug) {
          navigate(`/attendance/event/${res.coordinator.assignedEventSlug}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (id: string, p: string) => {
    setCoordinatorId(id);
    setPin(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 safe-top safe-bottom">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 text-white font-black text-2xl mb-3">
            V
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            VYUGAM 2.0
          </h1>
          <div className="inline-block mt-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Attendance & QR Entry System
          </div>
          <h2 className="text-slate-500 text-xs font-semibold mt-2">
            Coordinator & Admin Portal
          </h2>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coordinator Code Input */}
            <div>
              <label htmlFor="coordId" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Coordinator ID / Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="coordId"
                  type="text"
                  value={coordinatorId}
                  onChange={(e) => setCoordinatorId(e.target.value.toUpperCase())}
                  placeholder="e.g. ADMIN-01, CR-CODE"
                  className="w-full pl-10 pr-3.5 py-3 text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 uppercase transition-all"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label htmlFor="pin" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={8}
                  className="w-full pl-10 pr-3.5 py-3 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 transition-all"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="touch-target w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="uppercase tracking-wider text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Development Accounts
              </span>
              <span>Quick Login:</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN-01', '1234')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                <span className="font-bold text-blue-700 block">ADMIN-01</span>
                <span className="text-[10px] text-slate-500">Sakho115 (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CR-OVERALL', '1234')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                <span className="font-bold text-emerald-700 block">CR-OVERALL</span>
                <span className="text-[10px] text-slate-500">Overall Gate Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CR-CODE', '1234')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                <span className="font-bold text-slate-800 block">CR-CODE</span>
                <span className="text-[10px] text-slate-500">Code Crusade</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CR-LOGIC', '1234')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                <span className="font-bold text-slate-800 block">CR-LOGIC</span>
                <span className="text-[10px] text-slate-500">Logic Arena</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CR-UIUX', '1234')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                <span className="font-bold text-slate-800 block">CR-UIUX</span>
                <span className="text-[10px] text-slate-500">UI/UX Studio</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CR-TECH', '1234')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                <span className="font-bold text-slate-800 block">CR-TECH</span>
                <span className="text-[10px] text-slate-500">Tech Tactics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Authorized event coordinators only • Supabase Auth & RLS</span>
        </div>
      </div>
    </div>
  );
};
