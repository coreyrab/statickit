/**
 * Session persistence using IndexedDB for storing editing sessions
 *
 * Why IndexedDB over localStorage/sessionStorage?
 * - Supports hundreds of MB (vs 5-10MB limit for localStorage)
 * - Can store Blobs natively (no base64 encoding overhead - saves ~33%)
 * - Async API won't block UI thread
 * - Persists across browser restarts
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema types
interface SessionDBSchema extends DBSchema {
  sessions: {
    key: string;
    value: SessionData;
  };
  images: {
    key: string;
    value: StoredImage;
  };
}

// Stored image in IndexedDB - uses Blob for efficient storage
export interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

// Serialized version of ImageVersion (with image ID instead of URL)
export interface SerializedImageVersion {
  imageId: string | null; // References images store, null when processing
  prompt: string | null;
  parentIndex: number;
  status: 'processing' | 'completed' | 'error';
}

// Serialized version of ResizedVersion
export interface SerializedResizedVersion {
  size: string;
  imageId: string | null;
  status: 'idle' | 'resizing' | 'completed' | 'error';
}

// Serialized version of Variation
export interface SerializedVariation {
  id: string;
  title: string;
  description: string;
  imageId: string | null;
  status: 'idle' | 'generating' | 'completed' | 'error';
  isEditing: boolean;
  editPrompt: string;
  isEditingGenerated: boolean;
  resizedVersions: SerializedResizedVersion[];
  versions: SerializedImageVersion[];
  currentVersionIndex: number;
  isRegenerating: boolean;
  hasNewVersion: boolean;
  isArchived: boolean;
}

// Serialized version of BaseVersion
export interface SerializedBaseVersion {
  id: string;
  name: string;
  baseImageId: string; // References images store
  sourceLabel: string;
  versions: SerializedImageVersion[];
  currentVersionIndex: number;
  resizedVersions: SerializedResizedVersion[];
}

// Serialized reference image
export interface SerializedReferenceImage {
  id: string;
  imageId: string; // References images store
  mimeType: string;
  name: string;
  type: 'background' | 'model' | 'edit';
}

// Selected presets state
export interface SelectedPresets {
  lighting: string | null;
  style: string | null;
  mood: string | null;
  color: string | null;
  era: string | null;
  camera: string | null;
  framing: string | null;
  rotation: string | null;
  enhance: string | null;
}

// Model builder selections
export interface ModelBuilderSelections {
  gender: string | null;
  ageRange: string | null;
  ethnicity: string | null;
  hairColor: string | null;
  hairType: string | null;
  bodyType: string | null;
  expression: string | null;
  vibe: string | null;
}

// Complete session data structure
export interface SessionData {
  id: string;
  savedAt: number;
  thumbnailId: string; // Small preview image for modal

  // Core image state
  uploadedImage: {
    imageId: string;
    filename: string;
    width: number;
    height: number;
    aspectRatio: string;
    aspectRatioKey: string;
  };
  analysis: {
    product: string;
    brand_style: string;
    visual_elements: string[];
    key_selling_points: string[];
    target_audience: string;
    colors: string[];
    mood: string;
    imageDescription?: string;
    backgroundDescription?: string;
    subjectDescription?: string | null;
  } | null;

  // Version state
  baseVersions: SerializedBaseVersion[];
  variations: SerializedVariation[];
  activeBaseId: string;
  selectedVariationId: string | null;

  // Tool state
  selectedTool: string | null;
  selectedPresets: SelectedPresets;
  customPrompt: string;
  additionalContext: string;
  originalEditPrompt: string;
  backgroundCustomPrompt: string;
  modelCustomPrompt: string;
  keepClothing: boolean;

  // Model builder
  modelBuilder: ModelBuilderSelections;

  // Reference images
  backgroundReferences: SerializedReferenceImage[];
  modelReferences: SerializedReferenceImage[];
  editReferences: SerializedReferenceImage[];

  // Preferences (backup - primary in localStorage)
  selectedAIModel: string;
  imageQuality: string;
  weirdnessLevel: number;
}

// Database instance singleton
let dbInstance: IDBPDatabase<SessionDBSchema> | null = null;

const DB_NAME = 'statickit-session';
const DB_VERSION = 1;

/**
 * Get or create the IndexedDB database instance
 */
async function getDB(): Promise<IDBPDatabase<SessionDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SessionDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sessions store - holds session metadata
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions');
      }
      // Images store - holds image Blobs
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    },
  });

  return dbInstance;
}

/**
 * Store an image Blob in IndexedDB
 * @returns The image ID for later retrieval
 */
export async function storeImage(blob: Blob, mimeType: string): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();

  const storedImage: StoredImage = {
    id,
    blob,
    mimeType,
    createdAt: Date.now(),
  };

  await db.put('images', storedImage, id);
  return id;
}

