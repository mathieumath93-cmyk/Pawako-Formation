import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Shield,
  AlertTriangle,
  RotateCw,
  Search,
  Eye,
  FileText,
  Download,
  Printer,
  BookOpen,
  Play,
  Volume2,
  VolumeX,
  Layers,
  Sparkles
} from 'lucide-react';
import { DocumentPublicInfo } from '../types';
import { AdSlot } from './AdSlot';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  slug: string;
  token: string;
  docInfo: DocumentPublicInfo | null;
  onLockSession?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  slug,
  token,
  docInfo,
  onLockSession
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [jumpPage, setJumpPage] = useState<string>('1');

  // Flipbook state
  const [isFlipbookMode, setIsFlipbookMode] = useState<boolean>(true);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDoublePage, setIsDoublePage] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRefNext = useRef<HTMLCanvasElement>(null);

  // Synthesize page flip rustle sound with Web Audio API
  const playPageFlipSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);
      whiteNoise.connect(filter);
      filter.connect(ctx.destination);
      whiteNoise.start();
    } catch (e) {
      // Ignore audio policy blocks
    }
  };

  // Load PDF document from secure token endpoint
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadingError(null);

    const pdfUrl = `/api/doc/${encodeURIComponent(slug)}/file?token=${encodeURIComponent(token)}`;

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false
    });

    loadingTask.promise
      .then((doc) => {
        if (!isMounted) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('PDF Load Error:', err);
        setLoadingError('Impossible de charger le fichier PDF. La session a expiré.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, token]);

  // Render main page to canvas
  useEffect(() => {
    if (!pdfDoc || currentPage < 1 || currentPage > numPages) return;

    let renderTask: any = null;

    pdfDoc.getPage(currentPage).then((page) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale, rotation });
      const context = canvas.getContext('2d');

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport
      };

      renderTask = page.render(renderContext);
      renderTask.promise.catch((e: any) => {
        if (e.name !== 'RenderingCancelledException') {
          console.error('Page render error:', e);
        }
      });
    });

    // Render second page if double page spread mode is enabled
    if (isDoublePage && currentPage + 1 <= numPages) {
      pdfDoc.getPage(currentPage + 1).then((page2) => {
        const canvas2 = canvasRefNext.current;
        if (!canvas2) return;

        const viewport2 = page2.getViewport({ scale, rotation });
        const context2 = canvas2.getContext('2d');

        if (!context2) return;

        canvas2.height = viewport2.height;
        canvas2.width = viewport2.width;

        const renderContext2 = {
          canvasContext: context2,
          viewport: viewport2
        };

        page2.render(renderContext2);
      });
    }

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, numPages, isDoublePage]);

  // Security Keyboard Handler (Block Ctrl+P, Ctrl+S, Ctrl+U, F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) ||
        (e.metaKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
        alert('Sécurité PAWAKO: L\'impression, l\'enregistrement et l\'inspection sont désactivés pour ce support de cours.');
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      const dir = newPage > currentPage ? 'next' : 'prev';
      setFlipDirection(dir);
      setIsFlipping(true);
      playPageFlipSound();

      setTimeout(() => {
        setCurrentPage(newPage);
        setJumpPage(newPage.toString());
        setIsFlipping(false);
      }, 350);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      handlePageChange(p);
    } else {
      setJumpPage(currentPage.toString());
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    return url;
  };

  const videoEmbed = getEmbedVideoUrl(docInfo?.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ');

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 select-none"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Popunder Ad Slot Injection */}
      <AdSlot position="popunder" adsEnabled={docInfo?.ads_enabled ?? true} />
      
      {/* Social Bar Floating Ad Placement */}
      <AdSlot position="social-bar" adsEnabled={docInfo?.ads_enabled ?? true} />

      {/* Top Security Header Notice */}
      <div className="glass-card rounded-2xl p-4 mb-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-400/10 border border-sky-400/20 text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{docInfo?.title || 'PAWAKO Formation - Support de Cours'}</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-sky-400/10 text-sky-400 border border-sky-400/20 uppercase tracking-wider">
                FLIPPING BOOK ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Mode livre feuilletable sécurisé. Liens publics, impression et téléchargement verrouillés.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onLockSession && (
            <button
              onClick={onLockSession}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center space-x-1"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Verrouiller la Session</span>
            </button>
          )}
        </div>
      </div>

      {/* AdSlot Top Banner Placement */}
      <AdSlot position="top" adsEnabled={docInfo?.ads_enabled ?? true} />

      {/* Main PDF & Flipbook Viewer Control Toolbar */}
      <div className="sticky top-16 z-30 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 mb-4 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-2">
        {/* Page Navigation & Flipbook Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - (isDoublePage ? 2 : 1))}
            disabled={currentPage <= 1 || isLoading}
            className="p-2 rounded-xl bg-sky-400/10 border border-sky-400/30 text-sky-400 hover:bg-sky-400 hover:text-slate-950 disabled:opacity-40 transition font-bold flex items-center space-x-1"
            title="Tourner la page précédente"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Page Précédente</span>
          </button>

          <form onSubmit={handleJumpSubmit} className="flex items-center space-x-1.5 text-xs text-slate-300 px-2">
            <span>Page</span>
            <input
              type="text"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              className="w-10 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-sky-400"
            />
            <span>sur {numPages || '--'}</span>
          </form>

          <button
            onClick={() => handlePageChange(currentPage + (isDoublePage ? 2 : 1))}
            disabled={currentPage >= numPages || isLoading}
            className="p-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 disabled:opacity-40 transition font-bold flex items-center space-x-1 shadow-md shadow-sky-400/20"
            title="Tourner la page suivante"
          >
            <span className="text-xs hidden sm:inline">Feuilleter Suivante</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode & Flipbook Options */}
        <div className="flex items-center space-x-2">
          {/* Flipbook 3D Mode Toggle */}
          <button
            onClick={() => setIsFlipbookMode(!isFlipbookMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              isFlipbookMode
                ? 'bg-sky-400 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
            title="Basculer Mode Flipping Book"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mode Livre</span>
          </button>

          {/* Double Page Spread Toggle */}
          <button
            onClick={() => setIsDoublePage(!isDoublePage)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              isDoublePage
                ? 'bg-sky-400 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
            title="Basculer Double Page / Page Unique"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isDoublePage ? '2 Pages' : '1 Page'}</span>
          </button>

          {/* Sound Effect Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg text-xs transition border ${
              soundEnabled
                ? 'bg-slate-900 text-sky-400 border-sky-400/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Son de feuilletage activé' : 'Son désactivé'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Zoom Controls */}
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom Arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-slate-400 min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom Avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Plein Écran"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flipbook 3D Visual Stage */}
      <div className="relative bg-slate-950 border border-slate-800/80 rounded-3xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[520px] overflow-auto shadow-2xl">
        {isLoading && (
          <div className="flex flex-col items-center space-y-3 py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-xs font-medium">Chargement du livre feuilletable PAWAKO...</p>
          </div>
        )}

        {loadingError && (
          <div className="flex flex-col items-center space-y-3 py-16 text-center max-w-md">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white">Accès au Document Interrompu</h3>
            <p className="text-xs text-slate-400">{loadingError}</p>
            {onLockSession && (
              <button
                onClick={onLockSession}
                className="mt-2 px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                Ré-entrer le Mot de Passe
              </button>
            )}
          </div>
        )}

        {!isLoading && !loadingError && (
          <div className="relative w-full flex flex-col items-center">
            {/* Flipping Book Container */}
            <div 
              className={`relative transition-all duration-300 ease-in-out flex items-center justify-center ${
                isFlipping ? 'scale-[0.98]' : 'scale-100'
              }`}
              style={{
                perspective: '1500px'
              }}
            >
              {/* Flipbook Spine & Shadow Effect */}
              <div 
                className={`relative flex items-center justify-center bg-slate-900/90 rounded-2xl p-3 sm:p-6 shadow-2xl border border-slate-800 ${
                  isDoublePage ? 'max-w-full' : ''
                }`}
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Book Spine Center Line for Double Page */}
                {isDoublePage && (
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 z-20 opacity-80 shadow-inner" />
                )}

                {/* Left Page (in double page mode) or Single Page */}
                <div 
                  className={`relative shadow-2xl bg-white rounded-lg overflow-hidden transition-all duration-500 ${
                    isFlipping && flipDirection === 'prev' ? 'rotate-y-[-15deg] origin-left' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0.2, 0.2, 1)'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="block max-w-full h-auto pointer-events-none select-none"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  />
                  {/* Page Corner Fold Effect */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-slate-300/40 via-transparent to-transparent pointer-events-none shadow-sm" />
                  
                  {/* Watermark Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] select-none font-extrabold text-slate-900 text-xl sm:text-3xl rotate-[-25deg] uppercase font-mono">
                    PAWAKO FORMATION • PROTECTED
                  </div>
                </div>

                {/* Right Page (in double page mode) */}
                {isDoublePage && currentPage + 1 <= numPages && (
                  <div 
                    className={`relative shadow-2xl bg-white rounded-lg overflow-hidden transition-all duration-500 ml-2 ${
                      isFlipping && flipDirection === 'next' ? 'rotate-y-[15deg] origin-right' : ''
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0.2, 0.2, 1)'
                    }}
                  >
                    <canvas
                      ref={canvasRefNext}
                      className="block max-w-full h-auto pointer-events-none select-none"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    />
                    {/* Page Corner Fold Effect */}
                    <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-slate-300/40 via-transparent to-transparent pointer-events-none shadow-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Flip Page Indicator & Next/Prev Turn Prompts */}
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="text-xs text-slate-400 hover:text-sky-400 disabled:opacity-30 transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Page Précédente</span>
              </button>

              <span className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                {isDoublePage
                  ? `Pages ${currentPage}-${Math.min(currentPage + 1, numPages)} / ${numPages}`
                  : `Page ${currentPage} / ${numPages}`}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold disabled:opacity-30 transition flex items-center space-x-1"
              >
                <span>Feuilleter Page Suivante</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AdSlot Inter-Page Banner Placement */}
      <AdSlot position="between-pages" adsEnabled={docInfo?.ads_enabled ?? true} />

      {/* INCLUDED VIDEO TRAINING SECTION */}
      <div className="mt-8 glass-card rounded-3xl p-6 sm:p-8 border border-sky-400/20 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-sky-400/10 border border-sky-400/20 text-sky-400">
            <Play className="w-5 h-5 fill-sky-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase font-mono">
              Vidéo de Formation Intégrée
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Tutoriel & Explication Vidéo du Cours
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Suivez la vidéo explicative associée à ce module de formation pour accompagner votre lecture du support PDF.
        </p>

        {/* Video Player Frame */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
          {videoEmbed ? (
            <iframe
              src={videoEmbed}
              title="PAWAKO Formation Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Play className="w-12 h-12 text-slate-700 mb-2" />
              <p className="text-xs">Aucune URL vidéo spécifiée pour ce document de formation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom AdSlot Placement */}
      <AdSlot position="bottom" adsEnabled={docInfo?.ads_enabled ?? true} />

      {/* Security & Platform Info */}
      <div className="mt-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400 flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          PAWAKO FORMATION • Plateforme Sécurisée & Monétisée
        </p>
        <p>
          Ce support est diffusé via un lecteur Flipbook interactif à jeton d'accès temporaire. Impression et exportation directes désactivées.
        </p>
      </div>
    </div>
  );
};
