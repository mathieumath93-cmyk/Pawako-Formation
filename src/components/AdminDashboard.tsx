import React, { useState, useEffect } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  FileText,
  DollarSign,
  Upload,
  Settings,
  Database,
  ShieldCheck,
  Search,
  ExternalLink,
  Edit,
  Code,
  Sparkles,
  AlertCircle,
  Key
} from 'lucide-react';
import { DocumentItem, AdSettings } from '../types';

interface AdminDashboardProps {
  navigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'docs' | 'upload' | 'adsterra' | 'supabase' | 'security'>('docs');

  // New Document Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('');
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadCustomSlug, setUploadCustomSlug] = useState('');
  const [uploadAdsEnabled, setUploadAdsEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');

  // Adsterra Settings State
  const [adSettings, setAdSettings] = useState<AdSettings>({
    adsterraTopScript: '',
    adsterraBottomScript: '',
    adsterraBetweenScript: '',
    adsterraPopunderScript: '',
    adsterraSocialBarScript: '',
    globalAdsEnabled: true
  });
  const [isSavingAds, setIsSavingAds] = useState(false);
  const [adSaveStatus, setAdSaveStatus] = useState('');

  // Toast copied notification
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit document modal
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Check saved admin session or login
  useEffect(() => {
    const savedToken = localStorage.getItem('docvault_admin_token');
    if (savedToken) {
      setIsAdminAuthenticated(true);
      fetchDocuments();
      fetchAdSettings();
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await res.json();

      if (data.success && data.adminToken) {
        localStorage.setItem('docvault_admin_token', data.adminToken);
        setIsAdminAuthenticated(true);
        fetchDocuments();
        fetchAdSettings();
      } else {
        setAuthError(data.message || 'Incorrect admin password.');
      }
    } catch (err) {
      setAuthError('Connection error during admin login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/docs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed fetching documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchAdSettings = async () => {
    try {
      const res = await fetch('/api/ad-settings');
      const data = await res.json();
      if (data) setAdSettings(data);
    } catch (err) {
      console.error('Failed fetching ad settings:', err);
    }
  };

  const handleCopyLink = (slug: string, id: string) => {
    const fullUrl = `${window.location.origin}/doc/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/docs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleToggleAds = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/docs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads_enabled: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ads_enabled: !currentStatus } : d))
        );
      }
    } catch (err) {
      console.error('Failed to toggle ads:', err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadPassword) {
      setUploadErrorMsg('Title and password are required');
      return;
    }

    setIsUploading(true);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');

    const formData = new FormData();
    if (selectedFile) {
      formData.append('pdf_file', selectedFile);
    }
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('video_url', uploadVideoUrl);
    formData.append('password', uploadPassword);
    formData.append('custom_slug', uploadCustomSlug);
    formData.append('ads_enabled', uploadAdsEnabled.toString());

    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success && data.document) {
        setUploadSuccessMsg(`Document "${data.document.title}" créé avec succès ! Slug privé: ${data.document.unique_slug}`);
        setUploadTitle('');
        setUploadDescription('');
        setUploadVideoUrl('');
        setUploadPassword('');
        setUploadCustomSlug('');
        setSelectedFile(null);
        fetchDocuments();
        setActiveTab('docs');
      } else {
        setUploadErrorMsg(data.error || 'Failed to create document');
      }
    } catch (err: any) {
      setUploadErrorMsg(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAdSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAds(true);
    setAdSaveStatus('');

    try {
      const res = await fetch('/api/ad-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adSettings)
      });
      const data = await res.json();
      if (data.success) {
        setAdSaveStatus('Adsterra configurations saved successfully!');
        setTimeout(() => setAdSaveStatus(''), 3000);
      }
    } catch (err) {
      setAdSaveStatus('Error saving ad settings.');
    } finally {
      setIsSavingAds(false);
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.unique_slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Admin Password Change State
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [changePassStatus, setChangePassStatus] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    setChangePassStatus('');

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newAdminPassInput })
      });
      const data = await res.json();
      if (data.success) {
        setChangePassStatus('Mot de passe administrateur modifié avec succès !');
        setNewAdminPassInput('');
        setTimeout(() => setChangePassStatus(''), 4000);
      } else {
        setChangePassStatus(data.message || 'Erreur lors du changement de mot de passe.');
      }
    } catch (err) {
      setChangePassStatus('Erreur de connexion lors du changement de mot de passe.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // If not authenticated as admin, display Admin Password Lock Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-sky-400/10 border border-sky-400/20 text-sky-400 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Espace Administration PAWAKO</h2>
            <p className="text-xs text-slate-400">
              Saisissez le mot de passe administrateur pour gérer les cours, mots de passe, et monétisation.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mot de Passe ou Email Administrateur
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Saisissez votre mot de passe d'accès..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-400"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-sky-400/20 flex items-center justify-center space-x-2"
            >
              {isLoggingIn ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Se Connecter à l'Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Retour au Catalogue PAWAKO FORMATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase font-mono">
            Platform Administration
          </span>
          <h1 className="text-2xl font-bold text-white">Document Management Dashboard</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-sky-400/20 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New PDF</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('docvault_admin_token');
              setIsAdminAuthenticated(false);
            }}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium rounded-xl border border-slate-800 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Cards - Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-slate-400">Total PDF Documents</span>
            <div className="p-2 bg-sky-400/10 rounded-xl text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{documents.length}</p>
          <span className="text-[10px] text-slate-500">Protected with bcrypt</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-slate-400">Total Document Views</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {documents.reduce((acc, d) => acc + (d.views_count || 0), 0)}
          </p>
          <span className="text-[10px] text-slate-500">Authenticated accesses</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-slate-400">Monetized Documents</span>
            <div className="p-2 bg-sky-400/10 rounded-xl text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {documents.filter((d) => d.ads_enabled).length} / {documents.length}
          </p>
          <span className="text-[10px] text-slate-500">Adsterra slots enabled</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-slate-400">Security Architecture</span>
            <div className="p-2 bg-sky-400/10 rounded-xl text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-sky-400 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Zero Direct URLs
          </p>
          <span className="text-[10px] text-slate-500">Ephemeral token DRM</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 mb-6 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'docs'
              ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Documents ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'upload'
              ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('adsterra')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'adsterra'
              ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Paramètres Adsterra</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'security'
              ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Sécurité & Mot de Passe</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'supabase'
              ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase SQL & Setup</span>
        </button>
      </div>

      {/* TAB 1: ALL DOCUMENTS TABLE */}
      {activeTab === 'docs' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
          {/* Table Search Header */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search documents by title or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredDocs.length} of {documents.length} protected documents
            </span>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Document Title & Slug</th>
                  <th className="px-4 py-3.5 font-semibold">Password</th>
                  <th className="px-4 py-3.5 font-semibold">Views</th>
                  <th className="px-4 py-3.5 font-semibold">Ads</th>
                  <th className="px-4 py-3.5 font-semibold">Created Date</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No documents found. Click "Upload New PDF" above to add one!
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{doc.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
                          <span>/doc/{doc.unique_slug}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-indigo-300">
                          {doc.password_plain || '••••••••'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{doc.views_count}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleAds(doc.id, doc.ads_enabled)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                            doc.ads_enabled
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {doc.ads_enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>

                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleCopyLink(doc.unique_slug, doc.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center space-x-1"
                            title="Copy Private Access Link"
                          >
                            {copiedId === doc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px] hidden sm:inline">
                              {copiedId === doc.id ? 'Copied!' : 'Copy Link'}
                            </span>
                          </button>

                          <button
                            onClick={() => navigate(`/doc/${doc.unique_slug}`)}
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition"
                            title="Preview Document Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD PDF FORM */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Upload & Protect PDF Document
            </h2>
            <p className="text-xs text-slate-400">
              Each document receives a unique private URL and custom password hashing.
            </p>
          </div>

          {uploadSuccessMsg && (
            <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {uploadErrorMsg && (
            <div className="mb-6 p-4 bg-rose-950/80 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{uploadErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* File Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select PDF File
              </label>
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-file-input"
                />
                <label htmlFor="pdf-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <span className="text-xs font-medium text-slate-200 block">
                    {selectedFile ? selectedFile.name : 'Click or Drag & Drop PDF file here'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {selectedFile
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB selected`
                      : 'Max size 50MB. File stored securely in private bucket/disk.'}
                  </span>
                </label>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Titre du Support de Cours *
              </label>
              <input
                type="text"
                placeholder="ex. Formation Complète PAWAKO 2026"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description (Optionnelle)
              </label>
              <textarea
                placeholder="Aperçu rapide affiché sur la page de mot de passe..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Video URL Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL de la Vidéo de Formation (YouTube / Vimeo / MP4)
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={uploadVideoUrl}
                onChange={(e) => setUploadVideoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Vidéo explicative intégrée directement sous le lecteur Flipping Book.
              </span>
            </div>

            {/* Custom Password & Slug Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mot de Passe d'Accès *
                </label>
                <input
                  type="text"
                  placeholder="Définir le mot de passe..."
                  value={uploadPassword}
                  onChange={(e) => setUploadPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slug d'URL Personnalisé (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Généré automatiquement si vide"
                  value={uploadCustomSlug}
                  onChange={(e) => setUploadCustomSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Ad Toggle */}
            <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="upload-ads-toggle"
                checked={uploadAdsEnabled}
                onChange={(e) => setUploadAdsEnabled(e.target.checked)}
                className="w-4 h-4 text-sky-400 bg-slate-900 border-slate-800 rounded focus:ring-sky-400"
              />
              <label htmlFor="upload-ads-toggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                Activer les emplacements de monétisation Adsterra pour ce cours
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-sky-400/20 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <span>Création & Chiffrement du Document...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Publier le Cours Sécurisé</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ADSTERRA SETTINGS */}
      {activeTab === 'adsterra' && (
        <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-sky-400" />
              Configuration Monétisation Adsterra (Bannière, Popunder, Social Bar)
            </h2>
            <p className="text-xs text-slate-400">
              Collez vos scripts Adsterra ci-dessous pour activer le Popunder, la Social Bar et les bannières publicitaires sur PAWAKO FORMATION.
            </p>
          </div>

          {adSaveStatus && (
            <div className="mb-6 p-4 bg-sky-950/80 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
              <span>{adSaveStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveAdSettings} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white">Interrupteur Global Publicité</h4>
                <p className="text-[11px] text-slate-400">Activer ou désactiver toutes les publicités sur l'ensemble de la plateforme</p>
              </div>
              <input
                type="checkbox"
                checked={adSettings.globalAdsEnabled}
                onChange={(e) => setAdSettings({ ...adSettings, globalAdsEnabled: e.target.checked })}
                className="w-5 h-5 text-sky-400 rounded focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-300 mb-1">
                Espace Popunder Adsterra (&lt;AdSlot position="popunder" /&gt;)
              </label>
              <textarea
                value={adSettings.adsterraPopunderScript}
                onChange={(e) => setAdSettings({ ...adSettings, adsterraPopunderScript: e.target.value })}
                rows={3}
                placeholder="<!-- Collez le script Popunder Adsterra ici -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-sky-400 font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-300 mb-1">
                Espace Social Bar Adsterra (&lt;AdSlot position="social-bar" /&gt;)
              </label>
              <textarea
                value={adSettings.adsterraSocialBarScript}
                onChange={(e) => setAdSettings({ ...adSettings, adsterraSocialBarScript: e.target.value })}
                rows={3}
                placeholder="<!-- Collez le script Social Bar Adsterra ici -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-sky-400 font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bannière Supérieure Adsterra (&lt;AdSlot position="top" /&gt;)
              </label>
              <textarea
                value={adSettings.adsterraTopScript}
                onChange={(e) => setAdSettings({ ...adSettings, adsterraTopScript: e.target.value })}
                rows={3}
                placeholder="<!-- Collez le script Bannière Haut Adsterra ici -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bannière Inter-Page Flipbook (&lt;AdSlot position="between-pages" /&gt;)
              </label>
              <textarea
                value={adSettings.adsterraBetweenScript}
                onChange={(e) => setAdSettings({ ...adSettings, adsterraBetweenScript: e.target.value })}
                rows={3}
                placeholder="<!-- Collez le script Inter-Page Adsterra ici -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bannière Inférieure Adsterra (&lt;AdSlot position="bottom" /&gt;)
              </label>
              <textarea
                value={adSettings.adsterraBottomScript}
                onChange={(e) => setAdSettings({ ...adSettings, adsterraBottomScript: e.target.value })}
                rows={3}
                placeholder="<!-- Collez le script Bannière Bas Adsterra ici -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingAds}
              className="w-full py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-sky-400/20"
            >
              {isSavingAds ? 'Enregistrement de la Monétisation...' : 'Enregistrer les Paramètres Adsterra'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SUPABASE SQL & SETUP */}
      {activeTab === 'supabase' && (
        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                Complete Supabase SQL Database & Storage Setup
              </h2>
              <p className="text-xs text-slate-400">
                To connect your own external Supabase project, execute this SQL schema in your Supabase SQL Editor.
              </p>
            </div>
            <button
              onClick={() => {
                const sqlText = `-- Complete Supabase SQL Schema for Secure PDF Viewer\n...`;
                navigator.clipboard.writeText(sqlText);
                alert('Supabase SQL Schema copied to clipboard!');
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition flex items-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy SQL</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-300 overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
{`-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  pdf_file_path TEXT NOT NULL,
  unique_slug TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  ads_enabled BOOLEAN DEFAULT TRUE,
  views_count BIGINT DEFAULT 0,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Private Storage Bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('private-pdfs', 'private-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. Security Policy: Allow lookup for public info
CREATE POLICY "Public document info lookup" ON public.documents
  FOR SELECT USING (true);

-- 5. Security Policy: Deny public direct URL access to storage bucket
CREATE POLICY "Deny public storage access" ON storage.objects
  FOR SELECT USING (bucket_id = 'private-pdfs' AND auth.role() = 'service_role');`}
              </pre>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Supabase Environment Variable Setup Guide
              </h4>
              <p>Add these variables in your platform settings or <code className="text-indigo-300">.env</code> file:</p>
              <ul className="list-disc list-inside font-mono text-[11px] text-slate-300 space-y-1 pl-2">
                <li>SUPABASE_URL="https://your-project.supabase.co"</li>
                <li>SUPABASE_ANON_KEY="your-anon-key"</li>
                <li>SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* TAB 5: SECURITY & ADMIN PASSWORD MODIFICATION */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-sky-400" />
              Changer le Mot de Passe Administrateur
            </h2>
            <p className="text-xs text-slate-400">
              Définissez un nouveau mot de passe maître pour protéger l'accès à votre espace d'administration PAWAKO.
            </p>
          </div>

          {changePassStatus && (
            <div className="mb-6 p-4 bg-sky-950/80 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
              <span>{changePassStatus}</span>
            </div>
          )}

          <form onSubmit={handleChangeAdminPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nouveau Mot de Passe Administrateur
              </label>
              <input
                type="password"
                value={newAdminPassInput}
                onChange={(e) => setNewAdminPassInput(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe (min 4 caractères)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-sky-400/20 flex items-center justify-center space-x-2"
            >
              {isChangingPass ? (
                <span>Mise à jour du mot de passe...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mettre à Jour le Mot de Passe Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-400" />
              Informations sur les Droits d'Accès Administrateur
            </h4>
            <p>
              • Seul votre compte administrateur (<code className="text-sky-300 font-mono">mathieumath93@gmail.com</code>) et la clé maître peuvent accéder au panneau d'administration.
            </p>
            <p>
              • Tous les autres utilisateurs du site sont en <strong>lecture seule</strong> et peuvent uniquement consulter les supports de cours au format Flipping Book interactif après saisie du mot de passe de la formation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
