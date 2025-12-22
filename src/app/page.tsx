'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Sparkles,
  Loader2,
  Download,
  Plus,
  LogIn,
  FolderOpen,
  Edit3,
  Check,
  ChevronLeft,
  RefreshCw,
  Send,
  Image as ImageIcon,
  Copy,
  ChevronRight,
  Wand2,
  Trash2,
  X,
  FolderDown,
  Settings,
  Archive,
  ArchiveRestore,
  ChevronDown,
  Maximize2,
  Info,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { detectAspectRatio, AspectRatioKey } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LandingPage } from '@/components/landing/LandingPage';
import { uploadFileToConvex, dataUrlToBlob } from '@/lib/convex-storage';
import { PlanSelectionModal } from '@/components/PlanSelectionModal';

type Step = 'upload' | 'editor';
type Tool = 'edit' | 'iterations' | 'export' | null;

interface UploadedImage {
  file: File;
  url: string;
  filename: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioKey: AspectRatioKey | 'custom';
}

interface Analysis {
  product: string;
  brand_style: string;
  visual_elements: string[];
  key_selling_points: string[];
  target_audience: string;
  colors: string[];
  mood: string;
}

// Common ad sizes for resizing
const AD_SIZES = [
  { name: '1:1', width: 1080, height: 1080, label: 'Square' },
  { name: '9:16', width: 1080, height: 1920, label: 'Story' },
  { name: '16:9', width: 1920, height: 1080, label: 'Landscape' },
  { name: '4:5', width: 1080, height: 1350, label: 'Portrait' },
  { name: '2:3', width: 1080, height: 1620, label: 'Pinterest' },
] as const;

interface ResizedVersion {
  size: string;
  imageUrl: string | null;
  status: 'idle' | 'resizing' | 'completed' | 'error';
}

