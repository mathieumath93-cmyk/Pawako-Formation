import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DocumentItem, DocumentPublicInfo, AdSettings } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DOCS_FILE = path.join(DATA_DIR, 'documents.json');
const AD_SETTINGS_FILE = path.join(DATA_DIR, 'ad_settings.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');

export function getAdminPassword(): string {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.adminPassword) return parsed.adminPassword;
    }
  } catch (e) {
    console.warn("Could not read admin config file:", e);
  }
  return process.env.ADMIN_PASSWORD || 'admin123';
}

export function saveAdminPassword(newPassword: string): boolean {
  try {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify({
      adminPassword: newPassword,
      authorizedEmail: 'mathieumath93@gmail.com',
      updatedAt: new Date().toISOString()
    }, null, 2));
    return true;
  } catch (e) {
    console.error("Failed to save admin password:", e);
    return false;
  }
}

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory token store for signed PDF streaming sessions: token -> { slug, expiresAt }
export const activeTokens = new Map<string, { slug: string; expiresAt: number }>();

// Generate clean minimal valid PDF buffer for sample seeding
function createSamplePdfBuffer(title: string, contentText: string): Buffer {
  const streamString = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 210 >>
stream
BT
/F1 24 Tf
50 720 Td
(${title.replace(/[()]/g, '')}) Tj
/F1 12 Tf
0 -40 Td
(${contentText.replace(/[()]/g, '')}) Tj
0 -20 Td
(SECURE PROTECTED DOCUMENT - DOCVAULT PLATFORM) Tj
0 -20 Td
(Direct download and printing disabled.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000251 00000 n 
0000000512 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
580
%%EOF
`.trim();

  return Buffer.from(streamString, 'utf-8');
}

// Initial seed documents
function getInitialSeedDocuments(): DocumentItem[] {
  const seed1Path = path.join(UPLOADS_DIR, 'pawako-formation-vente-management.pdf');
  const seed2Path = path.join(UPLOADS_DIR, 'pawako-formation-marketing-digital.pdf');
  const seed3Path = path.join(UPLOADS_DIR, 'pawako-formation-comptabilite.pdf');

  if (!fs.existsSync(seed1Path)) {
    fs.writeFileSync(seed1Path, createSamplePdfBuffer(
      "PAWAKO FORMATION - Techniques de Vente & Management",
      "Module 1: Strategie commerciale, negociation client et leadership d'equipe."
    ));
  }
  if (!fs.existsSync(seed2Path)) {
    fs.writeFileSync(seed2Path, createSamplePdfBuffer(
      "PAWAKO FORMATION - Guide Complet Marketing Digital",
      "Module 2: Acquisition de prospects, SEO, reseaux sociaux et conversion web."
    ));
  }
  if (!fs.existsSync(seed3Path)) {
    fs.writeFileSync(seed3Path, createSamplePdfBuffer(
      "PAWAKO FORMATION - Les Bases de la Gestion & Comptabilite",
      "Module 3: Gestion de tresorerie, facturation et outils d'optimisation financiere."
    ));
  }

  const pass1 = "secret123";
  const pass2 = "demo2026";
  const pass3 = "pass123";

  return [
    {
      id: "doc-seed-001",
      title: "Module 1: Techniques de Vente & Management",
      description: "Support de cours PAWAKO FORMATION sur les strategies de negociation et le leadership d'equipe.",
      pdf_file_path: seed1Path,
      unique_slug: "formation-vente-management",
      password_hash: bcrypt.hashSync(pass1, 10),
      password_plain: pass1,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      views_count: 184,
      ads_enabled: true,
      file_size: fs.statSync(seed1Path).size,
      original_filename: "Pawako_Formation_Vente_Management.pdf",
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      id: "doc-seed-002",
      title: "Module 2: Guide Complet Marketing Digital",
      description: "Support de cours PAWAKO FORMATION sur l'acquisition de trafic, SEO et publicite en ligne.",
      pdf_file_path: seed2Path,
      unique_slug: "formation-marketing-digital",
      password_hash: bcrypt.hashSync(pass2, 10),
      password_plain: pass2,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      views_count: 120,
      ads_enabled: true,
      file_size: fs.statSync(seed2Path).size,
      original_filename: "Pawako_Formation_Marketing_Digital.pdf",
      video_url: "https://www.youtube.com/embed/L_LUpnjgPso"
    },
    {
      id: "doc-seed-003",
      title: "Module 3: Gestion Financiére & Comptabilité",
      description: "Cours pratique PAWAKO FORMATION pour maitriser la comptabilite et la gestion de tresorerie.",
      pdf_file_path: seed3Path,
      unique_slug: "formation-gestion-comptabilite",
      password_hash: bcrypt.hashSync(pass3, 10),
      password_plain: pass3,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      views_count: 245,
      ads_enabled: true,
      file_size: fs.statSync(seed3Path).size,
      original_filename: "Pawako_Formation_Comptabilite.pdf",
      video_url: "https://www.youtube.com/embed/3JZ_D3ELwOQ"
    }
  ];
}

export function getAllDocuments(): DocumentItem[] {
  try {
    if (!fs.existsSync(DOCS_FILE)) {
      const seeds = getInitialSeedDocuments();
      fs.writeFileSync(DOCS_FILE, JSON.stringify(seeds, null, 2));
      return seeds;
    }
    const data = fs.readFileSync(DOCS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading documents store:", err);
    return getInitialSeedDocuments();
  }
}

export function saveAllDocuments(docs: DocumentItem[]): void {
  try {
    fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2));
  } catch (err) {
    console.error("Error saving documents store:", err);
  }
}

export function getDocumentBySlug(slug: string): DocumentItem | undefined {
  const docs = getAllDocuments();
  return docs.find(d => d.unique_slug.toLowerCase() === slug.toLowerCase());
}

export function getDocumentById(id: string): DocumentItem | undefined {
  const docs = getAllDocuments();
  return docs.find(d => d.id === id);
}

export function incrementDocViews(slug: string): void {
  const docs = getAllDocuments();
  const doc = docs.find(d => d.unique_slug.toLowerCase() === slug.toLowerCase());
  if (doc) {
    doc.views_count = (doc.views_count || 0) + 1;
    saveAllDocuments(docs);
  }
}

export function addDocument(newDoc: Omit<DocumentItem, 'id' | 'created_at' | 'views_count'>): DocumentItem {
  const docs = getAllDocuments();
  const id = `doc-${crypto.randomUUID()}`;
  const created_at = new Date().toISOString();
  
  const createdDoc: DocumentItem = {
    ...newDoc,
    id,
    created_at,
    views_count: 0
  };

  docs.unshift(createdDoc);
  saveAllDocuments(docs);
  return createdDoc;
}

export function updateDocument(id: string, updates: Partial<DocumentItem>): DocumentItem | null {
  const docs = getAllDocuments();
  const index = docs.findIndex(d => d.id === id);
  if (index === -1) return null;

  docs[index] = { ...docs[index], ...updates };
  saveAllDocuments(docs);
  return docs[index];
}

export function deleteDocument(id: string): boolean {
  let docs = getAllDocuments();
  const target = docs.find(d => d.id === id);
  if (!target) return false;

  // Attempt file removal
  if (target.pdf_file_path && fs.existsSync(target.pdf_file_path)) {
    try {
      fs.unlinkSync(target.pdf_file_path);
    } catch (e) {
      console.warn("Could not delete file from disk:", target.pdf_file_path, e);
    }
  }

  docs = docs.filter(d => d.id !== id);
  saveAllDocuments(docs);
  return true;
}

export function getAdSettings(): AdSettings {
  const defaultSettings: AdSettings = {
    adsterraTopScript: `<script src="https://3nbf4.com/act/files/tag.min.js?z=11571811" data-cfasync="false" async></script>`,
    adsterraBottomScript: `<script src="https://3nbf4.com/act/files/tag.min.js?z=11571811" data-cfasync="false" async></script>`,
    adsterraBetweenScript: `<script src="https://3nbf4.com/act/files/tag.min.js?z=11571811" data-cfasync="false" async></script>`,
    adsterraPopunderScript: `<script src="https://3nbf4.com/act/files/tag.min.js?z=11571811" data-cfasync="false" async></script>`,
    adsterraSocialBarScript: `<script src="https://3nbf4.com/act/files/tag.min.js?z=11571811" data-cfasync="false" async></script>`,
    globalAdsEnabled: true
  };

  try {
    if (!fs.existsSync(AD_SETTINGS_FILE)) {
      fs.writeFileSync(AD_SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(AD_SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return defaultSettings;
  }
}

export function saveAdSettings(settings: AdSettings): void {
  try {
    fs.writeFileSync(AD_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Failed saving ad settings:", err);
  }
}
