import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Key,
  ArrowRight,
  Eye,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  HardDrive
} from 'lucide-react';
import { DocumentItem } from '../types';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [accessSlug, setAccessSlug] = useState('');
  const [sampleDocs, setSampleDocs] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  useEffect(() => {
    setIsLoadingDocs(true);
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSampleDocs(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingDocs(false));
  }, []);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessSlug.trim()) return;
    const cleanSlug = accessSlug.trim().toLowerCase().replace(/^\/doc\//, '');
    navigate(`/doc/${cleanSlug}`);
  };

  return (
    <div className="min-h-screen text-slate-100 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20">
        {/* Glow Backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-400 text-xs font-semibold mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>PAWAKO FORMATION • PDF Flipping Book & Vidéos Sécurisées</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Consultation de Supports de Cours en{' '}
            <span className="text-sky-400">
              Mode Livre Feuilletable (Flipping Book)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Accédez aux supports de formation PAWAKO avec effet de pages feuilletables interactives, vidéo de cours intégrée, protection par mot de passe et espaces de monétisation Adsterra (Bannières, Popunder, Social Bar).
          </p>

          {/* Quick Slug Access Input Box */}
          <div className="max-w-xl mx-auto glass-card p-2.5 rounded-2xl shadow-2xl mb-12">
            <form onSubmit={handleAccessSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Entrez le code ou slug de la formation (ex: formation-vente-management)..."
                  value={accessSlug}
                  onChange={(e) => setAccessSlug(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition"
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-sky-400" />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-sky-400/20 flex items-center space-x-1.5 shrink-0"
              >
                <span>Accéder au Cours</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Feature Badges - Bento strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Livre Feuilletable</span>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Lecteur Vidéo</span>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Protection Bcrypt</span>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Adsterra Ready</span>
            </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Demo Documents Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase font-mono">
              Catalogue PAWAKO FORMATION
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Modules de Formation Disponibles</h2>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center space-x-2"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Tableau d'Administration</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass-card rounded-2xl p-6 hover:border-sky-400/40 transition duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-sky-400/10 border border-sky-400/20 text-sky-400 rounded-xl group-hover:bg-sky-400 group-hover:text-slate-950 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 bg-slate-950/80 border border-slate-800 text-slate-400 rounded-lg text-[10px] font-mono">
                    {doc.views_count} vues
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{doc.title}</h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Mot de passe:</span>
                  <code className="text-xs text-sky-400 font-mono font-semibold">
                    {doc.password_plain || 'secret123'}
                  </code>
                </div>

                <button
                  onClick={() => navigate(`/doc/${doc.unique_slug}`)}
                  className="px-3.5 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-sky-400/20 flex items-center space-x-1"
                >
                  <span>Ouvrir en Flipbook</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Layout Architecture PAWAKO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="glass-card rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Fonctionnalités PAWAKO FORMATION</h2>
            <p className="text-xs text-slate-400">
              Une plateforme moderne combinant éducation interactive, lecteur vidéo, sécurité DRM et monétisation Adsterra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="p-3 bg-sky-400/10 text-sky-400 rounded-xl w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Mode Livre Feuilletable (Flipbook)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Les apprenants tournent les pages du PDF de cours comme un véritable livre imprimé, avec animations fluides et contrôles tactiles.
              </p>
            </div>

            <div className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="p-3 bg-sky-400/10 text-sky-400 rounded-xl w-fit">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Vidéo de Cours Intégrée</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chaque module de formation peut comporter une vidéo explicative (YouTube, Vimeo, MP4) disposée aux côtés du support de cours.
              </p>
            </div>

            <div className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="p-3 bg-sky-400/10 text-sky-400 rounded-xl w-fit">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Monétisation Adsterra Intégrée</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Espaces dédiés pour bannières (haut, bas, inter-pages), Popunder et Social Bar pour optimiser vos revenus de formation.
              </p>
            </div>
          </div>

          {/* Security Limitation Explanation Box */}
          <div className="mt-8 p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-start space-x-3 text-xs text-slate-400">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">Note de sécurité & monétisation :</span>
              <span>
                PAWAKO FORMATION assure la sécurité des supports de cours via des jetons d'accès éphémères et le rendu HTML5 Canvas sans bouton de téléchargement direct.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