interface ImageVersion {
  imageUrl: string;
  prompt: string | null; // The edit prompt used to create this version (null for original/first generation)
  parentIndex: number; // Index of the version this was edited from (-1 for original)
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
  // Version history
  versions: ImageVersion[]; // Array of all versions with their prompts
  currentVersionIndex: number; // Which version is currently being viewed
  // Edit regeneration
  isRegenerating: boolean; // True when an edit is in progress
  hasNewVersion: boolean; // True when a new version is ready after edit
  // Archive
  isArchived: boolean; // True when variation is archived
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [viewingResizedSize, setViewingResizedSize] = useState<string | null>(null);
  const [weirdnessLevel, setWeirdnessLevel] = useState(10);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    title: string;
    fileCount: number;
    onConfirm: () => void;
  } | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSuggestingIteration, setIsSuggestingIteration] = useState(false);
  const [isAnalyzingForIterations, setIsAnalyzingForIterations] = useState(false);
  const [numGenerations, setNumGenerations] = useState(5);
  const [showCustomIteration, setShowCustomIteration] = useState(false);
  const [customIterationDescription, setCustomIterationDescription] = useState('');

  // Get current user's subscription status
  const dbUser = useQuery(api.users.getCurrent);
  const ADMIN_EMAILS = ['coreyrab@gmail.com'];
  const isAdmin = dbUser?.email && ADMIN_EMAILS.includes(dbUser.email.toLowerCase());
  const hasSubscription = isAdmin || (dbUser?.plan && dbUser.plan !== 'none' && dbUser.credits > 0);

  // Debug: log user info
  console.log('dbUser:', dbUser, 'isAdmin:', isAdmin, 'hasSubscription:', hasSubscription);
  const [showArchived, setShowArchived] = useState(false);

  // Original image editing state
  const [originalEditPrompt, setOriginalEditPrompt] = useState('');
  const [isEditingOriginal, setIsEditingOriginal] = useState(false);
  const [originalVersions, setOriginalVersions] = useState<ImageVersion[]>([]);
  const [originalVersionIndex, setOriginalVersionIndex] = useState(0);
  const [originalResizedVersions, setOriginalResizedVersions] = useState<ResizedVersion[]>([]);
  const [viewingOriginalResizedSize, setViewingOriginalResizedSize] = useState<string | null>(null);

  const { user, isLoaded: isUserLoaded } = useUser();
  const createGeneration = useMutation(api.generations.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getOrCreateUser = useMutation(api.users.getOrCreate);

  // Create user in Convex when authenticated
  useEffect(() => {
    if (user && dbUser === null) {
      getOrCreateUser().catch(console.error);
    }
  }, [user, dbUser, getOrCreateUser]);

  // Load default weirdness level from localStorage
  useEffect(() => {
    const savedWeirdness = localStorage.getItem('defaultWeirdness');
    if (savedWeirdness) {
      setWeirdnessLevel(parseInt(savedWeirdness));
    }
  }, []);

  // Load session from history page (resume functionality)
  useEffect(() => {
    const resume = searchParams.get('resume');
    if (resume === 'true') {
      const sessionData = sessionStorage.getItem('resumeSession');
      if (sessionData) {
        try {
          const data = JSON.parse(sessionData);

          // Parse aspect ratio from the stored string (e.g., "4:5 Portrait")
          const aspectRatioMatch = data.aspectRatio.match(/(\d+:\d+)/);
          const aspectRatioKey = aspectRatioMatch ? aspectRatioMatch[1] as AspectRatioKey : 'custom';

          // Create a mock uploaded image from the base64 data URL
          setUploadedImage({
            file: null as any, // We don't have the original file, but we have the URL
            url: data.originalImageUrl,
            filename: data.originalFilename,
            width: 0, // Unknown from saved data
            height: 0,
            aspectRatio: data.aspectRatio,
            aspectRatioKey,
          });

          // Set the analysis
          setAnalysis(data.analysis);

          // Convert saved variations to the full Variation format
          const restoredVariations: Variation[] = data.variations.map((v: any) => ({
            id: v.id || uuidv4(),
            title: v.title,
            description: v.description,
            imageUrl: v.image_url,
            status: v.image_url ? 'completed' : 'idle',
            isEditing: false,
            editPrompt: '',
            isEditingGenerated: false,
            resizedVersions: [],
            versions: v.image_url ? [{ imageUrl: v.image_url, prompt: null, parentIndex: -1 }] : [],
            currentVersionIndex: 0,
            isRegenerating: false,
            hasNewVersion: false,
            isArchived: false,
          }));

          setVariations(restoredVariations);
          setStep('editor');

          // Clean up
          sessionStorage.removeItem('resumeSession');
          router.replace('/'); // Remove the query param from URL
        } catch (err) {
          console.error('Failed to restore session:', err);
          sessionStorage.removeItem('resumeSession');
          router.replace('/');
        }
      }
    }
  }, [searchParams, router]);

  // Get the currently selected variation (for preview)
  const selectedVariation = variations.find(v => v.id === selectedVariationId);

  // Determine which image to show in preview
  const getPreviewImage = () => {
    if (!selectedVariation) {
      // Showing original - check if viewing a resized version
      if (viewingOriginalResizedSize) {
        const resized = originalResizedVersions.find(r => r.size === viewingOriginalResizedSize);
        if (resized?.imageUrl) return resized.imageUrl;
      }
      // Check if we have edited versions
      if (originalVersions.length > 0) {
        return originalVersions[originalVersionIndex].imageUrl;
      }
      return uploadedImage?.url;
    }
    if (viewingResizedSize) {
      const resized = selectedVariation.resizedVersions.find(r => r.size === viewingResizedSize);
      if (resized?.imageUrl) return resized.imageUrl;
    }
    return selectedVariation.imageUrl || uploadedImage?.url;
  };
  const previewImage = getPreviewImage();
  const isShowingGenerated = selectedVariation?.imageUrl ? true : false;
  const isShowingResized = viewingResizedSize && selectedVariation?.resizedVersions.find(r => r.size === viewingResizedSize)?.imageUrl;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const { key, label } = detectAspectRatio(img.width, img.height);
      setUploadedImage({
        file,
        url: objectUrl,
        filename: file.name,
        width: img.width,
        height: img.height,
        aspectRatio: label,
        aspectRatioKey: key,
      });
      setStep('editor');
      setSelectedTool('edit'); // Default to edit tool
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to read image');
    };

    img.src = objectUrl;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: step !== 'upload',
  });

  // Generate iterations on-demand (called from the Iterations tool)
  const handleGenerateIterations = async () => {
    if (!uploadedImage) return;

    setIsAnalyzingForIterations(true);
    setError(null);

    try {
      const base64 = await fileToBase64(uploadedImage.file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: uploadedImage.file.type,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      let analysisData: Analysis;
      if (response.ok) {
        const data = await response.json();
        analysisData = data.analysis;
      } else {
        analysisData = {
          product: 'Product from uploaded ad',
          brand_style: 'Modern, clean aesthetic',
          visual_elements: ['Product shot', 'Clean background', 'Text overlay'],
          key_selling_points: ['Quality', 'Value', 'Design'],
          target_audience: 'General consumers',
          colors: ['Primary brand colors'],
          mood: 'Professional and appealing',
        };
      }

      setAnalysis(analysisData);

      const varResponse = await fetch('/api/suggest-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisData,
          aspectRatio: uploadedImage.aspectRatio,
          additionalContext: additionalContext.trim() || undefined,
          numVariations: numGenerations,
        }),
      });

      let variationsData: Variation[];
      const defaultVariationFields = {
        imageUrl: null,
        status: 'idle' as const,
        isEditing: false,
        editPrompt: '',
        isEditingGenerated: false,
        resizedVersions: [],
        versions: [],
        currentVersionIndex: 0,
        isRegenerating: false,
        hasNewVersion: false,
        isArchived: false,
      };

      if (varResponse.ok) {
        const data = await varResponse.json();
        variationsData = data.variations.slice(0, numGenerations).map((v: any) => ({
          id: uuidv4(),
          title: v.title,
          description: v.description,
          ...defaultVariationFields,
        }));
      } else {
        // Fallback variations based on analysis if API fails
        const product = analysisData.product || 'the product';
        const audience = analysisData.target_audience || 'the target audience';
        variationsData = [
          { id: uuidv4(), title: 'Morning Routine', description: `${product} featured in a bright morning setting. Natural sunlight streaming through windows, clean modern interior, person starting their day with energy. Warm golden hour lighting with soft shadows. Appeals to ${audience} during their daily routine.`, ...defaultVariationFields },
          { id: uuidv4(), title: 'On-The-Go', description: `${product} shown in an urban outdoor setting. Person walking through a vibrant city street, modern architecture in background, dynamic lifestyle moment. Bright natural lighting with urban energy. Targets ${audience} with busy, active lifestyles.`, ...defaultVariationFields },
          { id: uuidv4(), title: 'Work From Home', description: `${product} in a stylish home office environment. Clean desk setup, plant accents, laptop visible, cozy yet professional atmosphere. Soft diffused lighting from large windows. Resonates with ${audience} who work remotely.`, ...defaultVariationFields },
          { id: uuidv4(), title: 'Weekend Vibes', description: `${product} in a relaxed weekend setting. Casual lifestyle moment, comfortable surroundings, natural and authentic feel. Warm afternoon lighting with relaxed composition. Appeals to ${audience} during their downtime.`, ...defaultVariationFields },
        ];
      }

      setVariations(variationsData);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzingForIterations(false);
    }
  };

  // Add a custom iteration
  const handleAddCustomIteration = () => {
    if (!customIterationDescription.trim()) return;

    // Auto-generate title from first few words of description
    const words = customIterationDescription.trim().split(/\s+/);
    const title = words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');

    const newVariation: Variation = {
      id: uuidv4(),
      title: title || 'Custom',
      description: customIterationDescription.trim(),
      imageUrl: null,
      status: 'idle',
      isEditing: false,
      editPrompt: '',
      isEditingGenerated: false,
      resizedVersions: [],
      versions: [],
      currentVersionIndex: 0,
      isRegenerating: false,
      hasNewVersion: false,
      isArchived: false,
    };

    setVariations(prev => [...prev, newVariation]);
    setCustomIterationDescription('');
    setShowCustomIteration(false);
  };

  const handleGenerateSingle = async (variationId: string) => {
    if (!uploadedImage || !analysis) return;

    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    setVariations(prev =>
      prev.map(v => (v.id === variationId ? { ...v, status: 'generating', isEditing: false } : v))
    );

    try {
      const base64 = await fileToBase64(uploadedImage.file);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: uploadedImage.file.type,
          analysis,
          variationDescription: variation.description,
          aspectRatio: uploadedImage.aspectRatio,
        }),
      });

      let imageUrl: string;
      if (response.ok) {
        const data = await response.json();
        imageUrl = data.imageUrl;
      } else {
        imageUrl = `https://placehold.co/400x500/6366f1/white?text=${encodeURIComponent(variation.title)}`;
      }

      setVariations(prev =>
        prev.map(v => (v.id === variationId ? {
          ...v,
          status: 'completed',
          imageUrl,
          versions: [{ imageUrl, prompt: null, parentIndex: -1 }], // Store first version (no edit prompt for initial generation)
          currentVersionIndex: 0,
        } : v))
      );

      // Don't auto-select - let user stay where they are to avoid UI jump
    } catch (err) {
      console.error('Generation error:', err);
      setVariations(prev =>
        prev.map(v => (v.id === variationId ? { ...v, status: 'error' } : v))
      );
    }
  };

  const handleGenerateAll = async () => {
    const idleVariations = variations.filter(v => v.status === 'idle');
    for (const variation of idleVariations) {
      await handleGenerateSingle(variation.id);
    }
  };

  const handleUpdateDescription = (id: string, newDescription: string) => {
    setVariations(prev =>
      prev.map(v => (v.id === id ? { ...v, description: newDescription } : v))
    );
  };

  const toggleEditing = (id: string) => {
    setVariations(prev =>
      prev.map(v => (v.id === id ? { ...v, isEditing: !v.isEditing } : v))
    );
  };

  const handleDeleteVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id));
    if (selectedVariationId === id) {
      setSelectedVariationId(null);
    }
  };

  const handleArchiveVariation = (id: string) => {
    setVariations(prev =>
      prev.map(v => (v.id === id ? { ...v, isArchived: true } : v))
    );
    if (selectedVariationId === id) {
      setSelectedVariationId(null);
    }
  };

  const handleRestoreVariation = (id: string) => {
    setVariations(prev =>
      prev.map(v => (v.id === id ? { ...v, isArchived: false } : v))
    );
  };

  const handleAddCustomVariation = () => {
    if (!customPrompt.trim()) return;
    const newVariation: Variation = {
      id: uuidv4(),
      title: 'Custom',
      description: customPrompt.trim(),
      imageUrl: null,
      status: 'idle',
      isEditing: false,
      editPrompt: '',
      isEditingGenerated: false,
      resizedVersions: [],
      versions: [],
      currentVersionIndex: 0,
      isRegenerating: false,
      hasNewVersion: false,
      isArchived: false,
    };
    setVariations(prev => [...prev, newVariation]);
    setCustomPrompt('');
  };

  const handleGeneratePrompt = async () => {
    if (!analysis) return;

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          weirdnessLevel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomPrompt(data.prompt);
      }
    } catch (err) {
      console.error('Failed to generate prompt:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const getWeirdnessLabel = (value: number) => {
    if (value <= 20) return { label: 'Standard', color: 'text-blue-400' };
    if (value <= 40) return { label: 'Lifestyle', color: 'text-green-400' };
    if (value <= 60) return { label: 'Attention', color: 'text-yellow-400' };
    if (value <= 80) return { label: 'Shareable', color: 'text-orange-400' };
    return { label: 'Viral', color: 'text-pink-400' };
  };

  const handleEditGenerated = (id: string, editPrompt: string) => {
    setVariations(prev =>
      prev.map(v => (v.id === id ? { ...v, editPrompt } : v))
    );
  };

  const toggleEditingGenerated = (id: string) => {
    setVariations(prev =>
      prev.map(v => (v.id === id ? { ...v, isEditingGenerated: !v.isEditingGenerated, editPrompt: '' } : v))
    );
  };

  const handleRegenerateWithEdit = async (variationId: string) => {
    if (!uploadedImage || !analysis) return;

    const variation = variations.find(v => v.id === variationId);
    if (!variation || !variation.editPrompt.trim()) return;

    // Store the edit prompt before we clear it
    const editPromptUsed = variation.editPrompt.trim();

    // Keep current image visible, just show regenerating indicator
    setVariations(prev =>
      prev.map(v => (v.id === variationId ? { ...v, isRegenerating: true, hasNewVersion: false } : v))
    );

    try {
      const base64 = await fileToBase64(uploadedImage.file);

      // Use the generated image as the new reference for editing
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: variation.imageUrl?.startsWith('data:')
            ? variation.imageUrl.split(',')[1]
            : base64,
          mimeType: uploadedImage.file.type,
          analysis,
          variationDescription: `${variation.description}\n\nEDIT REQUEST: ${editPromptUsed}`,
          aspectRatio: uploadedImage.aspectRatio,
          isEdit: true,
        }),
      });

      let imageUrl: string;
      if (response.ok) {
        const data = await response.json();
        imageUrl = data.imageUrl;
      } else {
        // On error, keep current image
        setVariations(prev =>
          prev.map(v => (v.id === variationId ? { ...v, isRegenerating: false, editPrompt: '' } : v))
        );
        return;
      }

      // Add new version to history and show "new version ready" indicator
      setVariations(prev =>
        prev.map(v => {
          if (v.id !== variationId) return v;
          const newVersions: ImageVersion[] = [...v.versions, { imageUrl, prompt: editPromptUsed, parentIndex: v.currentVersionIndex }];
          return {
            ...v,
            isRegenerating: false,
            hasNewVersion: true,
            editPrompt: '',
            versions: newVersions,
            // Don't auto-switch to new version - let user click to view it
          };
        })
      );
    } catch (err) {
      console.error('Edit generation error:', err);
      setVariations(prev =>
        prev.map(v => (v.id === variationId ? { ...v, isRegenerating: false, editPrompt: '' } : v))
      );
    }
  };

  // Edit original image (or currently selected resized version)
  const handleEditOriginal = async () => {
    if (!uploadedImage || !originalEditPrompt.trim()) return;

    setIsEditingOriginal(true);

    try {
      // Determine which image to edit based on currently selected size
      let currentImageUrl: string;
      let aspectRatioToUse: string;

      if (viewingOriginalResizedSize) {
        // Editing a resized version
        const resizedVersion = originalResizedVersions.find(r => r.size === viewingOriginalResizedSize);
        if (!resizedVersion?.imageUrl) {
          console.error('Resized version not found');
          setIsEditingOriginal(false);
          return;
        }
        currentImageUrl = resizedVersion.imageUrl;
        aspectRatioToUse = viewingOriginalResizedSize; // e.g., "1:1", "9:16"
      } else {
        // Editing the original
        currentImageUrl = originalVersions.length > 0
          ? originalVersions[originalVersionIndex].imageUrl
          : uploadedImage.url;
        aspectRatioToUse = uploadedImage.aspectRatio;
      }

      // Convert image URL to base64 if it's a data URL, otherwise fetch and convert
      let imageToEdit: string;
      if (currentImageUrl.startsWith('data:')) {
        imageToEdit = currentImageUrl.split(',')[1];
      } else {
        // For blob URLs or other formats, we need the original file
        const base64 = await fileToBase64(uploadedImage.file);
        imageToEdit = base64;
      }

      // Store the prompt before clearing it
      const editPromptUsed = originalEditPrompt.trim();

      // Use analysis if available, otherwise provide minimal context
      const analysisToUse = analysis || {
        product: 'Image',
        brand_style: 'Not specified',
        visual_elements: [],
        key_selling_points: [],
        target_audience: 'General',
        colors: [],
        mood: 'Not specified',
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageToEdit,
          mimeType: uploadedImage.file.type,
          analysis: analysisToUse,
          variationDescription: `EDIT REQUEST: ${editPromptUsed}`,
          aspectRatio: aspectRatioToUse,
          isEdit: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newImageUrl = data.imageUrl;

        if (viewingOriginalResizedSize) {
          // Update the resized version with the edited image
          setOriginalResizedVersions(prev =>
            prev.map(r => r.size === viewingOriginalResizedSize
              ? { ...r, imageUrl: newImageUrl }
              : r
            )
          );
        } else {
          // Initialize versions array if empty, then add new version
          const currentVersions: ImageVersion[] = originalVersions.length === 0
            ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1 }]
            : originalVersions;

          const newVersions: ImageVersion[] = [...currentVersions, { imageUrl: newImageUrl, prompt: editPromptUsed, parentIndex: originalVersionIndex }];
          setOriginalVersions(newVersions);
          setOriginalVersionIndex(newVersions.length - 1);
        }
      }

      setOriginalEditPrompt('');
    } catch (err) {
      console.error('Original edit error:', err);
    } finally {
      setIsEditingOriginal(false);
    }
  };

  // Navigate original image versions
  const handleOriginalVersionChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && originalVersionIndex > 0) {
      setOriginalVersionIndex(originalVersionIndex - 1);
    } else if (direction === 'next' && originalVersionIndex < originalVersions.length - 1) {
      setOriginalVersionIndex(originalVersionIndex + 1);
    }
  };

  // View the latest version (after edit regeneration)
  const handleViewLatestVersion = (variationId: string) => {
    setVariations(prev =>
      prev.map(v => {
        if (v.id !== variationId) return v;
        const latestIndex = v.versions.length - 1;
        return {
          ...v,
          imageUrl: v.versions[latestIndex].imageUrl,
          currentVersionIndex: latestIndex,
          hasNewVersion: false,
        };
      })
    );
  };

  // Navigate between versions
  const handleVersionChange = (variationId: string, direction: 'prev' | 'next') => {
    setVariations(prev =>
      prev.map(v => {
        if (v.id !== variationId) return v;
        let newIndex = v.currentVersionIndex;
        if (direction === 'prev' && newIndex > 0) {
          newIndex--;
        } else if (direction === 'next' && newIndex < v.versions.length - 1) {
          newIndex++;
        }
        return {
          ...v,
          currentVersionIndex: newIndex,
          imageUrl: v.versions[newIndex].imageUrl,
          hasNewVersion: newIndex < v.versions.length - 1 ? false : v.hasNewVersion,
        };
      })
    );
  };

  // Duplicate a variation (duplicates the currently viewed version)
  const handleDuplicateVariation = (variationId: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation || !variation.imageUrl) return;

    // Get the currently viewed version's image
    const currentVersionImage = variation.versions[variation.currentVersionIndex]?.imageUrl || variation.imageUrl;

    const duplicatedVariation: Variation = {
      id: uuidv4(),
      title: `${variation.title} (copy)`,
      description: variation.description,
      imageUrl: currentVersionImage,
      status: 'completed',
      isEditing: false,
      editPrompt: '',
      isEditingGenerated: false,
      resizedVersions: [],
      versions: [{ imageUrl: currentVersionImage, prompt: null, parentIndex: -1 }],
      currentVersionIndex: 0,
      isRegenerating: false,
      hasNewVersion: false,
      isArchived: false,
    };

    setVariations(prev => [...prev, duplicatedVariation]);
    setSelectedVariationId(duplicatedVariation.id);
  };

  const handleResizeImage = async (variationId: string, size: typeof AD_SIZES[number]) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation || !variation.imageUrl || !analysis) return;

    // Check if already resizing or completed
    const existingResize = variation.resizedVersions.find(r => r.size === size.name);
    if (existingResize?.status === 'resizing') return;

    // Update status to resizing
    setVariations(prev =>
      prev.map(v => {
        if (v.id !== variationId) return v;
        const existingIndex = v.resizedVersions.findIndex(r => r.size === size.name);
        if (existingIndex >= 0) {
          const updated = [...v.resizedVersions];
          updated[existingIndex] = { ...updated[existingIndex], status: 'resizing' };
          return { ...v, resizedVersions: updated };
        }
        return {
          ...v,
          resizedVersions: [...v.resizedVersions, { size: size.name, imageUrl: null, status: 'resizing' }],
        };
      })
    );

    try {
      const response = await fetch('/api/resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: variation.imageUrl.startsWith('data:')
            ? variation.imageUrl.split(',')[1]
            : variation.imageUrl,
          mimeType: 'image/png',
          targetWidth: size.width,
          targetHeight: size.height,
          targetRatio: size.name,
          analysis,
        }),
      });

      let imageUrl: string;
      if (response.ok) {
        const data = await response.json();
        imageUrl = data.imageUrl;
      } else {
        throw new Error('Failed to resize');
      }

      setVariations(prev =>
        prev.map(v => {
          if (v.id !== variationId) return v;
          const updated = v.resizedVersions.map(r =>
            r.size === size.name ? { ...r, status: 'completed' as const, imageUrl } : r
          );
          return { ...v, resizedVersions: updated };
        })
      );
    } catch (err) {
      console.error('Resize error:', err);
      setVariations(prev =>
        prev.map(v => {
          if (v.id !== variationId) return v;
          const updated = v.resizedVersions.map(r =>
            r.size === size.name ? { ...r, status: 'error' as const } : r
          );
          return { ...v, resizedVersions: updated };
        })
      );
    }
  };

  // Resize original image
  const handleResizeOriginal = async (size: typeof AD_SIZES[number]) => {
    if (!uploadedImage || !analysis) return;

    // Get the current image to resize (either original or edited version)
    const currentImageUrl = originalVersions.length > 0
      ? originalVersions[originalVersionIndex].imageUrl
      : uploadedImage.url;

    // Check if already resizing or completed
    const existingResize = originalResizedVersions.find(r => r.size === size.name);
    if (existingResize?.status === 'resizing') return;

    // Update status to resizing
    setOriginalResizedVersions(prev => {
      const existingIndex = prev.findIndex(r => r.size === size.name);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], status: 'resizing' };
        return updated;
      }
      return [...prev, { size: size.name, imageUrl: null, status: 'resizing' }];
    });

    try {
      // Convert image URL to base64 if needed
      let imageData: string;
      if (currentImageUrl.startsWith('data:')) {
        imageData = currentImageUrl.split(',')[1];
      } else {
        // For blob URLs, fetch and convert
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch('/api/resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          mimeType: 'image/png',
          targetWidth: size.width,
          targetHeight: size.height,
          targetRatio: size.name,
          analysis,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalResizedVersions(prev =>
          prev.map(r => r.size === size.name ? { ...r, status: 'completed', imageUrl: data.imageUrl } : r)
        );
      } else {
        throw new Error('Failed to resize');
      }
    } catch (err) {
      console.error('Resize original error:', err);
      setOriginalResizedVersions(prev =>
        prev.map(r => r.size === size.name ? { ...r, status: 'error' } : r)
      );
    }
  };

  const handleReset = () => {
    if (uploadedImage?.url) URL.revokeObjectURL(uploadedImage.url);
    setStep('upload');
    setUploadedImage(null);
    setAnalysis(null);
    setVariations([]);
    setSelectedVariationId(null);
    setViewingResizedSize(null);
    setError(null);
    setCustomPrompt('');
    setAdditionalContext('');
    // Reset original editing state
    setOriginalEditPrompt('');
    setIsEditingOriginal(false);
    setOriginalVersions([]);
    setOriginalVersionIndex(0);
    setOriginalResizedVersions([]);
    setViewingOriginalResizedSize(null);
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Count files for a single variation (all versions + all resizes)
  const getVariationFileCount = (variation: Variation) => {
    const versionCount = variation.versions.length;
    const resizeCount = variation.resizedVersions.filter(r => r.status === 'completed').length;
    return versionCount + resizeCount;
  };

  // Download all files for a variation
  const downloadVariationAll = async (variation: Variation) => {
    const downloads: { url: string; name: string }[] = [];

    // Add all versions
    variation.versions.forEach((version, idx) => {
      downloads.push({ url: version.imageUrl, name: `${variation.title}_v${idx + 1}.png` });
    });

    // Add all completed resizes
    variation.resizedVersions
      .filter(r => r.status === 'completed' && r.imageUrl)
      .forEach(r => {
        downloads.push({ url: r.imageUrl!, name: `${variation.title}_${r.size}.png` });
      });

    for (const { url, name } of downloads) {
      await handleDownload(url, name);
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between downloads
    }
  };

  // Count all files across all variations + original
  const getAllFileCount = () => {
    let count = uploadedImage ? 1 : 0; // Original image
    variations.forEach(v => {
      if (v.status === 'completed') {
        count += getVariationFileCount(v);
      }
    });
    return count;
  };

  // Download everything
  const downloadAllGenerations = async () => {
    // Download original
    if (uploadedImage) {
      await handleDownload(uploadedImage.url, `original_${uploadedImage.filename}`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Download all variations
    for (const variation of variations) {
      if (variation.status === 'completed') {
        await downloadVariationAll(variation);
      }
    }
  };

  // Count sizes for current version of a variation
  const getVersionSizesCount = (variation: Variation) => {
    return 1 + variation.resizedVersions.filter(r => r.status === 'completed').length; // Current version + resizes
  };

  // Download current version + all its sizes
  const downloadVersionWithSizes = async (variation: Variation) => {
    const currentVersion = variation.versions[variation.currentVersionIndex];
    if (!currentVersion) return;

    // Download current version
    await handleDownload(currentVersion.imageUrl, `${variation.title}_v${variation.currentVersionIndex + 1}.png`);

    // Download all completed resizes
    for (const resize of variation.resizedVersions.filter(r => r.status === 'completed' && r.imageUrl)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await handleDownload(resize.imageUrl!, `${variation.title}_v${variation.currentVersionIndex + 1}_${resize.size}.png`);
    }
  };

  const handleSaveToHistory = async () => {
    if (!user || !uploadedImage || !analysis) return;

    const completedVariations = variations.filter(v => v.status === 'completed' && v.imageUrl);
    if (completedVariations.length === 0) return;

    try {
      // Upload original image to Convex storage
      const originalImageId = await uploadFileToConvex(generateUploadUrl, uploadedImage.file);

      // Upload variation images to Convex storage
      const variationsToSave = await Promise.all(
        completedVariations.map(async (v) => {
          let imageId;
          if (v.imageUrl) {
            // Convert data URL to blob and upload
            const blob = dataUrlToBlob(v.imageUrl);
            imageId = await uploadFileToConvex(generateUploadUrl, blob);
          }
          return {
            id: v.id,
            title: v.title,
            description: v.description,
            imageId: imageId,
          };
        })
      );

      await createGeneration({
        originalImageId: originalImageId,
        originalFilename: uploadedImage.filename,
        aspectRatio: uploadedImage.aspectRatio,
        analysis: analysis,
        variations: variationsToSave,
      });
    } catch (err) {
      console.error('Failed to save generation:', err);
    }
  };

  const completedCount = variations.filter(v => v.status === 'completed').length;
  const generatingCount = variations.filter(v => v.status === 'generating').length;

  // Helper to check if action requires auth and subscription
  const requireAuth = (action: () => void) => {
    if (!user) {
      setPendingAction(() => action);
      setShowSignUpPrompt(true);
      return;
    }
    // User is signed in, check subscription (skip if still loading or admin)
    if (dbUser !== undefined && !hasSubscription) {
      setPendingAction(() => action);
      setShowPlanSelection(true);
      return;
    }
    action();
  };

  // Handle successful sign-in - check if plan selection is needed
  useEffect(() => {
    if (user && showSignUpPrompt) {
      setShowSignUpPrompt(false);
      // After sign-in, check if user needs to select a plan (wait for dbUser to load)
      if (dbUser !== undefined && !hasSubscription) {
        setShowPlanSelection(true);
      } else if (pendingAction && hasSubscription) {
        // User has subscription, execute pending action
        pendingAction();
        setPendingAction(null);
      }
    }
  }, [user, dbUser, hasSubscription, showSignUpPrompt, pendingAction]);

  // Show landing page for non-authenticated users who haven't uploaded yet
  if (isUserLoaded && step === 'upload') {
    return (
      <LandingPage
        onUpload={(file: File) => {
          // Handle upload from landing page
          if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
          }

          const img = new Image();
          const objectUrl = URL.createObjectURL(file);

          img.onload = () => {
            const { key, label } = detectAspectRatio(img.width, img.height);
            setUploadedImage({
              file,
              url: objectUrl,
              filename: file.name,
              width: img.width,
              height: img.height,
              aspectRatio: label,
              aspectRatioKey: key,
            });
            setStep('editor');
            setSelectedTool('edit'); // Default to edit tool
          };

          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            setError('Failed to read image');
          };

          img.src = objectUrl;
        }}
      />
    );
  }

  // Show loading while checking auth
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="StaticKit" className="w-7 h-7" />
            <span className="text-lg">StaticKit</span>
          </div>

          <div className="flex items-center gap-3">
            {step === 'editor' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload
              </Button>
            )}
            {user ? (
              <>
                <Link href="/history">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                    <FolderOpen className="w-4 h-4 mr-1.5" />
                    My Ads
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign in
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* Upload State */}
      {step === 'upload' && (
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Iterate on Your Ads
            </h1>
            <p className="text-white/50 text-lg">
              Upload your winning ad and create iterations in seconds
            </p>
          </div>

          <div
            {...getRootProps()}
            className={`border border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-white/20 hover:border-white/40 bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-white/60" />
              </div>
              {isDragActive ? (
                <p className="text-amber-400 font-medium text-lg">Drop your ad here...</p>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-xl mb-1">Drop your ad image here</p>
                    <p className="text-white/50">or click to browse</p>
                  </div>
                  <p className="text-sm text-white/30">PNG, JPG, WebP • Max 10MB</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
        </main>
      )}

      {/* Editor State - Main Interface */}
      {step === 'editor' && (
        <main className="h-[calc(100vh-57px)] flex p-6 gap-6">
          {/* Center Panel - Image Preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Horizontal Toolbar - Above Image */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/10 rounded-xl">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedTool('edit')}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                        selectedTool === 'edit'
                          ? 'bg-amber-600 text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Wand2 className="w-4 h-4" />
                      Edit
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>AI-powered editing & resize</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedTool('iterations')}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                        selectedTool === 'iterations'
                          ? 'bg-amber-600 text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Iterations
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Generate variations</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedTool('export')}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                        selectedTool === 'export'
                          ? 'bg-amber-600 text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Download images</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Version Control Bar */}
            <div className="flex items-center justify-center gap-3 mb-3 px-1">
              {/* Original image info with version dots */}
              {!isShowingGenerated && uploadedImage && (
                <div className="flex items-center gap-3">
                  {/* Original dot with filename */}
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (originalVersions.length > 0) {
                              setOriginalVersionIndex(0);
                            }
                          }}
                          className={`w-3 h-3 rounded-full transition-all ${
                            originalVersionIndex === 0 || originalVersions.length === 0
                              ? 'bg-emerald-500 scale-110'
                              : 'bg-white/30 hover:bg-white/50'
                          }`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Original: {uploadedImage.filename}
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-sm text-white/50">
                      {uploadedImage.filename}
                    </span>
                  </div>

                  {/* Additional version dots if edited */}
                  {originalVersions.length > 1 && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                      {originalVersions.slice(1).map((version, idx) => {
                        const actualIdx = idx + 1;
                        const isBranch = version.parentIndex !== actualIdx - 1 && version.parentIndex !== -1;
                        const isSelected = actualIdx === originalVersionIndex;
                        return (
                          <Tooltip key={actualIdx}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setOriginalVersionIndex(actualIdx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  isSelected
                                    ? isBranch ? 'bg-violet-500 scale-110' : 'bg-emerald-500 scale-110'
                                    : isBranch ? 'bg-violet-400/40 hover:bg-violet-400/60' : 'bg-white/30 hover:bg-white/50'
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div>v{actualIdx + 1}: "{version.prompt}"</div>
                                {isBranch && (
                                  <div className="text-violet-300 mt-0.5">
                                    branched from v{version.parentIndex + 1}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Generated image version control */}
              {isShowingGenerated && selectedVariation && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/50">{selectedVariation.title}</span>
                  {selectedVariation.versions.length > 1 && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                      {selectedVariation.versions.map((version, idx) => {
                        const isBranch = idx > 0 && version.parentIndex !== idx - 1 && version.parentIndex !== -1;
                        const isSelected = idx === selectedVariation.currentVersionIndex;
                        const isNewVersion = idx === selectedVariation.versions.length - 1 && selectedVariation.hasNewVersion;
                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  setVariations(prev => prev.map(v =>
                                    v.id === selectedVariation.id
                                      ? { ...v, currentVersionIndex: idx, hasNewVersion: false }
                                      : v
                                  ));
                                }}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  isSelected
                                    ? isBranch ? 'bg-violet-500 scale-110' : 'bg-amber-500 scale-110'
                                    : isNewVersion
                                    ? 'bg-green-500 animate-pulse'
                                    : isBranch ? 'bg-violet-400/40 hover:bg-violet-400/60' : 'bg-white/30 hover:bg-white/50'
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div>{version.prompt ? `v${idx + 1}: "${version.prompt}"` : `v${idx + 1}: Original`}</div>
                                {isBranch && (
                                  <div className="text-violet-300 mt-0.5">
                                    branched from v{version.parentIndex + 1}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legacy Controls Section - Removed, keeping closing structure */}
            <div className="hidden">
              {isShowingGenerated && selectedVariation?.status === 'completed' && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  {selectedVariation.versions.length > 1 && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVersionChange(selectedVariation.id, 'prev')}
                          disabled={selectedVariation.currentVersionIndex === 0}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {selectedVariation.versions.map((version, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setVariations(prev => prev.map(v =>
                                      v.id === selectedVariation.id
                                        ? { ...v, currentVersionIndex: idx, hasNewVersion: false }
                                        : v
                                    ));
                                  }}
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    idx === selectedVariation.currentVersionIndex
                                      ? 'bg-amber-500 scale-110'
                                      : idx === selectedVariation.versions.length - 1 && selectedVariation.hasNewVersion
                                      ? 'bg-green-500 animate-pulse'
                                      : 'bg-white/30 hover:bg-white/50'
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {version.prompt ? `v${idx + 1}: "${version.prompt}"` : `v${idx + 1}: Original`}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                        <button
                          onClick={() => handleVersionChange(selectedVariation.id, 'next')}
                          disabled={selectedVariation.currentVersionIndex === selectedVariation.versions.length - 1}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-white/40 ml-1">
                          v{selectedVariation.currentVersionIndex + 1}
                          {selectedVariation.versions[selectedVariation.currentVersionIndex]?.prompt && (
                            <span className="italic ml-1">
                              · "{selectedVariation.versions[selectedVariation.currentVersionIndex].prompt}"
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* New version ready indicator */}
                  {selectedVariation.hasNewVersion && (
                    <button
                      onClick={() => handleViewLatestVersion(selectedVariation.id)}
                      className="w-full mb-3 p-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      New version ready - Click to view
                    </button>
                  )}

                  {/* Refine prompt */}
                  <p className="text-sm font-medium mb-2 text-white/70">Refine this image</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 'make the lighting warmer'"
                      value={selectedVariation.editPrompt}
                      onChange={(e) => handleEditGenerated(selectedVariation.id, e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white/80 text-sm placeholder:text-white/30"
                      disabled={selectedVariation.isRegenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedVariation.editPrompt.trim() && !selectedVariation.isRegenerating) {
                          requireAuth(() => handleRegenerateWithEdit(selectedVariation.id));
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => requireAuth(() => handleRegenerateWithEdit(selectedVariation.id))}
                      disabled={!selectedVariation.editPrompt.trim() || selectedVariation.isRegenerating}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                    >
                      {selectedVariation.isRegenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Resize for generated images */}
              {isShowingGenerated && selectedVariation?.status === 'completed' && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white/70">Resize for platforms</p>
                    {(() => {
                      const completedCount = selectedVariation.resizedVersions.filter(r => r.status === 'completed').length + 1;
                      return completedCount > 1 ? (
                        <button
                          onClick={async () => {
                            if (selectedVariation.imageUrl) {
                              await handleDownload(selectedVariation.imageUrl, `${selectedVariation.title}_original.png`);
                            }
                            for (const resized of selectedVariation.resizedVersions.filter(r => r.status === 'completed' && r.imageUrl)) {
                              await handleDownload(resized.imageUrl!, `${selectedVariation.title}_${resized.size}.png`);
                              await new Promise(resolve => setTimeout(resolve, 300));
                            }
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download ({completedCount})
                        </button>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewingResizedSize(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        !viewingResizedSize
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{uploadedImage ? `${uploadedImage.width}x${uploadedImage.height}` : 'Original'}</span>
                      <span className="text-white/40">Uploaded</span>
                    </button>
                    {AD_SIZES.map((size) => {
                      const resized = selectedVariation.resizedVersions.find(r => r.size === size.name);
                      const isResizing = resized?.status === 'resizing';
                      const isCompleted = resized?.status === 'completed';
                      const isViewing = viewingResizedSize === size.name;
                      return (
                        <button
                          key={size.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              setViewingResizedSize(size.name);
                            } else if (!isResizing) {
                              requireAuth(() => handleResizeImage(selectedVariation.id, size));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isViewing
                              ? 'bg-amber-500 text-white'
                              : isResizing
                              ? 'bg-white/10 text-white/60 cursor-wait'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                          }`}
                          disabled={isResizing}
                        >
                          {isResizing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isCompleted ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <div
                              className="bg-white/20 border border-white/30 rounded-[2px]"
                              style={{
                                width: size.width >= size.height ? 12 : 12 * (size.width / size.height),
                                height: size.height >= size.width ? 12 : 12 * (size.height / size.width),
                              }}
                            />
                          )}
                          <span>{size.name}</span>
                          <span className="text-white/40">{size.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Edit controls for original image */}
              {!isShowingGenerated && uploadedImage && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  {/* Version indicator and navigation */}
                  {originalVersions.length > 1 && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOriginalVersionChange('prev')}
                          disabled={originalVersionIndex === 0}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {originalVersions.map((version, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setOriginalVersionIndex(idx)}
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    idx === originalVersionIndex
                                      ? 'bg-emerald-500 scale-110'
                                      : 'bg-white/30 hover:bg-white/50'
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {version.prompt ? `v${idx + 1}: "${version.prompt}"` : `v${idx + 1}: Original`}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                        <button
                          onClick={() => handleOriginalVersionChange('next')}
                          disabled={originalVersionIndex === originalVersions.length - 1}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-white/40 ml-1">
                          {originalVersionIndex === 0 ? 'Original' : `v${originalVersionIndex + 1}`}
                          {originalVersions[originalVersionIndex]?.prompt && (
                            <span className="italic ml-1">
                              · "{originalVersions[originalVersionIndex].prompt}"
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Edit prompt */}
                  <p className="text-sm font-medium mb-2 text-white/70">Edit this image</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 'make the background brighter'"
                      value={originalEditPrompt}
                      onChange={(e) => setOriginalEditPrompt(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white/80 text-sm placeholder:text-white/30"
                      disabled={isEditingOriginal}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && originalEditPrompt.trim() && !isEditingOriginal) {
                          requireAuth(handleEditOriginal);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => requireAuth(handleEditOriginal)}
                      disabled={!originalEditPrompt.trim() || isEditingOriginal}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                    >
                      {isEditingOriginal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Resize controls for original image */}
              {!isShowingGenerated && uploadedImage && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white/70">Resize for platforms</p>
                    {(() => {
                      const completedCount = originalResizedVersions.filter(r => r.status === 'completed').length + 1;
                      return completedCount > 1 ? (
                        <button
                          onClick={async () => {
                            if (uploadedImage.url) {
                              await handleDownload(uploadedImage.url, `original_${uploadedImage.width}x${uploadedImage.height}.png`);
                            }
                            for (const resized of originalResizedVersions.filter(r => r.status === 'completed' && r.imageUrl)) {
                              await handleDownload(resized.imageUrl!, `original_${resized.size}.png`);
                              await new Promise(resolve => setTimeout(resolve, 300));
                            }
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download ({completedCount})
                        </button>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewingOriginalResizedSize(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        !viewingOriginalResizedSize
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{`${uploadedImage.width}x${uploadedImage.height}`}</span>
                      <span className="text-white/40">Uploaded</span>
                    </button>
                    {AD_SIZES.map((size) => {
                      const resized = originalResizedVersions.find(r => r.size === size.name);
                      const isResizing = resized?.status === 'resizing';
                      const isCompleted = resized?.status === 'completed';
                      const isViewing = viewingOriginalResizedSize === size.name;
                      return (
                        <button
                          key={size.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              setViewingOriginalResizedSize(size.name);
                            } else if (!isResizing) {
                              requireAuth(() => handleResizeOriginal(size));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isViewing
                              ? 'bg-emerald-500 text-white'
                              : isResizing
                              ? 'bg-white/10 text-white/50 cursor-wait'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {isResizing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isCompleted ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <div
                              className="bg-white/20 border border-white/30 rounded-[2px]"
                              style={{
                                width: size.width >= size.height ? 12 : 12 * (size.width / size.height),
                                height: size.height >= size.width ? 12 : 12 * (size.height / size.width),
                              }}
                            />
                          )}
                          <span>{size.name}</span>
                          <span className="text-white/40">{size.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Image Preview */}
            <div className="flex-1 flex items-center justify-center bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden relative min-h-0 p-8">
              {previewImage ? (
                <>
                  <img
                    src={previewImage}
                    alt={isShowingGenerated ? 'Generated variation' : 'Original ad'}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                  {/* Loading overlay when editing */}
                  {isEditingOriginal && !isShowingGenerated && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <span className="text-sm text-white/70">Applying edit...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white/30">No image</div>
              )}

              {/* Floating Edit Chat Input - shows when edit tool selected */}
              {selectedTool === 'edit' && !isShowingGenerated && uploadedImage && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  <div className="bg-black/70 backdrop-blur-md rounded-full border border-white/20 shadow-2xl flex items-center gap-2 pl-4 pr-1.5 py-1.5">
                    <input
                      type="text"
                      placeholder="Describe an edit..."
                      value={originalEditPrompt}
                      onChange={(e) => setOriginalEditPrompt(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                      disabled={isEditingOriginal}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && originalEditPrompt.trim() && !isEditingOriginal) {
                          requireAuth(handleEditOriginal);
                        }
                      }}
                    />
                    <button
                      onClick={() => requireAuth(handleEditOriginal)}
                      disabled={!originalEditPrompt.trim() || isEditingOriginal}
                      className="p-2 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isEditingOriginal ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Send className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  {originalVersions.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-xs text-white/40">v{originalVersionIndex + 1}/{originalVersions.length}</span>
                      <button
                        onClick={() => setOriginalVersionIndex(0)}
                        disabled={originalVersionIndex === 0}
                        className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons overlay */}
              {previewImage && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          const filename = isShowingGenerated && selectedVariation
                            ? `${selectedVariation.title}${viewingResizedSize ? `_${viewingResizedSize}` : ''}.png`
                            : uploadedImage?.filename || 'image.png';
                          handleDownload(previewImage, filename);
                        }}
                        className="p-2 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Download image</TooltipContent>
                  </Tooltip>
                </div>
              )}
              {isShowingGenerated && selectedVariation?.imageUrl && (
                <div className="absolute bottom-4 right-4">
                  <Button
                    size="sm"
                    onClick={() => handleDuplicateVariation(selectedVariation.id)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Duplicate
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Tool Panel */}
          <div className="w-[360px] flex-shrink-0 border border-white/10 rounded-2xl bg-white/[0.02] flex flex-col overflow-hidden">
            {/* Iterations Tool */}
            {selectedTool === 'iterations' && (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold">Iterations</h2>
                    {variations.length > 0 && (
                      <div className="flex items-center gap-3">
                        {completedCount > 0 && (
                          <button
                            onClick={() => {
                              const count = getAllFileCount();
                              setDownloadModal({
                                isOpen: true,
                                title: 'Download All',
                                fileCount: count,
                                onConfirm: downloadAllGenerations,
                              });
                            }}
                            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
                          >
                            <FolderDown className="w-3.5 h-3.5" />
                            Download All
                          </button>
                        )}
                        <span className="text-sm text-white/40">
                          {completedCount}/{variations.length} generated
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Generate Iterations button - show when no variations yet */}
                  {variations.length === 0 && !isAnalyzingForIterations && (
                    <div className="mt-2">
                      <p className="text-sm text-white/50 mb-3">
                        Generate AI-powered variations of your ad for different contexts and styles.
                      </p>

                      {/* Number of generations */}
                      <div className="mb-3">
                        <label className="text-xs text-white/40 mb-1.5 block">Number of suggestions</label>
                        <div className="flex items-center gap-2">
                          {[3, 5, 8, 10].map((num) => (
                            <button
                              key={num}
                              onClick={() => setNumGenerations(num)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                numGenerations === num
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Context input */}
                      <div className="mb-3">
                        <label className="text-xs text-white/40 mb-1.5 block">
                          Optional: Add additional context to guide the suggestions
                        </label>
                        <Textarea
                          placeholder="Add context like 'Black Friday sale' or 'Target millennials'"
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[60px] resize-none text-sm"
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={handleGenerateIterations}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Generate suggestions
                      </Button>

                      {/* Custom iteration section */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        {!showCustomIteration ? (
                          <button
                            onClick={() => setShowCustomIteration(true)}
                            className="w-full px-3 py-2.5 rounded-lg border border-dashed border-white/20 text-white/50 hover:text-white/70 hover:border-white/30 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Custom iteration
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Describe the iteration you want to create..."
                              value={customIterationDescription}
                              onChange={(e) => setCustomIterationDescription(e.target.value)}
                              className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] resize-none text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAddCustomIteration}
                                disabled={!customIterationDescription.trim()}
                                size="sm"
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add iteration
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowCustomIteration(false);
                                  setCustomIterationDescription('');
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-white/50 hover:text-white hover:bg-white/10"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Loading state */}
                  {isAnalyzingForIterations && (
                    <div className="mt-4 text-center py-8">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-white/60">Analyzing your ad...</p>
                      <p className="text-xs text-white/40 mt-1">Generating variation ideas</p>
                    </div>
                  )}
                  {/* Create all button - show when variations exist but not all generated */}
                  {variations.length > 0 && generatingCount === 0 && variations.some(v => v.status === 'idle') && (
                    <Button
                      size="sm"
                      onClick={() => requireAuth(handleGenerateAll)}
                      className="w-full mt-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Create all
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Edit Tool - with resize presets */}
            {selectedTool === 'edit' && (
              <div className="p-4 flex flex-col h-full">
                {/* Current Size */}
                {uploadedImage && (
                  <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 uppercase tracking-wide">Current Size</span>
                      <span className="text-sm font-medium">{uploadedImage.width}×{uploadedImage.height}</span>
                    </div>
                    <div className="text-xs text-white/30 mt-1">{uploadedImage.aspectRatio}</div>
                  </div>
                )}

                {/* Resize Presets */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-2 text-white/70">Resize for Platforms</h3>
                  <div className="space-y-1.5">
                    {AD_SIZES.map((size) => {
                      const resized = originalResizedVersions.find(r => r.size === size.name);
                      const isResizing = resized?.status === 'resizing';
                      const isCompleted = resized?.status === 'completed';
                      return (
                        <button
                          key={size.name}
                          onClick={() => {
                            if (isCompleted) {
                              setViewingOriginalResizedSize(size.name);
                            } else if (!isResizing) {
                              requireAuth(() => handleResizeOriginal(size));
                            }
                          }}
                          disabled={isResizing}
                          className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between text-sm ${
                            isCompleted
                              ? 'bg-amber-600/10 border-amber-500/30 hover:bg-amber-600/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isResizing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />
                            ) : isCompleted ? (
                              <Check className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <div
                                className="bg-white/20 border border-white/30 rounded-[2px]"
                                style={{
                                  width: size.width >= size.height ? 14 : 14 * (size.width / size.height),
                                  height: size.height >= size.width ? 14 : 14 * (size.height / size.width),
                                }}
                              />
                            )}
                            <span className={isCompleted ? 'text-amber-300' : ''}>{size.label}</span>
                          </div>
                          <span className="text-white/40 text-xs">{size.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Export Tool */}
            {selectedTool === 'export' && (
              <div className="p-4">
                <h2 className="font-semibold mb-2">Export</h2>
                <p className="text-sm text-white/50 mb-4">
                  Download your images.
                </p>
                <div className="space-y-2">
                  {uploadedImage && (
                    <button
                      onClick={() => handleDownload(uploadedImage.url, uploadedImage.filename)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Download className="w-4 h-4 text-white/60" />
                      <div>
                        <div className="font-medium">Original Image</div>
                        <div className="text-xs text-white/40">{uploadedImage.filename}</div>
                      </div>
                    </button>
                  )}
                  {completedCount > 0 && (
                    <button
                      onClick={() => {
                        const count = getAllFileCount();
                        setDownloadModal({
                          isOpen: true,
                          title: 'Download All',
                          fileCount: count,
                          onConfirm: downloadAllGenerations,
                        });
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 transition-all text-left flex items-center gap-3"
                    >
                      <FolderDown className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-medium text-amber-300">Download All</div>
                        <div className="text-xs text-white/40">{completedCount} generated images</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* No tool selected */}
            {selectedTool === null && (
              <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
                <Info className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Select a tool from the sidebar to get started</p>
              </div>
            )}

            {/* Variation Cards - Only show for iterations tool */}
            {selectedTool === 'iterations' && variations.length > 0 && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Original Image Card - Always at top */}
                {uploadedImage && (
                <div
                  onClick={() => {
                    setSelectedVariationId(null);
                    setViewingResizedSize(null);
                  }}
                  className={`rounded-xl border transition-all cursor-pointer ${
                    selectedVariationId === null
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-20 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                        <img
                          src={uploadedImage.url}
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-sm text-emerald-400">Original</span>
                        </div>
                        <p className="text-xs text-white/50">
                          {uploadedImage.filename}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {uploadedImage.aspectRatio} • {uploadedImage.width}×{uploadedImage.height}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="text-xs text-white/30 uppercase tracking-wide">Suggested</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

              {variations.filter(v => !v.isArchived).map((variation) => (
                <div
                  key={variation.id}
                  onClick={() => variation.imageUrl && setSelectedVariationId(variation.id)}
                  className={`rounded-xl border transition-all ${
                    selectedVariationId === variation.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : variation.hasNewVersion
                      ? 'border-green-500/50 bg-green-500/5 hover:border-green-500'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } ${variation.imageUrl ? 'cursor-pointer' : ''}`}
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-20 rounded-lg bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                        {variation.status === 'generating' ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : variation.imageUrl ? (
                          <>
                            <img
                              src={variation.imageUrl}
                              alt={variation.title}
                              className="w-full h-full object-cover"
                            />
                            {/* Regenerating overlay */}
                            {variation.isRegenerating && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-white/20 text-xs text-center px-1">
                            Not generated
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{variation.title}</span>
                            {/* Version dots indicator */}
                            {variation.versions.length > 1 && (
                              <div className="flex items-center gap-1">
                                {variation.versions.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      idx === variation.currentVersionIndex
                                        ? 'bg-amber-500'
                                        : idx === variation.versions.length - 1 && variation.hasNewVersion
                                        ? 'bg-green-500 animate-pulse'
                                        : 'bg-white/30'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            {/* New version indicator */}
                            {variation.hasNewVersion && (
                              <span className="text-[10px] text-green-400 font-medium">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {variation.status === 'idle' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleEditing(variation.id);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit prompt</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        requireAuth(() => handleGenerateSingle(variation.id));
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Generate</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteVariation(variation.id);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete variation</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            {variation.status === 'completed' && !variation.isRegenerating && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveVariation(variation.id);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Archive</TooltipContent>
                                </Tooltip>
                                <span className="text-green-400">
                                  <Check className="w-4 h-4" />
                                </span>
                              </>
                            )}
                            {variation.isRegenerating && (
                              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                            )}
                          </div>
                        </div>

                        {variation.isEditing ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Textarea
                              value={variation.description}
                              onChange={(e) => handleUpdateDescription(variation.id, e.target.value)}
                              className="text-xs bg-white/5 border-white/10 text-white/80 min-h-[60px] resize-none"
                              rows={3}
                              autoFocus
                              onBlur={() => toggleEditing(variation.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') toggleEditing(variation.id);
                              }}
                            />
                          </div>
                        ) : (
                          <p
                            onClick={(e) => {
                              if (variation.status === 'idle') {
                                e.stopPropagation();
                                toggleEditing(variation.id);
                              }
                            }}
                            className={`text-xs text-white/50 line-clamp-3 ${variation.status === 'idle' ? 'cursor-text hover:text-white/70' : ''}`}
                          >
                            {variation.description}
                          </p>
                        )}

                        {/* Resize indicators and download for completed variations */}
                        {variation.status === 'completed' && (
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {variation.resizedVersions.length > 0 && (
                                <>
                                  <span className="text-[10px] text-white/30">Sizes:</span>
                                  {variation.resizedVersions
                                    .filter(r => r.status === 'completed')
                                    .map(r => (
                                      <span
                                        key={r.size}
                                        className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 border border-green-500/30"
                                      >
                                        {r.size}
                                      </span>
                                    ))}
                                  {variation.resizedVersions.some(r => r.status === 'resizing') && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-white/50 flex items-center gap-1">
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                      resizing...
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {getVariationFileCount(variation) > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const count = getVariationFileCount(variation);
                                  setDownloadModal({
                                    isOpen: true,
                                    title: `Download ${variation.title}`,
                                    fileCount: count,
                                    onConfirm: () => downloadVariationAll(variation),
                                  });
                                }}
                                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors"
                              >
                                <FolderDown className="w-3 h-3" />
                                All ({getVariationFileCount(variation)})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Suggest Another Iteration */}
              <button
                onClick={async () => {
                  if (!analysis || isSuggestingIteration) return;
                  setIsSuggestingIteration(true);
                  try {
                    const response = await fetch('/api/suggest-variations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        analysis,
                        aspectRatio: uploadedImage?.aspectRatio,
                        additionalContext: `Already suggested: ${variations.map(v => v.title).join(', ')}. Suggest something different.`,
                      }),
                    });
                    if (response.ok) {
                      const data = await response.json();
                      if (data.variations && data.variations.length > 0) {
                        const newVariation: Variation = {
                          id: uuidv4(),
                          title: data.variations[0].title,
                          description: data.variations[0].description,
                          imageUrl: null,
                          status: 'idle',
                          isEditing: false,
                          editPrompt: '',
                          isEditingGenerated: false,
                          resizedVersions: [],
                          versions: [],
                          currentVersionIndex: 0,
                          isRegenerating: false,
                          hasNewVersion: false,
                          isArchived: false,
                        };
                        setVariations(prev => [...prev, newVariation]);
                      }
                    }
                  } catch (err) {
                    console.error('Failed to suggest iteration:', err);
                  } finally {
                    setIsSuggestingIteration(false);
                  }
                }}
                disabled={isSuggestingIteration}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-white/50 hover:text-amber-400 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSuggestingIteration ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isSuggestingIteration ? 'Suggesting...' : 'Suggest another iteration'}
              </button>

              {/* Add Custom Variation */}
              <div className="rounded-xl border border-dashed border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm font-medium text-white/60">Add custom iteration</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleGeneratePrompt}
                      disabled={isGeneratingPrompt || !analysis}
                      className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPrompt ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      Suggest
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weirdnessLevel}
                      onChange={(e) => setWeirdnessLevel(parseInt(e.target.value))}
                      className="w-14 weirdness-slider"
                    />
                    <span className={`text-[10px] ${getWeirdnessLabel(weirdnessLevel).color}`}>
                      {getWeirdnessLabel(weirdnessLevel).label}
                    </span>
                  </div>
                </div>

                <Textarea
                  placeholder="Describe your variation... (e.g., 'coffee shop setting' or 'sunset lighting')"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="text-sm bg-white/5 border-white/10 text-white/80 min-h-[60px] resize-none mb-2"
                  rows={2}
                />

                <Button
                  size="sm"
                  onClick={handleAddCustomVariation}
                  disabled={!customPrompt.trim()}
                  className="w-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:text-white/40"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Iteration
                </Button>
              </div>

              {/* Archived Section */}
              {variations.filter(v => v.isArchived).length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Archive className="w-4 h-4" />
                      <span>Archived ({variations.filter(v => v.isArchived).length})</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                  </button>

                  {showArchived && (
                    <div className="mt-2 space-y-2">
                      {variations.filter(v => v.isArchived).map((variation) => (
                        <div
                          key={variation.id}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-12 h-14 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                              {variation.imageUrl && (
                                <img
                                  src={variation.imageUrl}
                                  alt={variation.title}
                                  className="w-full h-full object-cover opacity-60"
                                />
                              )}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-white/50 truncate">{variation.title}</h4>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleRestoreVariation(variation.id)}
                                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                      <ArchiveRestore className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Restore</TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-xs text-white/30 line-clamp-2 mt-0.5">{variation.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Footer - Show for iterations tool */}
            {selectedTool === 'iterations' && user && completedCount > 0 && (
              <div className="p-4 border-t border-white/10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveToHistory}
                  className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                >
                  Save to History
                </Button>
              </div>
            )}

            {selectedTool === 'iterations' && !user && completedCount > 0 && (
              <div className="p-4 border-t border-white/10">
                <div className="text-center text-sm text-white/40 mb-2">
                  Sign in to save your generations
                </div>
                <SignInButton mode="modal">
                  <Button
                    size="sm"
                    className="w-full bg-white text-black hover:bg-white/90"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign in
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Sign Up Prompt Modal */}
      <Dialog open={showSignUpPrompt} onOpenChange={setShowSignUpPrompt}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign up to continue</DialogTitle>
            <DialogDescription>
              Create an account to create iterations, edit images, and save your work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSignUpPrompt(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <SignInButton mode="modal">
              <Button className="flex-1">
                <LogIn className="w-4 h-4" />
                Sign up
              </Button>
            </SignInButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showPlanSelection}
        onClose={() => {
          setShowPlanSelection(false);
          setPendingAction(null);
        }}
      />

      {/* Download Confirmation Modal */}
      <Dialog open={!!downloadModal} onOpenChange={(open) => !open && setDownloadModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{downloadModal?.title}</DialogTitle>
            <DialogDescription>
              This will download <span className="text-foreground font-medium">{downloadModal?.fileCount} files</span> to your device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setDownloadModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadModal?.onConfirm();
                setDownloadModal(null);
              }}
              className="flex-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
