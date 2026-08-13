import React, { useState, useEffect } from 'react';
import {
  Film,
  Tv,
  Search,
  Play,
  Star,
  Sparkles,
  Flame,
  Filter,
  Eye,
  Plus,
  Compass,
  Zap,
  Tag
} from 'lucide-react';
import { MediaItem } from '../types';
import { MediaViewerModal } from './MediaViewerModal';
import { AdSlot } from './AdSlot';

interface StreamingHubProps {
  navigate: (route: string) => void;
  initialMediaId?: string | null;
}

const GENRES = [
  'Tous',
  'Science-Fiction',
  'Animation / SF',
  'Thriller / SF',
  'Horreur / Drame',
  'Action',
  'Comédie',
  'Aventure',
  'Documentaire'
];

export const StreamingHub: React.FC<StreamingHubProps> = ({ navigate, initialMediaId }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedGenre, setSelectedGenre] = useState('Tous');
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/media')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMediaList(data);
          // If initialMediaId was passed in query URL
          if (initialMediaId) {
            const found = data.find(m => m.id === initialMediaId);
            if (found) setActiveMedia(found);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [initialMediaId]);

  // Filter media items
  const filteredMedia = mediaList.filter((item) => {
    // Type filter
    if (activeTypeTab === 'movie' && item.type !== 'movie') return false;
    if (activeTypeTab === 'series' && item.type !== 'series') return false;

    // Genre filter
    if (selectedGenre !== 'Tous' && !item.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchGenre = item.genre.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      return matchTitle || matchGenre || matchDesc;
    }

    return true;
  });

  const featuredMedia = mediaList.find((m) => m.featured) || mediaList[0];

  return (
    <div className="min-h-screen text-slate-100 pb-20">
      
      {/* Hero Banner Flemix Streaming */}
      {featuredMedia && (
        <section className="relative w-full h-[380px] sm:h-[480px] overflow-hidden">
          {/* Background Poster/Banner Image with Dark Gradient Vignette */}
          <div className="absolute inset-0">
            <img
              src={featuredMedia.banner_url || featuredMedia.poster_url}
              alt={featuredMedia.title}
              className="w-full h-full object-cover object-center opacity-40 scale-105 filter blur-[2px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 relative z-10 flex items-center">
            <div className="max-w-2xl space-y-4">
              
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white uppercase tracking-wider font-mono shadow-lg shadow-red-600/30">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>En Vedette sur FLEMIX</span>
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-400/20 text-sky-400 border border-sky-400/30 font-mono">
                  {featuredMedia.quality_badge || '4K Ultra HD'}
                </span>
                <span className="text-xs text-slate-300 font-mono">{featuredMedia.release_year}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {featuredMedia.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
                {featuredMedia.description}
              </p>

              <div className="pt-2 flex items-center space-x-4">
                <button
                  onClick={() => setActiveMedia(featuredMedia)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition shadow-xl shadow-red-600/40 flex items-center space-x-2 hover:scale-105 active:scale-95 transform"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Regarder Maintenant</span>
                </button>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-slate-200">{featuredMedia.rating || '4.8/5'}</span>
                  <span>•</span>
                  <span>{featuredMedia.genre}</span>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Search & Filter Controls Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Rechercher un film ou une série..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          </div>

          {/* Type Selector Tabs (Tous, Films, Séries) */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-full md:w-auto justify-center">
            <button
              onClick={() => setActiveTypeTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTypeTab === 'all'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous les Contenus
            </button>
            <button
              onClick={() => setActiveTypeTab('movie')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTypeTab === 'movie'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Films</span>
            </button>
            <button
              onClick={() => setActiveTypeTab('series')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTypeTab === 'series'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Séries TV</span>
            </button>
          </div>

        </div>

        {/* Genre Pills Slider */}
        <div className="flex items-center space-x-2 overflow-x-auto py-3 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono shrink-0 mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Genre :</span>
          </span>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedGenre === g
                  ? 'bg-sky-400/20 text-sky-400 border border-sky-400/40 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Top Banner Ad Slot */}
      <div className="max-w-7xl mx-auto px-4 my-4">
        <AdSlot position="top" />
      </div>

      {/* Main Catalog Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-red-500" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {activeTypeTab === 'movie' ? 'Catalogue de Films' : activeTypeTab === 'series' ? 'Séries & Épisodes' : 'Films & Séries Récents'}
            </h2>
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
              {filteredMedia.length} titres
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[2/3] bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveMedia(item)}
                className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80 hover:border-red-500/50 transition-all duration-300 shadow-xl cursor-pointer hover:-translate-y-1"
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    loading="lazy"
                  />
                  
                  {/* Quality & Type Overlay Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-red-400 text-[10px] font-bold uppercase tracking-wider font-mono border border-red-500/20">
                      {item.type === 'movie' ? 'FILM' : 'SÉRIE'}
                    </span>
                    {item.quality_badge && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/80 text-white text-[9px] font-bold font-mono">
                        {item.quality_badge}
                      </span>
                    )}
                  </div>

                  {/* Rating Tag */}
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 font-mono border border-slate-800 flex items-center space-x-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{item.rating || '4.8'}</span>
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info Card Body */}
                <div className="p-3">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1">{item.genre}</span>
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                    {item.title}
                  </h3>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">{item.release_year}</span>
                    <span className="text-[10px] text-slate-500">{item.views_count} vues</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Aucun film ou série ne correspond à votre recherche</h3>
            <p className="text-xs text-slate-500 mb-4">Essayez un autre mot-clé ou réinitialisez le filtre de genre.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedGenre('Tous'); setActiveTypeTab('all'); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </main>

      {/* Bottom Ad Slot */}
      <div className="max-w-7xl mx-auto px-4 my-8">
        <AdSlot position="bottom" />
      </div>

      {/* Native Video Player Modal */}
      {activeMedia && (
        <MediaViewerModal
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
        />
      )}

    </div>
  );
};
