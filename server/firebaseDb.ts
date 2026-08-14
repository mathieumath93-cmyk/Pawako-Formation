import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { MediaItem, DocumentItem } from '../src/types';

// Load Firebase Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};

if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error('Failed reading firebase-applet-config.json:', err);
  }
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Sync Media Collection with Firestore
export async function syncMediaFromFirestore(localMedia: MediaItem[]): Promise<MediaItem[]> {
  try {
    const mediaCol = collection(db, 'media');
    const snapshot = await getDocs(mediaCol);

    if (snapshot.empty) {
      // If Firestore is empty, upload initial local items
      for (const item of localMedia) {
        await setDoc(doc(db, 'media', item.id), item);
      }
      return localMedia;
    }

    const firestoreItems: MediaItem[] = [];
    snapshot.forEach((docSnap) => {
      firestoreItems.push(docSnap.data() as MediaItem);
    });

    return firestoreItems;
  } catch (err) {
    console.warn('Firestore syncMedia error (using local storage fallback):', err);
    return localMedia;
  }
}

export async function saveMediaToFirestore(item: MediaItem): Promise<void> {
  try {
    await setDoc(doc(db, 'media', item.id), item);
  } catch (err) {
    console.error('Error saving media to Firestore:', err);
  }
}

export async function deleteMediaFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'media', id));
  } catch (err) {
    console.error('Error deleting media from Firestore:', err);
  }
}

// Sync Documents Collection with Firestore
export async function syncDocumentsFromFirestore(localDocs: DocumentItem[]): Promise<DocumentItem[]> {
  try {
    const docsCol = collection(db, 'documents');
    const snapshot = await getDocs(docsCol);

    if (snapshot.empty) {
      for (const item of localDocs) {
        await setDoc(doc(db, 'documents', item.id), item);
      }
      return localDocs;
    }

    const firestoreItems: DocumentItem[] = [];
    snapshot.forEach((docSnap) => {
      firestoreItems.push(docSnap.data() as DocumentItem);
    });

    return firestoreItems;
  } catch (err) {
    console.warn('Firestore syncDocuments error (using local storage fallback):', err);
    return localDocs;
  }
}

export async function saveDocumentToFirestore(item: DocumentItem): Promise<void> {
  try {
    await setDoc(doc(db, 'documents', item.id), item);
  } catch (err) {
    console.error('Error saving document to Firestore:', err);
  }
}

export async function deleteDocumentFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'documents', id));
  } catch (err) {
    console.error('Error deleting document from Firestore:', err);
  }
}
