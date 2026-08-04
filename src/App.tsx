import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { AdminDashboard } from './components/AdminDashboard';
import { PasswordProtection } from './components/PasswordProtection';
import { PdfViewer } from './components/PdfViewer';
import { AdSlot } from './components/AdSlot';
import { DocumentPublicInfo } from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname);
  
  // Document state for /doc/[slug]
  const [docSlug, setDocSlug] = useState<string | null>(null);
  const [docInfo, setDocInfo] = useState<DocumentPublicInfo | null>(null);
  const [docToken, setDocToken] = useState<string | null>(null);
  const [isLoadingDocInfo, setIsLoadingDocInfo] = useState<boolean>(false);
  const [docInfoError, setDocInfoError] = useState<string | null>(null);

  // Parse path and handle navigation
  const parsePath = (path: string) => {
    setCurrentRoute(path);

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
        throw new Error('Document not found or invalid access URL');
      }
      const data = await res.json();
      setDocInfo(data);
    } catch (err: any) {
      setDocInfoError(err.message || 'Document not found');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar currentRoute={currentRoute} navigate={navigate} />

      {/* Main View Router */}
      <main>
        {/* Route: Home / */}
        {currentRoute === '/' && <HomePage navigate={navigate} />}

        {/* Route: Admin /admin */}
        {currentRoute.startsWith('/admin') && <AdminDashboard navigate={navigate} />}

        {/* Route: Document Viewer /doc/[slug] */}
        {docSlug && (
          <div className="py-6">
            {isLoadingDocInfo && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs font-medium">Fetching document security profile...</p>
              </div>
            )}

            {!isLoadingDocInfo && docInfoError && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md shadow-2xl">
                  <h2 className="text-lg font-bold text-white mb-2">404 - Document Not Found</h2>
                  <p className="text-xs text-slate-400 mb-6">
                    The document slug <code className="text-indigo-400 font-mono">"{docSlug}"</code> does not exist or has been deleted by the administrator.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Back to Home
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
