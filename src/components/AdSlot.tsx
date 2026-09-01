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

  if (!adsEnabled || isAdminRoute || !settings || !settings.globalAdsEnabled) {
    return null;
  }

  let rawScript = '';
  if (settings) {
    if (position === 'top') rawScript = settings.adsterraTopScript || '';
    else if (position === 'bottom') rawScript = settings.adsterraBottomScript || '';
    else if (position === 'between-pages') rawScript = settings.adsterraBetweenScript || '';
    else if (position === 'popunder') rawScript = settings.adsterraPopunderScript || '';
    else if (position === 'social-bar') rawScript = settings.adsterraSocialBarScript || '';
  }

  if (!rawScript || rawScript.trim() === '') {
    return null;
  }

  // Inject user scripts into container safely if custom HTML / script tags / AdSense tags provided
  useEffect(() => {
    if (!adRef.current || !rawScript) return;
    adRef.current.innerHTML = '';

    if (rawScript.includes('<script') || rawScript.includes('<ins')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawScript;

      // First append non-script child nodes (like <ins class="adsbygoogle"> or <div>)
      Array.from(tempDiv.childNodes).forEach((node) => {
        if (node.nodeName !== 'SCRIPT') {
          adRef.current?.appendChild(node.cloneNode(true));
        }
      });

      // Then append and execute script nodes
      const scripts = Array.from(tempDiv.querySelectorAll('script'));
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = true;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        adRef.current?.appendChild(newScript);
      });

      // If AdSense <ins> unit is present, trigger adsbygoogle push
      if (rawScript.includes('adsbygoogle') || rawScript.includes('ca-pub-')) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
          console.log('[AdSense] Push unit notice:', e);
        }
      }
    } else {
      adRef.current.innerHTML = rawScript;
    }
  }, [rawScript]);

  // Special rendering for Floating Social Bar
  if (position === 'social-bar') {
    return (
      <div id="ad-slot-social-bar" className="fixed bottom-4 left-4 z-50 pointer-events-auto">
        <div ref={adRef} />
      </div>
    );
  }

  // Special rendering for Popunder
  if (position === 'popunder') {
    return (
      <div id="ad-slot-popunder" className="hidden">
        <div ref={adRef} />
      </div>
    );
  }

  return (
    <div className="w-full my-4 px-2 select-none flex justify-center" id={`ad-slot-${position}`}>
      <div className="relative overflow-hidden rounded-xl glass-card p-4 shadow-lg border border-sky-400/20 w-full max-w-lg text-center flex flex-col items-center justify-center">
        <div className="flex items-center justify-between w-full border-b border-slate-800/80 pb-2 mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase font-mono">
              Espace Publicitaire
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Google AdSense & Adsterra</span>
          </div>
        </div>

        {/* Custom Adsterra Script Output Container */}
        <div ref={adRef} className="flex justify-center items-center my-1 min-h-[50px] w-full" />
      </div>
    </div>
  );
};
