import React, { useEffect, useRef, useState } from 'react';
import { AdPosition, AdSettings } from '../types';
import { Sparkles, DollarSign, Bell } from 'lucide-react';

interface AdSlotProps {
  position: AdPosition;
  adsEnabled?: boolean;
}

export const AdSlot: React.FC<AdSlotProps> = ({ position, adsEnabled = true }) => {
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/ad-settings')
      .then((res) => res.json())
      .then((data: AdSettings) => setSettings(data))
      .catch((err) => console.error('Failed to load ad settings:', err));
  }, []);

  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  if (!adsEnabled || isAdminRoute || (settings && !settings.globalAdsEnabled)) {
    return null;
  }

  let rawScript = '';
  if (settings) {
    if (position === 'top') rawScript = settings.adsterraTopScript;
    else if (position === 'bottom') rawScript = settings.adsterraBottomScript;
    else if (position === 'between-pages') rawScript = settings.adsterraBetweenScript;
    else if (position === 'popunder') rawScript = settings.adsterraPopunderScript;
    else if (position === 'social-bar') rawScript = settings.adsterraSocialBarScript;
  }

  // Inject user scripts into container safely if custom HTML provided
  useEffect(() => {
    if (adRef.current && rawScript && rawScript.includes('<script')) {
      adRef.current.innerHTML = rawScript;
      // Re-run inline scripts
      const scripts = adRef.current.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const s = document.createElement('script');
        if (scripts[i].src) {
          s.src = scripts[i].src;
        } else {
          s.textContent = scripts[i].textContent;
        }
        document.body.appendChild(s);
      }
    }
  }, [rawScript]);

  // Special rendering for Floating Social Bar
  if (position === 'social-bar') {
    return (
      <div className="fixed bottom-4 left-4 z-40 max-w-sm pointer-events-auto" id="ad-slot-social-bar">
        <div className="glass-card p-3 rounded-2xl shadow-2xl border border-sky-400/30 backdrop-blur-xl flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-sky-400/10 border border-sky-400/20 text-sky-400 shrink-0">
            <Bell className="w-4 h-4 animate-bounce text-sky-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                Adsterra Social Bar
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Offres & Formations PAWAKO
            </p>
          </div>
          <span className="text-[9px] bg-sky-400/20 text-sky-300 font-mono px-2 py-0.5 rounded-full">
            AD
          </span>
        </div>
        {rawScript && <div ref={adRef} />}
      </div>
    );
  }

  // Special rendering for Popunder
  if (position === 'popunder') {
    return (
      <div id="ad-slot-popunder" className="hidden">
        {rawScript ? (
          <div ref={adRef} />
        ) : (
          <script dangerouslySetInnerHTML={{ __html: `console.log('Adsterra Popunder Ready');` }} />
        )}
      </div>
    );
  }

  return (
    <div className="w-full my-4 px-2 select-none" id={`ad-slot-${position}`}>
      <div className="relative overflow-hidden rounded-xl glass-card p-4 shadow-lg transition-all border border-sky-400/20 hover:border-sky-400/40">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase font-mono">
              Espace Publicitaire Adsterra ({position})
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
            <DollarSign className="w-3 h-3 text-sky-400" />
            <span>Monétisation Adsterra Active</span>
          </div>
        </div>

        {/* Custom Adsterra Script Output Container */}
        {rawScript && rawScript.includes('<script') ? (
          <div ref={adRef} className="flex justify-center items-center my-2" />
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {position === 'top' && 'Bannière Haute Adsterra (Leaderboard 728x90)'}
                  {position === 'bottom' && 'Bannière Basse Adsterra (300x250 Canvas)'}
                  {position === 'between-pages' && 'Bannière In-Book Adsterra (Entre les pages)'}
                  {position === 'sidebar' && 'Bannière Latérale Adsterra'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Prêt pour l'insertion de vos scripts de monétisation Adsterra
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-sky-400/10 text-sky-300 border border-sky-400/30">
                728x90 / 300x250 / Popunder / Social Bar
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
