/**
 * React hook for managing session persistence with auto-save
 *
 * Features:
 * - Debounced auto-save (2s after changes)
 * - Immediate save on tab close/hide
 * - Session size tracking
 * - Save status feedback
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  saveSession,
  loadSession,
  clearSession,
  getSessionSize,
  hasSession,
  storeImage,
  storeImageFromUrl,
  getImage,
  generateThumbnail,
  formatBytes,
  type SessionData,
  type SerializedBaseVersion,
  type SerializedVariation,
  type SerializedImageVersion,
  type SerializedResizedVersion,
  type SerializedReferenceImage,
  type SelectedPresets,
  type ModelBuilderSelections,
} from '@/lib/session-storage';

// Types from page.tsx (we need to re-declare them here since they're not exported)
interface UploadedImage {
  file: File;
  url: string;
  filename: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioKey: string;
}

interface Analysis {
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
}

interface ImageVersion {
  imageUrl: string | null;
  prompt: string | null;
  parentIndex: number;
  status: 'processing' | 'completed' | 'error';
}

interface ResizedVersion {
  size: string;
  imageUrl: string | null;
  status: 'idle' | 'resizing' | 'completed' | 'error';
}

interface Variation {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: 'idle' | 'generating' | 'completed' | 'error';
  isEditing: boolean;
  editPrompt: string;
  isEditingGenerated: boolean;
  resizedVersions: ResizedVersion[];
  versions: ImageVersion[];
  currentVersionIndex: number;
  isRegenerating: boolean;
  hasNewVersion: boolean;
  isArchived: boolean;
}

interface BaseVersion {
  id: string;
  name: string;
  baseImageUrl: string;
  sourceLabel: string;
  versions: ImageVersion[];
  currentVersionIndex: number;
  resizedVersions: ResizedVersion[];
}

interface ReferenceImage {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
  name: string;
  type: 'background' | 'model' | 'edit';
}

// State input for serialization
export interface SessionState {
  uploadedImage: UploadedImage | null;
  analysis: Analysis | null;
  baseVersions: BaseVersion[];
  variations: Variation[];
  activeBaseId: string;
  selectedVariationId: string | null;
  selectedTool: string | null;
  selectedPresets: SelectedPresets;
  customPrompt: string;
  additionalContext: string;
  originalEditPrompt: string;
  backgroundCustomPrompt: string;
  modelCustomPrompt: string;
  keepClothing: boolean;
  modelBuilder: ModelBuilderSelections;
  backgroundReferences: ReferenceImage[];
  modelReferences: ReferenceImage[];
  editReferences: ReferenceImage[];
  selectedAIModel: string;
  geminiQuality: string;
  openaiQuality: string;
  weirdnessLevel: number;
}

// Restored state (with object URLs instead of IDs)
export interface RestoredState extends Omit<SessionState, 'uploadedImage'> {
  uploadedImage: Omit<UploadedImage, 'file'> & { file: File | null };
}

// Hook result
export interface UseSessionPersistenceResult {
  // Actions
  saveNow: () => Promise<void>;
  clearSessionData: () => Promise<void>;
  restoreSession: () => Promise<RestoredState | null>;
  scheduleSave: (state: SessionState) => void;

  // Status
  isSaving: boolean;
  lastSaved: Date | null;
  sessionSize: number;
  sessionSizeFormatted: string;
  hasExistingSession: boolean;
  isSessionLarge: boolean; // > 50MB warning
  isSessionVeryLarge: boolean; // > 100MB danger

  // For the resume modal
  checkForExistingSession: () => Promise<{
    exists: boolean;
    thumbnailUrl: string | null;
    savedAt: number;
    size: number;
  }>;
}

const DEBOUNCE_MS = 2000;
const PERIODIC_SAVE_MS = 30000;

// Size thresholds for user warnings
const SIZE_WARNING_THRESHOLD = 50 * 1024 * 1024; // 50MB - show warning
const SIZE_DANGER_THRESHOLD = 100 * 1024 * 1024; // 100MB - strongly recommend clearing

/**
 * Hook for managing session persistence
 */
