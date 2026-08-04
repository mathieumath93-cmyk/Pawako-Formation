import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, AlertCircle, ArrowRight, Eye, EyeOff, FileText, Eye as EyeIcon } from 'lucide-react';
import { DocumentPublicInfo } from '../types';

interface PasswordProtectionProps {
  docInfo: DocumentPublicInfo | null;
  slug: string;
  onSuccess: (token: string, updatedInfo?: DocumentPublicInfo) => void;
}

export const PasswordProtection: React.FC<PasswordProtectionProps> = ({
  docInfo,
  slug,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/doc/${encodeURIComponent(slug)}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (data.success && data.token) {
        onSuccess(data.token, data.docInfo);
      } else {
        setErrorMessage(data.message || 'Incorrect password. Please try again.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
      }
    } catch (err) {
      setErrorMessage('Network error while verifying password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div 
        className={`w-full max-w-md relative glass-card rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
          isShaking ? 'animate-bounce border-rose-500/50' : ''
        }`}
      >
        {/* Top Glow Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-sky-400/10 border border-sky-400/20 text-sky-400 mb-4 shadow-inner">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>

          <span className="block text-[11px] font-bold uppercase tracking-widest text-sky-400 mb-1 font-mono">
            Protected Document Access
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {docInfo ? docInfo.title : 'Protected Document'}
          </h2>

          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {docInfo?.description || 'This document is protected with a private password. Enter password below to decrypt and view.'}
          </p>
        </div>

        {/* Document Quick Stats */}
        {docInfo && (
          <div className="flex justify-center items-center space-x-4 mb-6 py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Slug: <strong className="text-slate-200 font-mono">{docInfo.unique_slug}</strong></span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{docInfo.views_count} views</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex justify-between">
              <span>Document Password</span>
              <span className="text-[10px] text-slate-500 font-mono">Bcrypt DRM</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400 transition pr-10"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 px-4 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-400/20 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Decrypting Session...</span>
              </span>
            ) : (
              <>
                <span>Unlock & View PDF</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Signed temporary streaming token issued upon unlock</span>
        </div>
      </div>
    </div>
  );
};
