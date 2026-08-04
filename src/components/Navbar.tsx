import React, { useState } from 'react';
import { Shield, Lock, FileText, Settings, Key, ExternalLink, Search } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const [quickSlug, setQuickSlug] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSlug.trim()) return;
    const cleanSlug = quickSlug.trim().toLowerCase().replace(/^\/doc\//, '');
    navigate(`/doc/${cleanSlug}`);
    setShowSearchModal(false);
    setQuickSlug('');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-sky-400/20 group-hover:scale-105 transition-transform duration-200">
                P
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight uppercase">
                  PAWAKO <span className="text-sky-400">FORMATION</span>
                </span>
                <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20 uppercase tracking-wider">
                  FlipBook DRM
                </span>
              </div>
            </div>

            {/* Quick Link Input / Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Enter document access code or slug..."
                  value={quickSlug}
                  onChange={(e) => setQuickSlug(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-24 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1 px-3 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 text-[11px] font-bold rounded-lg transition"
                >
                  Access
                </button>
              </form>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
                title="Enter access code"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 ${
                  currentRoute === '/'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              {!currentRoute.startsWith('/doc/') && (
                <button
                  onClick={() => navigate('/admin')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    currentRoute.startsWith('/admin')
                      ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-sky-400 group-hover:text-slate-950" />
                  <span>Espace Admin</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Access Private Document
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSearchSubmit}>
              <p className="text-xs text-slate-400 mb-3">
                Enter the unique URL slug or access code provided by the document owner.
              </p>
              <input
                type="text"
                placeholder="e.g. q3-financials-2026"
                value={quickSlug}
                onChange={(e) => setQuickSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  Open Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
