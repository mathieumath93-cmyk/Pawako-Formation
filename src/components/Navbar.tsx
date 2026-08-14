import React, { useState } from 'react';
import { Shield, Lock, FileText, Settings, Key, ExternalLink, Search, Film, Tv, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const [quickSlug, setQuickSlug] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  const isDocView = currentRoute.startsWith('/doc/');

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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
                F
              </div>
              <div>
                <span className="text-lg font-black text-white tracking-tight uppercase">
                  FLEMIX
                </span>
                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Streaming HD
                </span>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isDocView ? (
                /* Button to go to Flemix Streaming when viewing a PDF */
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
                >
                  <Film className="w-4 h-4" />
                  <span>🎬 Accéder au Streaming Flemix</span>
                </button>
              ) : (
                /* Pure Streaming Site Navbar Actions */
                <button
                  onClick={() => navigate('/')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 bg-red-600 text-white shadow-md shadow-red-600/30"
                >
                  <Film className="w-3.5 h-3.5 text-red-200" />
                  <span>Catalogue Streaming</span>
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
                <Key className="w-4 h-4 text-sky-400" />
                Accès Document Privé
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
                Saisissez le slug ou code d'accès de la formation ou du document PDF.
              </p>
              <input
                type="text"
                placeholder="ex: formation-vente-management"
                value={quickSlug}
                onChange={(e) => setQuickSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-sky-400/30"
                >
                  Ouvrir le Cours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

