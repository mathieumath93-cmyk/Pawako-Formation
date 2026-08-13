import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  getAllDocuments,
  getDocumentBySlug,
  getDocumentById,
  addDocument,
  updateDocument,
  deleteDocument,
  incrementDocViews,
  getAdSettings,
  saveAdSettings,
  getAdminPassword,
  saveAdminPassword,
  activeTokens
} from './server/storage.js';
import { DocumentPublicInfo } from './src/types.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PORT = 3000;

// Configure Multer for PDF and Video file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video/') ? '.mp4' : '.pdf');
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'doc';
    const safeName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit for video & pdf
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(file.originalname);
    if (isPdf || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Veuillez sélectionner un fichier PDF ou Vidéo (MP4, WebM, MOV, etc.).'));
    }
  }
});

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadsDir));

  // API Admin Auth - Strictly single authorized email mathieumath93@gmail.com
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const currentPass = getAdminPassword();
    const authorizedEmail = 'mathieumath93@gmail.com';

    const inputEmail = email ? email.toString().trim().toLowerCase() : '';
    const inputPassword = password ? password.toString() : '';

    if (inputEmail !== authorizedEmail) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seul l'email mathieumath93@gmail.com est autorisé à se connecter au panneau d'administration."
      });
    }

    if (inputPassword !== currentPass) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe administrateur incorrect."
      });
    }

    const adminToken = crypto.randomBytes(24).toString('hex');
    res.json({ success: true, adminToken, message: 'Authentification administrateur réussie' });
  });

  // Change Admin Password Endpoint
  app.post('/api/admin/change-password', (req: Request, res: Response) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 4 caractères.' });
    }
    const success = saveAdminPassword(newPassword.trim());
    if (success) {
      res.json({ success: true, message: 'Mot de passe administrateur mis à jour avec succès !' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde du mot de passe.' });
    }
  });

  // GET All Documents (Admin View or Public List)
  app.get('/api/docs', (_req: Request, res: Response) => {
    const docs = getAllDocuments();
    // Return document items
    res.json(docs);
  });

  // POST New Document (Upload PDF & Optional Video File)
  app.post('/api/docs', upload.fields([{ name: 'pdf_file', maxCount: 1 }, { name: 'video_file', maxCount: 1 }]), (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const pdfFile = files?.['pdf_file']?.[0];
      const videoFile = files?.['video_file']?.[0];

      const { title, description, password, custom_slug, ads_enabled, video_url } = req.body;

      if (!title || !password) {
        return res.status(400).json({ error: 'Title and password are required' });
      }

      let filePath = '';
      let fileSize = 0;
      let originalFilename = '';

      if (pdfFile) {
        filePath = pdfFile.path;
        fileSize = pdfFile.size;
        originalFilename = pdfFile.originalname;
      } else {
        // Fallback sample PDF if created without file attachment
        const fallbackPath = path.join(uploadsDir, `doc-generated-${Date.now()}.pdf`);
        fs.writeFileSync(fallbackPath, `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 18 Tf 50 700 Td (${title}) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`);
        filePath = fallbackPath;
        fileSize = fs.statSync(fallbackPath).size;
        originalFilename = `${title.replace(/\s+/g, '_')}.pdf`;
      }

      // Determine final video URL (uploaded video file path or external video URL string)
      let finalVideoUrl = video_url || '';
      if (videoFile) {
        finalVideoUrl = `/uploads/${videoFile.filename}`;
      }

      // Generate clean slug
      let slug = custom_slug ? custom_slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : '';
      if (!slug) {
        slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
      }

      // Ensure unique slug
      let existing = getDocumentBySlug(slug);
      if (existing) {
        slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
      }

      const password_hash = bcrypt.hashSync(password, 10);

      const created = addDocument({
        title,
        description: description || '',
        pdf_file_path: filePath,
        unique_slug: slug,
        password_hash,
        password_plain: password,
        ads_enabled: ads_enabled === 'true' || ads_enabled === true,
        file_size: fileSize,
        original_filename: originalFilename,
        video_url: finalVideoUrl
      });

      res.status(201).json({ success: true, document: created });
    } catch (err: any) {
      console.error('Error creating document:', err);
      res.status(500).json({ error: err.message || 'Failed to upload document' });
    }
  });

  // PATCH Update Document (Update PDF, Video, or Metadata)
  app.patch('/api/docs/:id', upload.fields([{ name: 'pdf_file', maxCount: 1 }, { name: 'video_file', maxCount: 1 }]), (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const pdfFile = files?.['pdf_file']?.[0];
    const videoFile = files?.['video_file']?.[0];

    const { title, description, password, ads_enabled, video_url } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (ads_enabled !== undefined) updates.ads_enabled = ads_enabled === 'true' || ads_enabled === true;
    if (video_url !== undefined) updates.video_url = video_url;

    if (videoFile) {
      updates.video_url = `/uploads/${videoFile.filename}`;
    }

    if (pdfFile) {
      updates.pdf_file_path = pdfFile.path;
      updates.file_size = pdfFile.size;
      updates.original_filename = pdfFile.originalname;
    }

    if (password) {
      updates.password_hash = bcrypt.hashSync(password, 10);
      updates.password_plain = password;
    }

    const updated = updateDocument(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true, document: updated });
  });

  // DELETE Document
  app.delete('/api/docs/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = deleteDocument(id);
    if (!success) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true });
  });

  // GET Public Document Metadata
  app.get('/api/doc/:slug/info', (req: Request, res: Response) => {
    const { slug } = req.params;
    const doc = getDocumentBySlug(slug);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or invalid URL' });
    }

    const publicInfo: DocumentPublicInfo = {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      unique_slug: doc.unique_slug,
      created_at: doc.created_at,
      views_count: doc.views_count,
      ads_enabled: doc.ads_enabled,
      file_size: doc.file_size,
      video_url: doc.video_url
    };

    res.json(publicInfo);
  });

  // POST Verify Password & Obtain Temporary Session Token
  app.post('/api/doc/:slug/verify-password', (req: Request, res: Response) => {
    const { slug } = req.params;
    const { password } = req.body;

    const doc = getDocumentBySlug(slug);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const isMatch = bcrypt.compareSync(password, doc.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Access denied.' });
    }

    // Increment views counter
    incrementDocViews(slug);

    // Generate signed temporary 1-hour access token
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, {
      slug: slug.toLowerCase(),
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    const docInfo: DocumentPublicInfo = {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      unique_slug: doc.unique_slug,
      created_at: doc.created_at,
      views_count: doc.views_count + 1,
      ads_enabled: doc.ads_enabled,
      file_size: doc.file_size,
      video_url: doc.video_url
    };

    res.json({
      success: true,
      token,
      docInfo
    });
  });

  // GET Secure PDF Stream (Requires valid temporary token!)
  app.get('/api/doc/:slug/file', (req: Request, res: Response) => {
    const { slug } = req.params;
    const token = (req.query.token as string) || (req.headers['x-access-token'] as string);

    if (!token) {
      return res.status(403).json({ error: 'Access denied. Missing security token.' });
    }

    const tokenData = activeTokens.get(token);
    if (!tokenData || tokenData.slug !== slug.toLowerCase() || Date.now() > tokenData.expiresAt) {
      return res.status(403).json({ error: 'Access token expired or invalid. Please re-authenticate.' });
    }

    const doc = getDocumentBySlug(slug);
    if (!doc || !fs.existsSync(doc.pdf_file_path)) {
      return res.status(404).json({ error: 'PDF file record not found.' });
    }

    // Stream the PDF binary securely
    const stat = fs.statSync(doc.pdf_file_path);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'inline; filename="protected-document.pdf"');
    // Prevent caching on client / proxies
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const fileStream = fs.createReadStream(doc.pdf_file_path);
    fileStream.pipe(res);
  });

  // Serve Ad Network Service Worker Script
  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.send(`self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11571811
};
self.lary = "";
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');`);
  });

  // GET & POST Ad Settings
  app.get('/api/ad-settings', (_req: Request, res: Response) => {
    res.json(getAdSettings());
  });

  app.post('/api/ad-settings', (req: Request, res: Response) => {
    const newSettings = req.body;
    saveAdSettings(newSettings);
    res.json({ success: true, settings: getAdSettings() });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DocVault] Secure PDF Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