export function useSessionPersistence(): UseSessionPersistenceResult {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionSize, setSessionSize] = useState(0);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<SessionState | null>(null);
  const imageUrlCacheRef = useRef<Map<string, string>>(new Map());

  // Check for existing session on mount
  useEffect(() => {
    hasSession().then(setHasExistingSession);
    getSessionSize().then(setSessionSize);
  }, []);

  /**
   * Serialize an image URL to IndexedDB and return the ID
   */
  const serializeImageUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;

    // Check if we've already stored this URL
    const cached = imageUrlCacheRef.current.get(url);
    if (cached) return cached;

    try {
      const imageId = await storeImageFromUrl(url);
      imageUrlCacheRef.current.set(url, imageId);
      return imageId;
    } catch (error) {
      console.error('Failed to serialize image:', error);
      return null;
    }
  };

  /**
   * Serialize ImageVersion to storage format
   */
  const serializeImageVersion = async (version: ImageVersion): Promise<SerializedImageVersion> => {
    return {
      imageId: await serializeImageUrl(version.imageUrl),
      prompt: version.prompt,
      parentIndex: version.parentIndex,
      status: version.status,
    };
  };

  /**
   * Serialize ResizedVersion to storage format
   */
  const serializeResizedVersion = async (version: ResizedVersion): Promise<SerializedResizedVersion> => {
    return {
      size: version.size,
      imageId: await serializeImageUrl(version.imageUrl),
      status: version.status,
    };
  };

  /**
   * Serialize a reference image to storage format
   */
  const serializeReference = async (ref: ReferenceImage): Promise<SerializedReferenceImage> => {
    const imageId = await serializeImageUrl(ref.url);
    return {
      id: ref.id,
      imageId: imageId!,
      mimeType: ref.mimeType,
      name: ref.name,
      type: ref.type,
    };
  };

  /**
   * Perform the actual save operation
   */
  const doSave = async (state: SessionState): Promise<void> => {
    if (!state.uploadedImage) return;

    setIsSaving(true);

    try {
      // NOTE: We keep the image cache between saves to avoid re-storing unchanged images
      // This significantly improves performance for large sessions

      // Generate thumbnail from current image
      const currentImageUrl = state.baseVersions.length > 0
        ? state.baseVersions.find(b => b.id === state.activeBaseId)?.versions[
            state.baseVersions.find(b => b.id === state.activeBaseId)?.currentVersionIndex || 0
          ]?.imageUrl || state.uploadedImage.url
        : state.uploadedImage.url;

      const thumbnailBlob = await generateThumbnail(currentImageUrl);
      const thumbnailId = await storeImage(thumbnailBlob, 'image/jpeg');

      // Serialize uploaded image
      const uploadedImageId = await serializeImageUrl(state.uploadedImage.url);

      // Serialize base versions
      const serializedBaseVersions: SerializedBaseVersion[] = await Promise.all(
        state.baseVersions.map(async (base) => ({
          id: base.id,
          name: base.name,
          baseImageId: (await serializeImageUrl(base.baseImageUrl))!,
          sourceLabel: base.sourceLabel,
          versions: await Promise.all(base.versions.map(serializeImageVersion)),
          currentVersionIndex: base.currentVersionIndex,
          resizedVersions: await Promise.all(base.resizedVersions.map(serializeResizedVersion)),
        }))
      );

      // Serialize variations
      const serializedVariations: SerializedVariation[] = await Promise.all(
        state.variations.map(async (variation) => ({
          id: variation.id,
          title: variation.title,
          description: variation.description,
          imageId: await serializeImageUrl(variation.imageUrl),
          status: variation.status,
          isEditing: variation.isEditing,
          editPrompt: variation.editPrompt,
          isEditingGenerated: variation.isEditingGenerated,
          resizedVersions: await Promise.all(variation.resizedVersions.map(serializeResizedVersion)),
          versions: await Promise.all(variation.versions.map(serializeImageVersion)),
          currentVersionIndex: variation.currentVersionIndex,
          isRegenerating: variation.isRegenerating,
          hasNewVersion: variation.hasNewVersion,
          isArchived: variation.isArchived,
        }))
      );

      // Serialize reference images
      const serializedBackgroundRefs = await Promise.all(
        state.backgroundReferences.map(serializeReference)
      );
      const serializedModelRefs = await Promise.all(
        state.modelReferences.map(serializeReference)
      );
      const serializedEditRefs = await Promise.all(
        state.editReferences.map(serializeReference)
      );

      // Build session data
      const sessionData: SessionData = {
        id: crypto.randomUUID(),
        savedAt: Date.now(),
        thumbnailId,
        uploadedImage: {
          imageId: uploadedImageId!,
          filename: state.uploadedImage.filename,
          width: state.uploadedImage.width,
          height: state.uploadedImage.height,
          aspectRatio: state.uploadedImage.aspectRatio,
          aspectRatioKey: state.uploadedImage.aspectRatioKey,
        },
        analysis: state.analysis,
        baseVersions: serializedBaseVersions,
        variations: serializedVariations,
        activeBaseId: state.activeBaseId,
        selectedVariationId: state.selectedVariationId,
        selectedTool: state.selectedTool,
        selectedPresets: state.selectedPresets,
        customPrompt: state.customPrompt,
        additionalContext: state.additionalContext,
        originalEditPrompt: state.originalEditPrompt,
        backgroundCustomPrompt: state.backgroundCustomPrompt,
        modelCustomPrompt: state.modelCustomPrompt,
        keepClothing: state.keepClothing,
        modelBuilder: state.modelBuilder,
        backgroundReferences: serializedBackgroundRefs,
        modelReferences: serializedModelRefs,
        editReferences: serializedEditRefs,
        selectedAIModel: state.selectedAIModel,
        geminiQuality: state.geminiQuality,
        openaiQuality: state.openaiQuality,
        weirdnessLevel: state.weirdnessLevel,
      };

      await saveSession(sessionData);

      setLastSaved(new Date());
      setHasExistingSession(true);

      // Update session size
      const size = await getSessionSize();
      setSessionSize(size);
    } catch (error) {
      console.error('Failed to save session:', error);

      // Check for quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded - session save failed');
        // Could emit an event or callback here to notify UI
      }
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback((state: SessionState) => {
    pendingStateRef.current = state;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule new save
    debounceTimerRef.current = setTimeout(() => {
      if (pendingStateRef.current) {
        doSave(pendingStateRef.current);
      }
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Force an immediate save
   */
  const saveNow = useCallback(async (): Promise<void> => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (pendingStateRef.current) {
      await doSave(pendingStateRef.current);
    }
  }, []);

  /**
   * Clear all session data
   */
  const clearSessionData = useCallback(async (): Promise<void> => {
    await clearSession();
    setHasExistingSession(false);
    setSessionSize(0);
    setLastSaved(null);
    pendingStateRef.current = null;
    imageUrlCacheRef.current.clear();
  }, []);

  /**
   * Check for existing session (for resume modal)
   */
  const checkForExistingSession = useCallback(async () => {
    const session = await loadSession();

    if (!session) {
      return {
        exists: false,
        thumbnailUrl: null,
        savedAt: 0,
        size: 0,
      };
    }

    const thumbnailUrl = await getImage(session.thumbnailId);
    const size = await getSessionSize();

    return {
      exists: true,
      thumbnailUrl,
      savedAt: session.savedAt,
      size,
    };
  }, []);

  /**
   * Restore session from IndexedDB
   */
  const restoreSession = useCallback(async (): Promise<RestoredState | null> => {
    const session = await loadSession();
    if (!session) return null;

    // Helper to restore image URL from ID
    const restoreImageUrl = async (imageId: string | null): Promise<string | null> => {
      if (!imageId) return null;
      return await getImage(imageId);
    };

    // Restore uploaded image
    const uploadedImageUrl = await restoreImageUrl(session.uploadedImage.imageId);
    if (!uploadedImageUrl) return null;

    // Restore base versions
    const restoredBaseVersions: BaseVersion[] = await Promise.all(
      session.baseVersions.map(async (base) => ({
        id: base.id,
        name: base.name,
        baseImageUrl: (await restoreImageUrl(base.baseImageId))!,
        sourceLabel: base.sourceLabel,
        versions: await Promise.all(
          base.versions.map(async (v) => ({
            imageUrl: await restoreImageUrl(v.imageId),
            prompt: v.prompt,
            parentIndex: v.parentIndex,
            status: v.status,
          }))
        ),
        currentVersionIndex: base.currentVersionIndex,
        resizedVersions: await Promise.all(
          base.resizedVersions.map(async (r) => ({
            size: r.size,
            imageUrl: await restoreImageUrl(r.imageId),
            status: r.status,
          }))
        ),
      }))
    );

    // Restore variations
    const restoredVariations: Variation[] = await Promise.all(
      session.variations.map(async (v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        imageUrl: await restoreImageUrl(v.imageId),
        status: v.status,
        isEditing: v.isEditing,
        editPrompt: v.editPrompt,
        isEditingGenerated: v.isEditingGenerated,
        resizedVersions: await Promise.all(
          v.resizedVersions.map(async (r) => ({
            size: r.size,
            imageUrl: await restoreImageUrl(r.imageId),
            status: r.status,
          }))
        ),
        versions: await Promise.all(
          v.versions.map(async (ver) => ({
            imageUrl: await restoreImageUrl(ver.imageId),
            prompt: ver.prompt,
            parentIndex: ver.parentIndex,
            status: ver.status,
          }))
        ),
        currentVersionIndex: v.currentVersionIndex,
        isRegenerating: false, // Reset processing states
        hasNewVersion: v.hasNewVersion,
        isArchived: v.isArchived,
      }))
    );

    // Restore reference images
    const restoreReference = async (ref: SerializedReferenceImage): Promise<ReferenceImage> => {
      const url = (await restoreImageUrl(ref.imageId))!;
      // For base64, we need to fetch the data URL
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      return {
        id: ref.id,
        url,
        base64,
        mimeType: ref.mimeType,
        name: ref.name,
        type: ref.type,
      };
    };

    const restoredBackgroundRefs = await Promise.all(
      session.backgroundReferences.map(restoreReference)
    );
    const restoredModelRefs = await Promise.all(
      session.modelReferences.map(restoreReference)
    );
    const restoredEditRefs = await Promise.all(
      session.editReferences.map(restoreReference)
    );

    return {
      uploadedImage: {
        file: null, // File cannot be restored, but we don't need it for display
        url: uploadedImageUrl,
        filename: session.uploadedImage.filename,
        width: session.uploadedImage.width,
        height: session.uploadedImage.height,
        aspectRatio: session.uploadedImage.aspectRatio,
        aspectRatioKey: session.uploadedImage.aspectRatioKey,
      },
      analysis: session.analysis,
      baseVersions: restoredBaseVersions,
      variations: restoredVariations,
      activeBaseId: session.activeBaseId,
      selectedVariationId: session.selectedVariationId,
      selectedTool: session.selectedTool,
      selectedPresets: session.selectedPresets,
      customPrompt: session.customPrompt,
      additionalContext: session.additionalContext,
      originalEditPrompt: session.originalEditPrompt,
      backgroundCustomPrompt: session.backgroundCustomPrompt,
      modelCustomPrompt: session.modelCustomPrompt,
      keepClothing: session.keepClothing,
      modelBuilder: session.modelBuilder,
      backgroundReferences: restoredBackgroundRefs,
      modelReferences: restoredModelRefs,
      editReferences: restoredEditRefs,
      selectedAIModel: session.selectedAIModel,
      geminiQuality: session.geminiQuality || 'medium',
      openaiQuality: session.openaiQuality || 'medium',
      weirdnessLevel: session.weirdnessLevel,
    };
  }, []);

  // Set up periodic save (every 30s as backup)
  useEffect(() => {
    periodicTimerRef.current = setInterval(() => {
      if (pendingStateRef.current) {
        doSave(pendingStateRef.current);
      }
    }, PERIODIC_SAVE_MS);

    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveNow,
    clearSessionData,
    restoreSession,
    scheduleSave,
    isSaving,
    lastSaved,
    sessionSize,
    sessionSizeFormatted: formatBytes(sessionSize),
    hasExistingSession,
    isSessionLarge: sessionSize > SIZE_WARNING_THRESHOLD,
    isSessionVeryLarge: sessionSize > SIZE_DANGER_THRESHOLD,
    checkForExistingSession,
  };
}
