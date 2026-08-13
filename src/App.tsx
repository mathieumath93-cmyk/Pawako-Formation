import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StreamingHub } from './components/StreamingHub';
import { HomePage } from './components/HomePage';
import { AdminDashboard } from './components/AdminDashboard';
import { PasswordProtection } from './components/PasswordProtection';
import { PdfViewer } from './components/PdfViewer';
import { AdSlot } from './components/AdSlot';
import { DocumentPublicInfo } from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname);
  
  // Query param for initial media modal
  const [initialMediaId, setInitialMediaId] = useState<string | null>(null);

  // Document state for /doc/[slug]
  const [docSlug, setDocSlug] = useState<string | null>(null);
  const [docInfo, setDocInfo] = useState<DocumentPublicInfo | null>(null);
  const [docToken, setDocToken] = useState<string | null>(null);
  const [isLoadingDocInfo, setIsLoadingDocInfo] = useState<boolean>(false);
  const [docInfoError, setDocInfoError] = useState<string | null>(null);

  // Parse path and handle navigation
  const parsePath = (path: string) => {
    setCurrentRoute(path);

    // Check media query param (e.g. /?media=media-seed-001)
    const urlParams = new URLSearchParams(window.location.search);
    const mediaId = urlParams.get('media');
    setInitialMediaId(mediaId);

    // Check if route is /doc/[slug]
    const docMatch = path.match(/^\/doc\/([a-zA-Z0-9_-]+)/);
    if (docMatch) {
      const slug = docMatch[1];
      setDocSlug(slug);
      
      // Check if session token already stored in session storage for this slug
      const savedToken = sessionStorage.getItem(`docvault_token_${slug}`);
      if (savedToken) {
        setDocToken(savedToken);
      } else {
        setDocToken(null);
      }

      fetchDocInfo(slug);
    } else {
      setDocSlug(null);
      setDocInfo(null);
      setDocToken(null);
    }
  };

  const fetchDocInfo = async (slug: string) => {
    setIsLoadingDocInfo(true);
    setDocInfoError(null);

    try {
      const res = await fetch(`/api/doc/${encodeURIComponent(slug)}/info`);
      if (!res.ok) {
        throw new Error('Document introuvable ou URL invalide');
      }
      const data = await res.json();
      setDocInfo(data);
    } catch (err: any) {
      setDocInfoError(err.message || 'Document introuvable');
    } finally {
      setIsLoadingDocInfo(false);
    }
  };

  useEffect(() => {
    parsePath(window.location.pathname);

    const handlePopState = () => {
      parsePath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    window.history.pushState({}, '', route);
    parsePath(route);
  };

  const handlePasswordSuccess = (token: string, updatedInfo?: DocumentPublicInfo) => {
    setDocToken(token);
    if (docSlug) {
      sessionStorage.setItem(`docvault_token_${docSlug}`, token);
    }
    if (updatedInfo) {
      setDocInfo(updatedInfo);
    }
  };

  const handleLockSession = () => {
    setDocToken(null);
    if (docSlug) {
      sessionStorage.removeItem(`docvault_token_${docSlug}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar currentRoute={currentRoute} navigate={navigate} />

      {/* Main View Router */}
      <main>
        {/* Route: Home / Streaming Catalog (Flemix) */}
        {(currentRoute === '/' || currentRoute === '/streaming') && !docSlug && (
          <StreamingHub navigate={navigate} initialMediaId={initialMediaId} />
        )}

        {/* Route: Documents / Cours PDF (/docs) */}
        {currentRoute === '/docs' && !docSlug && (
          <HomePage navigate={navigate} />
        )}

        {/* Route: Admin /admin */}
        {currentRoute.startsWith('/admin') && (
          <AdminDashboard navigate={navigate} />
        )}

        {/* Route: Document Viewer /doc/[slug] */}
        {docSlug && (
          <div className="py-6">
            {isLoadingDocInfo && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
                <div className="w-10 h-10 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
                <p className="text-xs font-medium">Chargement du profil de sécurité du document...</p>
              </div>
            )}

            {!isLoadingDocInfo && docInfoError && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md shadow-2xl">
                  <h2 className="text-lg font-bold text-white mb-2">404 - Document Introuvable</h2>
                  <p className="text-xs text-slate-400 mb-6">
                    Le slug de cours <code className="text-sky-400 font-mono">"{docSlug}"</code> n'existe pas ou a été supprimé par l'administrateur.
                  </p>
                  <button
                    onClick={() => navigate('/docs')}
                    className="px-5 py-2.5 bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-sky-400/20"
                  >
                    Voir tous les cours PDF
                  </button>
                </div>
              </div>
            )}

            {!isLoadingDocInfo && !docInfoError && (
              <>
                {!docToken ? (
                  <PasswordProtection
                    docInfo={docInfo}
                    slug={docSlug}
                    onSuccess={handlePasswordSuccess}
                  />
                ) : (
                  <PdfViewer
                    slug={docSlug}
                    token={docToken}
                    docInfo={docInfo}
                    onLockSession={handleLockSession}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Global Ad Slots (Popunder & Floating Social Bar) */}
      <AdSlot position="popunder" />
      <AdSlot position="social-bar" />
    </div>
  );
}