/**
 * Store an image from a URL (fetches and converts to Blob)
 * Handles both object URLs and data URLs
 */
export async function storeImageFromUrl(url: string): Promise<string> {
  // Handle data URLs
  if (url.startsWith('data:')) {
    const response = await fetch(url);
    const blob = await response.blob();
    return storeImage(blob, blob.type || 'image/png');
  }

  // Handle object URLs and regular URLs
  const response = await fetch(url);
  const blob = await response.blob();
  return storeImage(blob, blob.type || 'image/png');
}

/**
 * Retrieve an image from IndexedDB
 * @returns Object URL for the image, or null if not found
 */
export async function getImage(imageId: string): Promise<string | null> {
  const db = await getDB();
  const stored = await db.get('images', imageId);

  if (!stored) return null;

  // Create an object URL from the Blob
  return URL.createObjectURL(stored.blob);
}

/**
 * Get a stored image as base64 (for API calls)
 */
export async function getImageAsBase64(imageId: string): Promise<{ base64: string; mimeType: string } | null> {
  const db = await getDB();
  const stored = await db.get('images', imageId);

  if (!stored) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: stored.mimeType });
    };
    reader.readAsDataURL(stored.blob);
  });
}

/**
 * Delete an image from IndexedDB
 */
export async function deleteImage(imageId: string): Promise<void> {
  const db = await getDB();
  await db.delete('images', imageId);
}

/**
 * Generate a small thumbnail from an image URL for the resume modal
 * @param imageUrl Source image URL
 * @param maxSize Maximum dimension for the thumbnail
 * @returns Thumbnail Blob
 */
export async function generateThumbnail(imageUrl: string, maxSize = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate thumbnail dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * maxSize / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round(width * maxSize / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not generate thumbnail'));
        }
      }, 'image/jpeg', 0.7);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = imageUrl;
  });
}

/**
 * Save the current session to IndexedDB
 */
export async function saveSession(data: SessionData): Promise<void> {
  const db = await getDB();
  await db.put('sessions', data, 'current');
}

/**
 * Load the saved session from IndexedDB
 */
export async function loadSession(): Promise<SessionData | null> {
  const db = await getDB();
  return await db.get('sessions', 'current') || null;
}

/**
 * Check if a session exists without loading all data
 */
export async function hasSession(): Promise<boolean> {
  const db = await getDB();
  const session = await db.get('sessions', 'current');
  return session !== undefined;
}

/**
 * Clear the current session and all associated images
 */
export async function clearSession(): Promise<void> {
  const db = await getDB();

  // Get the session to find all image IDs to delete
  const session = await db.get('sessions', 'current');

  if (session) {
    // Collect all image IDs from session
    const imageIds = new Set<string>();

    // Thumbnail
    if (session.thumbnailId) imageIds.add(session.thumbnailId);

    // Uploaded image
    if (session.uploadedImage?.imageId) imageIds.add(session.uploadedImage.imageId);

    // Base versions
    for (const base of session.baseVersions) {
      if (base.baseImageId) imageIds.add(base.baseImageId);
      for (const version of base.versions) {
        if (version.imageId) imageIds.add(version.imageId);
      }
      for (const resized of base.resizedVersions) {
        if (resized.imageId) imageIds.add(resized.imageId);
      }
    }

    // Variations
    for (const variation of session.variations) {
      if (variation.imageId) imageIds.add(variation.imageId);
      for (const version of variation.versions) {
        if (version.imageId) imageIds.add(version.imageId);
      }
      for (const resized of variation.resizedVersions) {
        if (resized.imageId) imageIds.add(resized.imageId);
      }
    }

    // Reference images
    for (const ref of [...session.backgroundReferences, ...session.modelReferences, ...session.editReferences]) {
      if (ref.imageId) imageIds.add(ref.imageId);
    }

    // Delete all images
    for (const id of imageIds) {
      await db.delete('images', id);
    }
  }

  // Delete the session
  await db.delete('sessions', 'current');
}

/**
 * Calculate the total storage size of the session in bytes
 */
export async function getSessionSize(): Promise<number> {
  const db = await getDB();
  let totalSize = 0;

  // Get session metadata size
  const session = await db.get('sessions', 'current');
  if (session) {
    totalSize += JSON.stringify(session).length;
  }

  // Get all image sizes
  const tx = db.transaction('images', 'readonly');
  const store = tx.objectStore('images');

  let cursor = await store.openCursor();
  while (cursor) {
    const image = cursor.value;
    totalSize += image.blob.size;
    cursor = await cursor.continue();
  }

  return totalSize;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get relative time string for "last edited X ago"
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  // Format as date for older sessions
  return new Date(timestamp).toLocaleDateString();
}
