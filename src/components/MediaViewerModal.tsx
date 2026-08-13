import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Film,
  Tv,
  Star,
  Eye,
  Share2,
  Check,
  Maximize2,
  Sparkles,
  Layers,
  Info,
  Calendar
} from 'lucide-react';
import { MediaItem, Season, Episode } from '../types';
import { AdSlot } from './AdSlot';

interface MediaViewerModalProps {
  media: MediaItem | null;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ media, onClose }) => {
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (media) {
      // Register view on backend
      fetch(`/api/media/${media.id}`).catch(() => {});

      if (media.type === 'series' && media.seasons && media.seasons.length > 0) {
        const firstSeason = media.seasons[0];
        setSelectedSeasonNum(firstSeason.season_number);
        if (firstSeason.episodes && firstSeason.episodes.length > 0) {
          setSelectedEpisode(firstSeason.episodes[0]);
        }
      } else {
        setSelectedEpisode(null);
      }
    }
  }, [media]);

  if (!media) return null;

  const currentSeasons = media.seasons || [];
  const activeSeason = currentSeasons.find(s => s.season_number === selectedSeasonNum) || currentSeasons[0];

  // Determine active video stream URL
  let currentStreamUrl = media.stream_url || '';
  if (media.type === 'series' && selectedEpisode) {
    currentStreamUrl = selectedEpisode.stream_url;
  }

  // Handle format embedding (convert watch URLs to embed if necessary)
  const getCleanEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  const finalStreamUrl = getCleanEmbedUrl(currentStreamUrl);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?media=${media.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
        
        {/* Top Header Modal Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-400/10 border border-sky-400/20 text-sky-400 rounded-xl">
              {media.type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-400/10 text-sky-400 border border-sky-400/20 uppercase tracking-wider font-mono">
                  {media.type === 'movie' ? 'Film Stream' : 'Série TV'}
                </span>
                {media.quality_badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 uppercase font-mono">
                    {media.quality_badge}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">{media.release_year}</span>
              </div>
              <h2 className="text-lg font-bold text-white leading-tight line-clamp-1">{media.title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition flex items-center space-x-1 text-xs"
              title="Partager le lien"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copié !' : 'Partager'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Ad Slot Banner */}
          <AdSlot position="top" />

          {/* Main Video Player Canvas */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
            {finalStreamUrl ? (
              <iframe
                src={finalStreamUrl}
                title={media.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                <Film className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-slate-300">Aucun lien de streaming disponible pour ce titre</p>
                <p className="text-xs text-slate-500 mt-1">L'administrateur ajoutera le lien sous peu.</p>
              </div>
            )}
          </div>

          {/* Player Helper Info Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Lecteur Média Intégré •{' '}
                {media.type === 'series' && selectedEpisode
                  ? `S0${selectedEpisode.season_number}E${selectedEpisode.episode_number < 10 ? '0' : ''}${selectedEpisode.episode_number} : ${selectedEpisode.title}`
                  : 'Version Film Complète'}
              </span>
            </div>
            <div className="flex items-center space-x-3 font-mono text-[11px]">
              <span className="text-sky-400">★ {media.rating || '4.8/5'}</span>
              <span>{media.views_count} Vues</span>
            </div>
          </div>

          {/* Middle Ad Slot */}
          <AdSlot position="between-pages" />

          {/* Series Season & Episode Selector */}
          {media.type === 'series' && currentSeasons.length > 0 && (
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Saisons & Épisodes</span>
                </h3>

                {/* Season Switcher Pills */}
                <div className="flex space-x-1.5 overflow-x-auto">
                  {currentSeasons.map((season) => (
                    <button
                      key={season.season_number}
                      onClick={() => {
                        setSelectedSeasonNum(season.season_number);
                        if (season.episodes && season.episodes.length > 0) {
                          setSelectedEpisode(season.episodes[0]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedSeasonNum === season.season_number
                          ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/20 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {season.title || `Saison ${season.season_number}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Episode Grid */}
              {activeSeason && activeSeason.episodes && activeSeason.episodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {activeSeason.episodes.map((ep) => {
                    const isSelected = selectedEpisode?.id === ep.id;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setSelectedEpisode(ep)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-400/10 border-sky-400 text-white shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-mono text-sky-400 block">
                              Épisode {ep.episode_number}
                            </span>
                            <span className="text-xs font-semibold block truncate">{ep.title}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Aucun épisode répertorié pour cette saison.</p>
              )}
            </div>
          )}

          {/* Synopsis & Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Synopsis & Histoire</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {media.description || "Aucun synopsis détaillé fourni."}
              </p>
            </div>

            <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs">
              <h4 className="font-bold text-white">Fiche Technique</h4>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Genre :</span>
                  <span className="text-slate-200 font-semibold">{media.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sortie :</span>
                  <span className="text-slate-200 font-semibold">{media.release_year}</span>
                </div>
                <div className="flex justify-between">
                  <span>Note :</span>
                  <span className="text-amber-400 font-semibold">★ {media.rating || '4.8/5'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Qualité :</span>
                  <span className="text-emerald-400 font-semibold">{media.quality_badge || 'HD'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Ad Slot */}
          <AdSlot position="bottom" />

        </div>

      </div>
    </div>
  );
};
