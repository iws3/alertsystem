// components/FloatingAdminAccess.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function FloatingAdminAccess() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const router = useRouter();

  // Set your admin PIN here
  const ADMIN_PIN = 'Leoxa';

  const handleAdminAccess = () => {
    setShowAdminModal(true);
    setAdminPin('');
    setAdminError('');
    setShowPin(false);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsAdminLoading(true);

    // Simulate a brief loading for better UX
    setTimeout(() => {
      if (adminPin === ADMIN_PIN) {
        setShowAdminModal(false);
        router.push('/admin/dashboard');
      } else {
        setAdminError('Invalid PIN. Redirecting to home page...');
        // Redirect to home page after 2 seconds if PIN is wrong
        setTimeout(() => {
          setShowAdminModal(false);
          router.push('/');
        }, 2000);
      }
      setIsAdminLoading(false);
    }, 500);
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminPin('');
    setAdminError('');
    setShowPin(false);
  };

  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  return (
    <>
      {/* Floating Admin Access Button */}
      <button
        onClick={handleAdminAccess}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 focus:outline-none focus:ring-4 focus:ring-purple-500/30 z-50 group"
        title="Admin Access"
        aria-label="Admin Access"
      >
        <Edit3 className="w-6 h-6 mx-auto transition-transform group-hover:scale-110" />
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </button>

      {/* Admin PIN Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Admin Access</h3>
              </div>
              <button
                onClick={closeAdminModal}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
                disabled={isAdminLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label htmlFor="adminPin" className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Admin PIN
                </label>
                <div className="relative">
                  <input
                    id="adminPin"
                    type={showPin ? "text" : "password"}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="••••••••"
                    required
                    maxLength={6}
                    disabled={isAdminLoading}
                    className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 text-center tracking-widest text-lg font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={togglePinVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-600"
                    disabled={isAdminLoading}
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {adminError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeAdminModal}
                  className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={isAdminLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdminLoading || !adminPin}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isAdminLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Access Dashboard'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                🔒 Authorized personnel only
              </p>
              <p className="text-xs text-slate-600 text-center mt-1">
                Emergency Coordination System
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}