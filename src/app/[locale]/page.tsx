'use client';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Sparkles,
  Loader2,
  Download,
  Plus,
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
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Info,
  Layers,
  Sun,
  Moon,
  Heart,
  Palette,
  Camera,
  Droplets,
  Clock,
  Aperture,
  User,
  Move,
  Scan,
  Key,
  RotateCw,
  Scaling,
  Ratio,
  ScanLine,
  Expand,
  Menu,
  PanelLeft,
  SlidersHorizontal,
  Settings,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Keyboard,
  SplitSquareHorizontal,
  ImagePlus,
  UserPlus,
  Eraser,
  Paperclip,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
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
import { Footer } from '@/components/landing/Footer';
import { ApiKeySetupModal, WelcomeModal, ResumeSessionModal } from '@/components/onboarding';
import { getStoredApiKey, setStoredApiKey, hasStoredApiKey, getStoredOpenAIKey, setStoredOpenAIKey, hasStoredOpenAIKey, getStoredDashScopeKey, setStoredDashScopeKey, hasStoredDashScopeKey } from '@/lib/api-key-storage';
import { useSessionPersistence, type SessionState } from '@/hooks/useSessionPersistence';
import { HardDrive } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { routing, useRouter as useIntlRouter, usePathname as useIntlPathname, type Locale } from '@/i18n/routing';
import { track } from '@/lib/analytics';
import { removeImageBackground, type ProgressState as BgRemovalProgress } from '@/lib/background-removal';
import { AsciiGrid } from '@/components/ui/AsciiGrid';
import { UploadIcon, type UploadHandle } from '@/components/UploadIcon';

// Greyscale Google Gemini logo for model selector
const GeminiLogoGrey = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" style={{ opacity: 0.35 }}>
    <path
      d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z"
      fill="currentColor"
    />
  </svg>
);

// OpenAI logo for model selector
const OpenAILogoGrey = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

// Qwen logo for model selector (Alibaba Cloud)
const QwenLogoGrey = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
    <path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z"/>
  </svg>
);

type Step = 'upload' | 'editor';
type Tool = 'edit' | 'iterations' | 'backgrounds' | 'model' | 'export' | null;

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
  imageDescription?: string;
  backgroundDescription?: string;
  subjectDescription?: string | null;
}

// Common ad sizes for resizing
const AD_SIZES = [
  { name: '1:1', width: 1080, height: 1080, label: 'Square' },
  { name: '9:16', width: 1080, height: 1920, label: 'Story' },
  { name: '16:9', width: 1920, height: 1080, label: 'Landscape' },
  { name: '4:5', width: 1080, height: 1350, label: 'Portrait' },
  { name: '2:3', width: 1080, height: 1620, label: 'Pinterest' },
] as const;

// Language display names for the language selector
const LANGUAGES: Record<Locale, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'Français', flag: '🇫🇷' },
  ja: { name: '日本語', flag: '🇯🇵' },
  zh: { name: '中文', flag: '🇨🇳' },
  ko: { name: '한국어', flag: '🇰🇷' },
  pt: { name: 'Português', flag: '🇧🇷' },
};

interface ResizedVersion {
  size: string;
  imageUrl: string | null;
  status: 'idle' | 'resizing' | 'completed' | 'error';
}

interface ImageVersion {
  imageUrl: string | null; // null when processing
  prompt: string | null; // The edit prompt used to create this version (null for original/first generation)
  parentIndex: number; // Index of the version this was edited from (-1 for original)
  status: 'processing' | 'completed' | 'error'; // Track processing state for concurrent edits
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

// A base version is a starting point for edits - the original or a "New Version" snapshot
interface BaseVersion {
  id: string;
  name: string;
  baseImageUrl: string; // The base image URL for this version
  sourceLabel: string; // Description of where this came from (e.g., "From: Soft Lighting edit")
  versions: ImageVersion[]; // Edit history for this base
  currentVersionIndex: number; // Which edit is currently shown
  resizedVersions: ResizedVersion[]; // Resized versions for this base
}

// Reference image for Background/Model tools
interface ReferenceImage {
  id: string;
  url: string;        // data URL for display
  base64: string;     // for API calls
  mimeType: string;
  name: string;
  type: 'background' | 'model' | 'edit';
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const { theme, setTheme } = useTheme();
  const locale = useLocale() as Locale;

  // Translations
  const t = useTranslations();

  const [step, setStep] = useState<Step>('editor');
  const [selectedTool, setSelectedTool] = useState<Tool>('edit');
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
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNewConfirmModal, setShowNewConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Session persistence state
  const [showResumeSessionModal, setShowResumeSessionModal] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState<{
    thumbnailUrl: string | null;
    savedAt: number;
    size: number;
  } | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSuggestingIteration, setIsSuggestingIteration] = useState(false);
  const [isAnalyzingForIterations, setIsAnalyzingForIterations] = useState(false);
  const [numGenerations, setNumGenerations] = useState(5);
  const [showCustomIteration, setShowCustomIteration] = useState(false);
  const [customIterationDescription, setCustomIterationDescription] = useState('');

  // API key state - loaded from localStorage
  const [apiKey, setApiKeyState] = useState<string | null>(null);  // Gemini key (legacy name kept for compatibility)
  const [openaiApiKey, setOpenaiApiKeyState] = useState<string | null>(null);
  const [dashscopeApiKey, setDashscopeApiKeyState] = useState<string | null>(null);
  const [isApiKeyLoaded, setIsApiKeyLoaded] = useState(false);
  const [apiKeyModalTab, setApiKeyModalTab] = useState<'gemini' | 'openai'>('gemini');

  // User can access editor if they have any API key
  const canAccessEditor = !!apiKey || !!openaiApiKey || !!dashscopeApiKey;
  const [showArchived, setShowArchived] = useState(false);
  const [showCustomVariationInput, setShowCustomVariationInput] = useState(false);

  // Comparison mode state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareLeftIndex, setCompareLeftIndex] = useState<number | null>(null);  // Locked reference (LEFT side)
  const [compareRightIndex, setCompareRightIndex] = useState<number | null>(null); // Toggleable comparison (RIGHT side)
  const [isUIHidden, setIsUIHidden] = useState(false);  // Hide all overlay UI

  // Original image editing state
  const [originalEditPrompt, setOriginalEditPrompt] = useState('');
  // isEditingOriginal removed - now tracking per-version with status field

  // Base versions - each is a starting point for edits (Original + any "New Version" snapshots)
  const [baseVersions, setBaseVersions] = useState<BaseVersion[]>([]);
  const [activeBaseId, setActiveBaseId] = useState<string>('original');

  // Computed: get current base version's data
  const activeBase = baseVersions.find(b => b.id === activeBaseId) || baseVersions[0];
  const originalVersions = activeBase?.versions || [];
  const originalVersionIndex = activeBase?.currentVersionIndex || 0;
  const originalResizedVersions = activeBase?.resizedVersions || [];

  // Helper to update the active base's versions
  const setOriginalVersions = (updater: ImageVersion[] | ((prev: ImageVersion[]) => ImageVersion[])) => {
    setBaseVersions(prev => prev.map(base => {
      if (base.id !== activeBaseId) return base;
      const newVersions = typeof updater === 'function' ? updater(base.versions) : updater;
      return { ...base, versions: newVersions };
    }));
  };

  // Helper to update the active base's current version index
  const setOriginalVersionIndex = (updater: number | ((prev: number) => number)) => {
    setBaseVersions(prev => prev.map(base => {
      if (base.id !== activeBaseId) return base;
      const newIndex = typeof updater === 'function' ? updater(base.currentVersionIndex) : updater;
      return { ...base, currentVersionIndex: newIndex };
    }));
  };

  // Helper to update the active base's resized versions
  const setOriginalResizedVersions = (updater: ResizedVersion[] | ((prev: ResizedVersion[]) => ResizedVersion[])) => {
    setBaseVersions(prev => prev.map(base => {
      if (base.id !== activeBaseId) return base;
      const newResized = typeof updater === 'function' ? updater(base.resizedVersions) : updater;
      return { ...base, resizedVersions: newResized };
    }));
  };

  // Backgrounds tool state
  const [backgroundSuggestions, setBackgroundSuggestions] = useState<{id: string, name: string, prompt: string}[]>([]);
  const [isLoadingBackgroundSuggestions, setIsLoadingBackgroundSuggestions] = useState(false);
  const [backgroundCustomPrompt, setBackgroundCustomPrompt] = useState('');

  // Model tool state
  const [modelSuggestions, setModelSuggestions] = useState<{id: string, name: string, description: string, prompt: string}[]>([]);
  const [isLoadingModelSuggestions, setIsLoadingModelSuggestions] = useState(false);
  const [modelCustomPrompt, setModelCustomPrompt] = useState('');
  const [keepClothing, setKeepClothing] = useState(true);
  // Model builder selections
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);
  const [selectedEthnicity, setSelectedEthnicity] = useState<string | null>(null);
  const [selectedHairColor, setSelectedHairColor] = useState<string | null>(null);
  const [selectedHairType, setSelectedHairType] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [selectedExpression, setSelectedExpression] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  // Track used suggestions - to show visual indicator
  const [activeBackgroundId, setActiveBackgroundId] = useState<string | null>(null);
  const [backgroundUseCounts, setBackgroundUseCounts] = useState<Record<string, number>>({});
  const [usedModelSuggestions, setUsedModelSuggestions] = useState<Set<string>>(new Set());

  // Background removal state
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState<BgRemovalProgress | null>(null);

  // Reference images state (session-based)
  const [backgroundReferences, setBackgroundReferences] = useState<ReferenceImage[]>([]);
  const [modelReferences, setModelReferences] = useState<ReferenceImage[]>([]);
  const [editReferences, setEditReferences] = useState<ReferenceImage[]>([]);
  const [selectedBackgroundRef, setSelectedBackgroundRef] = useState<string | null>(null);
  const [selectedModelRef, setSelectedModelRef] = useState<string | null>(null);
  const [selectedEditRef, setSelectedEditRef] = useState<string | null>(null);

  // AI Model selection - supports Gemini, OpenAI, and Alibaba (Wanxiang) providers
  type AIModel = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image' | 'gpt-image-1' | 'wan2.6-image';
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel>('gemini-3-pro-image-preview');

  // Compare Models mode - run same edit on multiple models simultaneously
  const [isCompareModelsEnabled, setIsCompareModelsEnabled] = useState(false);
  const [selectedModelsForCompare, setSelectedModelsForCompare] = useState<AIModel[]>([]);

  // Image quality setting - affects output resolution and cost
  type ImageQuality = 'low' | 'medium' | 'high';
  const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');
  const [showQualitySettings, setShowQualitySettings] = useState(false);

  // Helper to determine which provider a model belongs to
  const isOpenAIModel = (model: AIModel) => model === 'gpt-image-1';
  const isGeminiModel = (model: AIModel) => model === 'gemini-3-pro-image-preview' || model === 'gemini-2.5-flash-image';
  const isWanModel = (model: AIModel) => model === 'wan2.6-image';

  // Compare mode helpers
  const toggleModelForCompare = (model: AIModel) => {
    setSelectedModelsForCompare(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  const hasApiKeyForModel = (model: AIModel): boolean => {
    if (isGeminiModel(model)) return !!apiKey;
    if (isOpenAIModel(model)) return !!openaiApiKey;
    if (isWanModel(model)) return !!dashscopeApiKey;
    return false;
  };

  const getApiKeysForModel = (model: AIModel) => ({
    apiKey: isGeminiModel(model) ? apiKey : undefined,
    openaiApiKey: isOpenAIModel(model) ? openaiApiKey : undefined,
    dashscopeApiKey: isWanModel(model) ? dashscopeApiKey : undefined,
  });

  // Remove models from compare selection if their API key is removed
  useEffect(() => {
    setSelectedModelsForCompare(prev =>
      prev.filter(model => hasApiKeyForModel(model))
    );
  }, [apiKey, openaiApiKey, dashscopeApiKey]);

  // Get quality display label
  const getQualityLabel = (quality: ImageQuality): string => {
    switch (quality) {
      case 'low': return t('quality.draft');
      case 'medium': return t('quality.standard');
      case 'high': return t('quality.best');
    }
  };

  // Quality indicator icon (signal bars style)
  const QualityIcon = ({ quality, className = '' }: { quality: ImageQuality; className?: string }) => (
    <svg className={`w-3.5 h-3.5 ${className}`} viewBox="0 3 16 12" fill="currentColor">
      <rect x="1" y="11" width="3" height="4" rx="0.5" opacity={quality === 'low' || quality === 'medium' || quality === 'high' ? 1 : 0.3} />
      <rect x="6" y="7" width="3" height="8" rx="0.5" opacity={quality === 'medium' || quality === 'high' ? 1 : 0.3} />
      <rect x="11" y="3" width="3" height="12" rx="0.5" opacity={quality === 'high' ? 1 : 0.3} />
    </svg>
  );

  // Calculate output dimensions based on quality and aspect ratio
  const getOutputDimensions = (quality: ImageQuality, aspectRatio: string) => {
    // Base size for the longest edge
    const baseSize = {
      low: 512,
      medium: 1024,
      high: 1536,
    }[quality];

    // Parse aspect ratio
    const ratioMap: Record<string, [number, number]> = {
      '1:1': [1, 1],
      '16:9': [16, 9],
      '9:16': [9, 16],
      '4:5': [4, 5],
      '2:3': [2, 3],
    };

    const [w, h] = ratioMap[aspectRatio] || [1, 1];
    const maxDim = Math.max(w, h);
    const scale = baseSize / maxDim;

    return {
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    };
  };

  // File input refs for reference uploads
  const backgroundRefInputRef = useRef<HTMLInputElement>(null);
  const modelRefInputRef = useRef<HTMLInputElement>(null);
  const editRefInputRef = useRef<HTMLInputElement>(null);

  // Animated upload icon ref
  const uploadIconRef = useRef<UploadHandle>(null);

  // Session persistence hook
  const {
    scheduleSave,
    saveNow,
    clearSessionData,
    restoreSession,
    checkForExistingSession,
    isSaving: isSessionSaving,
    sessionSizeFormatted,
    hasExistingSession,
    isSessionLarge,
    isSessionVeryLarge,
  } = useSessionPersistence();

  // Touch swipe state for image navigation
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Zoom state for image preview
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Presets state
  const [selectedPresets, setSelectedPresets] = useState<{
    lighting: string | null;
    style: string | null;
    mood: string | null;
    color: string | null;
    era: string | null;
    camera: string | null;
    framing: string | null;
    rotation: string | null;
    enhance: string | null;
  }>({ lighting: null, style: null, mood: null, color: null, era: null, camera: null, framing: null, rotation: null, enhance: null });
  const [expandedPresetCategory, setExpandedPresetCategory] = useState<string | null>(null);
  const [isModelBuilderExpanded, setIsModelBuilderExpanded] = useState(false);
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [showBackgroundDetails, setShowBackgroundDetails] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [isImageDescExpanded, setIsImageDescExpanded] = useState(false);
  // isApplyingPreset removed - now tracking per-version with status field

  // Presets data - prompts optimized for AI image editing
  const PRESETS = {
    lighting: [
      { id: 'golden-hour', name: 'Golden Hour', prompt: 'Transform the lighting to golden hour: warm color temperature around 3000K, soft amber and orange tones, long directional shadows, sun low on the horizon creating a warm magical glow on the subject, maintain all other elements exactly as they are' },
      { id: 'studio', name: 'Studio', prompt: 'Transform the lighting to professional studio setup: three-point lighting with key light, fill light, and rim light, soft shadows, neutral 5500K color temperature, even illumination across the subject, clean commercial photography look, maintain all other elements exactly as they are' },
      { id: 'natural', name: 'Natural', prompt: 'Transform the lighting to natural window light: soft diffused daylight at 5500-6500K color temperature, gentle shadows, as if photographed near a large north-facing window, airy and fresh feeling, maintain all other elements exactly as they are' },
      { id: 'dramatic', name: 'Dramatic', prompt: 'Transform the lighting to dramatic Rembrandt style: strong directional single light source, high contrast ratio, deep rich shadows, chiaroscuro effect, moody and intense atmosphere, cinematic shadow play, maintain all other elements exactly as they are' },
      { id: 'backlit', name: 'Backlit', prompt: 'Transform the lighting to backlit/rim lit: strong light source behind the subject creating glowing edges and rim highlights, subtle lens flare, subject slightly silhouetted with luminous outline, ethereal halo effect, maintain all other elements exactly as they are' },
      { id: 'soft-box', name: 'Soft Box', prompt: 'Transform the lighting to large soft box beauty lighting: very soft wrap-around illumination, minimal shadows, even skin tones, high-end advertising photography look, flattering diffused light from large source, maintain all other elements exactly as they are' },
    ],
    style: [
      { id: 'photorealistic', name: 'Photorealistic', prompt: 'Enhance to ultra photorealistic quality: sharp fine details, realistic material textures, natural micro-imperfections, proper specular highlights, accurate light falloff, shot on high-end full-frame camera, maintain all subjects and composition exactly as they are' },
      { id: 'cinematic', name: 'Cinematic', prompt: 'Apply cinematic film look: teal and orange color grading, lifted blacks, slightly desaturated midtones, anamorphic lens characteristics, subtle film grain, 2.39:1 widescreen atmosphere, Hollywood movie color science, maintain all subjects and composition exactly as they are' },
      { id: 'editorial', name: 'Editorial', prompt: 'Apply high-end editorial magazine style: polished and refined, perfect color balance, sophisticated color palette, Vogue/Harper\'s Bazaar aesthetic, crisp professional retouching, fashion-forward look, maintain all subjects and composition exactly as they are' },
      { id: 'film-grain', name: 'Film Grain', prompt: 'Apply analog 35mm film aesthetic: visible film grain texture like Kodak Portra 400, slightly lifted blacks, gentle color fade, subtle halation on highlights, nostalgic vintage film photography look, maintain all subjects and composition exactly as they are' },
      { id: 'minimalist', name: 'Minimalist', prompt: 'Apply minimalist aesthetic: simplify and clean the background, increase negative space, reduce visual clutter, focus attention on the main subject, clean lines, Scandinavian design sensibility, maintain the main subject exactly as it is' },
      { id: 'hdr', name: 'HDR', prompt: 'Apply HDR tone mapping effect: enhanced dynamic range, recovered shadow details, controlled highlights, slightly boosted saturation, visible detail in all tonal ranges, punchy vibrant look, maintain all subjects and composition exactly as they are' },
    ],
    mood: [
      { id: 'cinematic-moody', name: 'Cinematic Moody', prompt: 'Apply cinematic moody aesthetic: deep shadows with crushed blacks, desaturated midtones, high contrast ratio, dramatic shadow play, intense emotional atmosphere, film-like color grading with teal shadows and warm highlights, maintain all subjects exactly as they are' },
      { id: 'hyper-realistic', name: 'Hyper-Realistic', prompt: 'Enhance to hyper-realistic quality: maximum clarity and sharpness, meticulous fine details visible, subtle interplay of light and shadow, ultra high-resolution appearance, lifelike textures and materials, cinematic lighting precision, maintain all subjects exactly as they are' },
      { id: 'light-dreamy', name: 'Light & Dreamy', prompt: 'Apply light and dreamy aesthetic: soft diffused glow, slightly overexposed highlights, gentle pastel color shift, ethereal and airy atmosphere, romantic soft-focus quality, lifted shadows with creamy tones, maintain all subjects exactly as they are' },
      { id: 'high-contrast', name: 'High Contrast', prompt: 'Apply bold high contrast look: strong tonal differences between lights and darks, punchy blacks and bright whites, dramatic visual impact, attention-grabbing intensity, fashion/advertising style contrast, maintain all subjects exactly as they are' },
      { id: 'soft-natural', name: 'Soft & Natural', prompt: 'Apply authentic natural editing: true-to-life colors, minimal processing appearance, honest and relatable aesthetic, subtle enhancement only, real skin textures preserved, timeless and genuine feel, maintain all subjects exactly as they are' },
      { id: 'dark-dramatic', name: 'Dark & Dramatic', prompt: 'Apply dark dramatic mood: low-key lighting effect, rich deep shadows, mysterious atmosphere, luxurious and sophisticated feel, moody intensity with controlled highlights, high-end dark aesthetic, maintain all subjects exactly as they are' },
    ],
    color: [
      { id: 'warm-cozy', name: 'Warm & Cozy', prompt: 'Apply warm cozy color grading: amber and orange tones throughout, increased color temperature to 4000K warmth, brown and earth tone enhancement, inviting and comfortable atmosphere, autumn/hygge feeling, maintain all subjects exactly as they are' },
      { id: 'cool-modern', name: 'Cool & Modern', prompt: 'Apply cool modern color grading: blue and teal color shift, decreased color temperature for crisp cool tones, contemporary sleek feeling, tech-forward aesthetic, clean and professional coolness, maintain all subjects exactly as they are' },
      { id: 'vibrant-bold', name: 'Vibrant & Bold', prompt: 'Apply vibrant bold colors: highly saturated punchy tones, increased vibrancy across all colors, energetic and exciting color palette, attention-grabbing saturation, maintain all subjects exactly as they are' },
      { id: 'muted-soft', name: 'Muted & Soft', prompt: 'Apply muted soft color palette: desaturated gentle tones, soft pastel color shift, understated elegance, luxury brand aesthetic, calm and sophisticated feel, reduced color intensity, maintain all subjects exactly as they are' },
      { id: 'dark-luxurious', name: 'Dark & Luxurious', prompt: 'Apply dark luxurious color grading: deep rich shadows, jewel tone colors, sophisticated dark palette, premium high-end feel, moody luxury aesthetic with controlled saturation, maintain all subjects exactly as they are' },
      { id: 'bright-airy', name: 'Bright & Airy', prompt: 'Apply bright airy aesthetic: lifted exposure, light and fresh feeling, soft whites, clean bright tones, open and spacious atmosphere, instagram-style light aesthetic, maintain all subjects exactly as they are' },
    ],
    era: [
      { id: 'film-analog', name: 'Film Analog', prompt: 'Apply authentic film analog look: visible organic film grain, Kodak Portra or Fuji color science, slightly lifted blacks, soft highlight rolloff, gentle color fade, true analog photography aesthetic, maintain all subjects exactly as they are' },
      { id: '70s-retro', name: '70s Retro', prompt: 'Apply 1970s retro aesthetic: warm earth tones, orange and brown color cast, soft vintage focus, faded shadows, nostalgic warmth, analog film characteristics of the era, groovy vintage feeling, maintain all subjects exactly as they are' },
      { id: '90s-faded', name: '90s Faded', prompt: 'Apply 1990s faded aesthetic: slightly desaturated colors, authentic grunge-era tones, subtle green/yellow color cast, matte finish, indie film look, VHS-influenced color palette, raw and authentic feel, maintain all subjects exactly as they are' },
      { id: 'y2k-glossy', name: 'Y2K Glossy', prompt: 'Apply Y2K glossy aesthetic: high shine and gloss effect, pink and blue color tints, futuristic retro feeling, playful early 2000s vibe, slight overexposure, Gen-Z nostalgia aesthetic, maintain all subjects exactly as they are' },
      { id: 'vintage-sepia', name: 'Vintage Sepia', prompt: 'Apply vintage sepia toning: classic brown/amber monochromatic tint, antique photograph feeling, timeless nostalgic warmth, aged photo aesthetic, historical photography look, elegant vintage finish, maintain all subjects exactly as they are' },
      { id: 'modern-clean', name: 'Modern Clean', prompt: 'Apply modern clean aesthetic: true-to-color accuracy, crisp and contemporary, neutral color balance, timeless professional look, minimal color grading, honest representation with subtle polish, maintain all subjects exactly as they are' },
    ],
    camera: [
      { id: 'hasselblad', name: 'Hasselblad X2D', prompt: 'Apply Hasselblad medium format camera look: exceptional detail and resolution, medium format sensor rendering, smooth tonal transitions, Hasselblad Natural Color Solution color science, ultra-fine detail in highlights and shadows, studio-quality commercial photography aesthetic, maintain all subjects exactly as they are' },
      { id: 'canon-r5', name: 'Canon EOS R5', prompt: 'Apply Canon EOS R5 camera look: Canon color science with warm pleasing skin tones, excellent dynamic range, vibrant but natural colors, professional full-frame rendering, flagship Canon image quality, maintain all subjects exactly as they are' },
      { id: 'sony-a7rv', name: 'Sony a7R V', prompt: 'Apply Sony a7R V camera look: ultra high resolution detail, Sony color science with accurate true-to-life colors, exceptional sharpness and clarity, professional mirrorless quality, precise highlight and shadow detail, maintain all subjects exactly as they are' },
      { id: 'nikon-z8', name: 'Nikon Z8', prompt: 'Apply Nikon Z8 camera look: Nikon color science with rich natural tones, excellent skin tone rendering, professional-grade image quality, balanced contrast, versatile all-rounder aesthetic, maintain all subjects exactly as they are' },
      { id: 'film-35mm', name: '35mm Film Camera', prompt: 'Apply vintage 35mm film camera look: authentic analog film grain, classic SLR camera rendering, Kodak or Fuji film emulation, mechanical camera aesthetic, nostalgic film photography look with natural imperfections, soft organic detail, maintain all subjects exactly as they are' },
      { id: 'polaroid', name: 'Polaroid Instant', prompt: 'Apply Polaroid instant camera look: characteristic Polaroid color cast, slightly faded and washed out tones, soft dreamy focus, instant film texture, vintage instant photography aesthetic, white border framing feel, nostalgic lo-fi charm, maintain all subjects exactly as they are' },
      { id: 'ring-camera', name: 'Ring Camera', prompt: 'Apply Ring doorbell camera look: pronounced fisheye barrel distortion with curved edges, warm amber/orange color cast especially in daylight, HDR-style processing with boosted shadows, slightly soft compressed video quality, high vantage point perspective looking downward, wide field of view capturing full scene, doorbell camera surveillance aesthetic, do not add any text or logos or watermarks, maintain all subjects exactly as they are' },
    ],
    framing: [
      { id: 'closeup', name: 'Close-Up', prompt: 'Apply close-up shot framing: subject\'s face or key product feature fills most of the frame, typically from shoulders/top up for people, emphasizes facial expressions or product details, intimate connection with viewer, maintain the subject exactly as it is' },
      { id: 'medium-shot', name: 'Medium Shot', prompt: 'Apply medium shot framing: subject framed from waist up, shows upper body and hand gestures, balance between subject and environment, conversational and natural framing, maintain the subject exactly as it is' },
      { id: 'wide-shot', name: 'Wide Shot', prompt: 'Apply wide shot framing: full body of subject visible with significant environment around them, establishes the subject within their space, shows complete figure and surroundings, lifestyle photography style, maintain the subject exactly as it is' },
      { id: 'high-angle', name: 'High Angle', prompt: 'Render this scene from a higher camera angle looking down at 30-45 degrees. CRITICAL: The subject does NOT crouch, kneel, or change their pose. They stay standing/sitting exactly as they were. Only the camera moves higher. The subject appears smaller because the CAMERA moved up, not because they crouched down. Same pose, same position, only the viewpoint changes.' },
      { id: 'low-angle', name: 'Low Angle', prompt: 'Render this scene from a lower camera angle looking up at 30-45 degrees. CRITICAL: The subject does NOT stand on something or change their pose. They stay exactly as they were. Only the camera moves lower. The subject appears more powerful/dominant because the CAMERA moved down, not because they stood taller. Same pose, same position, only the viewpoint changes.' },
      { id: 'birds-eye-view', name: "Bird's-Eye View", prompt: 'Render this scene from directly above looking down. CRITICAL: The subject does NOT lay down. The subject does NOT change their pose. They stay standing/sitting exactly as they were. Only the camera moves above them. We see the top of their head and shoulders from above because the CAMERA moved up, not because the subject laid down. Same pose, same position, only the viewpoint changes.' },
    ],
    rotation: [
      { id: 'orbit-front', name: 'Orbit Front', prompt: 'Render the ENTIRE scene from a different camera angle - position the virtual camera directly in front of the subject, facing them head-on. The floor, mats, props, furniture, and background must ALL be viewed from this new frontal angle. POSE PRESERVATION: Every limb stays in the EXACT same position - same arm angles, same hand placement, same finger positions, same leg positions, same foot placement. The subject is like a 3D statue being viewed from the front. Head does NOT turn, gaze does NOT change. IMPORTANT: Same facial features, expression, identity. Any text must not be changed.' },
      { id: 'orbit-right', name: 'Orbit Right', prompt: 'Render the ENTIRE scene from a different camera angle - position the virtual camera to the subject\'s right side. The floor, mats, props, furniture, and background must ALL be viewed from this new angle. POSE PRESERVATION: Every limb stays in the EXACT same position - same arm angles, same hand placement, same finger positions, same leg positions, same foot placement. The subject is like a 3D statue being viewed from a different angle. Head does NOT turn, gaze does NOT change. IMPORTANT: Same facial features, expression, identity. Any text must not be changed.' },
      { id: 'orbit-left', name: 'Orbit Left', prompt: 'Render the ENTIRE scene from a different camera angle - position the virtual camera to the subject\'s left side. The floor, mats, props, furniture, and background must ALL be viewed from this new angle. POSE PRESERVATION: Every limb stays in the EXACT same position - same arm angles, same hand placement, same finger positions, same leg positions, same foot placement. The subject is like a 3D statue being viewed from a different angle. Head does NOT turn, gaze does NOT change. IMPORTANT: Same facial features, expression, identity. Any text must not be changed.' },
      { id: 'orbit-behind', name: 'Orbit Behind', prompt: 'Render the ENTIRE scene from a different camera angle - position the virtual camera behind the subject. The floor, mats, props, furniture, and background must ALL be viewed from this new angle. POSE PRESERVATION: Every limb stays in the EXACT same position - same arm angles, same hand placement, same finger positions, same leg positions, same foot placement. The subject is like a 3D statue being viewed from behind. Head does NOT turn. IMPORTANT: Any text must not be changed.' },
      { id: 'orbit-45-right', name: 'Orbit 45° Right', prompt: 'Render the ENTIRE scene from a different camera angle - position the virtual camera 45 degrees to the subject\'s right. The floor, mats, props, furniture, and background must ALL be viewed from this new angle. POSE PRESERVATION: Every limb stays in the EXACT same position - same arm angles, same hand placement, same finger positions, same leg positions, same foot placement. The subject is like a 3D statue being viewed from a slight angle. Head does NOT turn, gaze does NOT change. IMPORTANT: Same facial features, expression, identity. Any text must not be changed.' },
      { id: 'orbit-45-left', name: 'Orbit 45° Left', prompt: 'Render the ENTIRE scene from a different camera angle - position the virtual camera 45 degrees to the subject\'s left. The floor, mats, props, furniture, and background must ALL be viewed from this new angle. POSE PRESERVATION: Every limb stays in the EXACT same position - same arm angles, same hand placement, same finger positions, same leg positions, same foot placement. The subject is like a 3D statue being viewed from a slight angle. Head does NOT turn, gaze does NOT change. IMPORTANT: Same facial features, expression, identity. Any text must not be changed.' },
    ],
    enhance: [
      // AI Upscaling
      { id: 'upscale-2x', name: 'Upscale 2x', prompt: 'AI UPSCALING: Increase the image resolution by 2x while intelligently adding fine details. Enhance sharpness, recover lost detail, reduce any pixelation or blockiness. Fill in missing high-frequency information naturally. The upscaled image should look like it was originally captured at higher resolution - crisp edges, clear textures, no blur or artifacts. Maintain exact composition, colors, and content.' },
      { id: 'upscale-4x', name: 'Upscale 4x', prompt: 'AI UPSCALING: Increase the image resolution by 4x with maximum detail enhancement. Intelligently synthesize fine details, textures, and sharp edges. Remove all pixelation, blockiness, and compression artifacts. Generate realistic high-frequency detail for faces, hair, fabric textures, and surfaces. The result should be print-ready quality - as if captured with a much higher resolution camera. Maintain exact composition, colors, and content.' },
      // One-click enhancement
      { id: 'auto-enhance', name: 'Auto Enhance', prompt: 'AUTOMATIC ENHANCEMENT: Apply intelligent all-in-one photo improvement. Optimize exposure and contrast, correct white balance, boost colors naturally, sharpen details, reduce noise in shadows, enhance dynamic range. Professional-grade automatic correction like Lightroom Auto but better. Make the image look its absolute best while maintaining natural appearance. No artistic changes - just technical perfection.' },
      { id: 'face-enhance', name: 'Face Enhance', prompt: 'AI PORTRAIT ENHANCEMENT: Specifically enhance facial features for professional portrait quality. Sharpen eyes and add subtle catchlight, smooth skin naturally while preserving texture, enhance hair detail, even skin tone, subtle teeth whitening if visible, reduce under-eye shadows. Professional headshot/portrait retouching that enhances without looking artificial. Maintain exact facial identity and expression.' },
      { id: 'restore-old-photo', name: 'Restore Old Photo', prompt: 'OLD PHOTO RESTORATION: Repair and restore this vintage or damaged photograph. Fix fading and color deterioration, remove scratches and dust spots, repair torn or missing areas, correct color casts from aging, enhance faded details, reduce grain while preserving authentic vintage character. Restore to how it would have looked when originally taken. Do not modernize the style - preserve the era-appropriate look.' },
      { id: 'hdr-effect', name: 'HDR Effect', prompt: 'HDR ENHANCEMENT: Apply high dynamic range enhancement to reveal detail in highlights and shadows simultaneously. Expand tonal range, recover blown highlights, lift shadow detail, increase local contrast for dramatic depth. Professional HDR tonemapping that looks natural not overdone - like a perfectly exposed single shot, not garish HDR artifacts. Maintain natural colors.' },
      { id: 'boost-vibrance', name: 'Boost Vibrance', prompt: 'COLOR VIBRANCE: Intelligently boost color saturation focusing on muted tones while protecting already-saturated colors and skin tones. Make colors pop and come alive without oversaturation. Increase color depth and richness, enhance color separation. Professional vibrance adjustment that makes images more visually striking while maintaining natural appearance.' },
      // Touchup presets
      { id: 'smooth-skin', name: 'Smooth Skin', prompt: 'Apply natural skin retouching: gently smooth skin texture while preserving pores and natural detail, reduce visible blemishes and imperfections, even out skin tone, subtle frequency separation effect, professional beauty retouching that looks natural not plastic, maintain all other elements exactly as they are' },
      { id: 'brighten-eyes', name: 'Brighten Eyes', prompt: 'Enhance the eyes: brighten the whites of the eyes, add subtle catchlight sparkle, increase iris clarity and definition, reduce any redness or tired appearance, make eyes appear more vibrant and engaging while keeping them natural, maintain all other elements exactly as they are' },
      { id: 'whiten-teeth', name: 'Whiten Teeth', prompt: 'Naturally whiten teeth: remove yellow or stained appearance, brighten to natural white without looking artificially bleached, maintain tooth texture and natural variation, subtle professional whitening effect, maintain all other elements exactly as they are' },
      { id: 'reduce-wrinkles', name: 'Reduce Wrinkles', prompt: 'Subtly reduce wrinkles and fine lines: soften crow\'s feet, forehead lines, and smile lines while maintaining natural facial character, professional anti-aging retouching that preserves personality, reduce without eliminating completely, maintain all other elements exactly as they are' },
      { id: 'fix-flyaways', name: 'Fix Flyaways', prompt: 'Clean up hair flyaways and frizz: smooth stray hairs, tame wispy edges, clean up messy hair outline while maintaining natural hair texture and volume, professional hair retouching, maintain all other elements exactly as they are' },
      { id: 'reduce-shine', name: 'Reduce Shine', prompt: 'Reduce oily skin shine and glare: mattify shiny forehead, nose, and cheeks, remove unwanted specular highlights on skin, maintain healthy skin appearance without looking flat or matte, professional shine reduction, maintain all other elements exactly as they are' },
      { id: 'sharpen-details', name: 'Sharpen Details', prompt: 'Enhance sharpness and clarity: increase fine detail definition, apply intelligent sharpening to textures and edges, boost micro-contrast for crisp professional look, high-frequency detail enhancement without artifacts, maintain all other elements exactly as they are' },
      { id: 'reduce-noise', name: 'Reduce Noise', prompt: 'Clean up image noise and grain: reduce high-ISO noise artifacts, smooth grainy areas while preserving detail and texture, denoise shadows and flat areas, professional noise reduction that maintains sharpness, maintain all other elements exactly as they are' },
      { id: 'fix-colors', name: 'Fix Colors', prompt: 'Auto correct white balance and colors: neutralize color casts, fix incorrect white balance from mixed lighting, ensure accurate true-to-life colors, professional color correction for natural appearance, maintain all other elements exactly as they are' },
      { id: 'remove-spots', name: 'Remove Spots', prompt: 'Clean up small imperfections: remove dust spots, sensor spots, small distracting marks, minor blemishes, healing brush style cleanup of unwanted specks and spots throughout the image, maintain all other elements exactly as they are' },
      { id: 'enhance-textures', name: 'Enhance Textures', prompt: 'Enhance material textures: make fabric weaves more visible, bring out leather grain, enhance product surface details, boost texture definition for materials and surfaces, professional product photography enhancement, maintain all other elements exactly as they are' },
      { id: 'lift-shadows', name: 'Lift Shadows', prompt: 'Brighten shadow areas: recover detail in dark regions, lift underexposed shadows without washing out, fill light effect, reveal hidden detail in dark areas while maintaining overall contrast and mood, maintain all other elements exactly as they are' },
    ],
  };

  // Helper to get translated size labels
  const getSizeLabel = (label: string): string => {
    const sizeLabels: Record<string, string> = {
      'Square': t('sizes.square'),
      'Story': t('sizes.story'),
      'Landscape': t('sizes.landscape'),
      'Portrait': t('sizes.portrait'),
      'Pinterest': t('sizes.pinterest'),
    };
    return sizeLabels[label] || label;
  };

  // Translation key mappings for presets (kebab-case ID to camelCase translation key)
  const PRESET_KEYS: Record<string, string> = {
    // Lighting
    'golden-hour': 'presets.lighting.goldenHour',
    'studio': 'presets.lighting.studio',
    'natural': 'presets.lighting.natural',
    'dramatic': 'presets.lighting.dramatic',
    'backlit': 'presets.lighting.backlit',
    'soft-box': 'presets.lighting.softBox',
    // Style
    'photorealistic': 'presets.style.photorealistic',
    'cinematic': 'presets.style.cinematic',
    'editorial': 'presets.style.editorial',
    'film-grain': 'presets.style.filmGrain',
    'minimalist': 'presets.style.minimalist',
    'hdr': 'presets.style.hdr',
    // Mood
    'cinematic-moody': 'presets.mood.cinematicMoody',
    'hyper-realistic': 'presets.mood.hyperRealistic',
    'light-dreamy': 'presets.mood.lightDreamy',
    'high-contrast': 'presets.mood.highContrast',
    'soft-natural': 'presets.mood.softNatural',
    'dark-dramatic': 'presets.mood.darkDramatic',
    // Color
    'warm-cozy': 'presets.color.warmCozy',
    'cool-modern': 'presets.color.coolModern',
    'vibrant-bold': 'presets.color.vibrantBold',
    'muted-soft': 'presets.color.mutedSoft',
    'dark-luxurious': 'presets.color.darkLuxurious',
    'bright-airy': 'presets.color.brightAiry',
    // Era
    'film-analog': 'presets.era.filmAnalog',
    '70s-retro': 'presets.era.70sRetro',
    '90s-faded': 'presets.era.90sFaded',
    'y2k-glossy': 'presets.era.y2kGlossy',
    'vintage-sepia': 'presets.era.vintageSepia',
    'modern-clean': 'presets.era.modernClean',
    // Camera
    'hasselblad': 'presets.camera.hasselblad',
    'canon-r5': 'presets.camera.canonR5',
    'sony-a7rv': 'presets.camera.sonyA7rv',
    'nikon-z8': 'presets.camera.nikonZ8',
    'film-35mm': 'presets.camera.film35mm',
    'polaroid': 'presets.camera.polaroid',
    'ring-camera': 'presets.camera.ringCamera',
    // Framing
    'closeup': 'presets.framing.closeup',
    'medium-shot': 'presets.framing.mediumShot',
    'wide-shot': 'presets.framing.wideShot',
    'high-angle': 'presets.framing.highAngle',
    'low-angle': 'presets.framing.lowAngle',
    'birds-eye-view': 'presets.framing.birdsEyeView',
    // Rotation
    'orbit-front': 'presets.rotation.orbitFront',
    'orbit-right': 'presets.rotation.orbitRight',
    'orbit-left': 'presets.rotation.orbitLeft',
    'orbit-behind': 'presets.rotation.orbitBehind',
    'orbit-45-right': 'presets.rotation.orbit45Right',
    'orbit-45-left': 'presets.rotation.orbit45Left',
    // Enhance
    'upscale-2x': 'presets.enhance.upscale2x',
    'upscale-4x': 'presets.enhance.upscale4x',
    'auto-enhance': 'presets.enhance.autoEnhance',
    'face-enhance': 'presets.enhance.faceEnhance',
    'restore-old-photo': 'presets.enhance.restoreOldPhoto',
    'hdr-effect': 'presets.enhance.hdrEffect',
    'boost-vibrance': 'presets.enhance.boostVibrance',
    'smooth-skin': 'presets.enhance.smoothSkin',
    'brighten-eyes': 'presets.enhance.brightenEyes',
    'whiten-teeth': 'presets.enhance.whitenTeeth',
    'reduce-wrinkles': 'presets.enhance.reduceWrinkles',
    'fix-flyaways': 'presets.enhance.fixFlyaways',
    'reduce-shine': 'presets.enhance.reduceShine',
    'sharpen-details': 'presets.enhance.sharpenDetails',
    'reduce-noise': 'presets.enhance.reduceNoise',
    'fix-colors': 'presets.enhance.fixColors',
    'remove-spots': 'presets.enhance.removeSpots',
    'enhance-textures': 'presets.enhance.enhanceTextures',
    'lift-shadows': 'presets.enhance.liftShadows',
  };

  // Translation key mappings for background presets
  const BACKGROUND_PRESET_KEYS: Record<string, string> = {
    'blur-bg': 'backgroundPresets.blurBg',
    'white-studio': 'backgroundPresets.whiteStudio',
    'outdoor-nature': 'backgroundPresets.outdoorNature',
    'urban-street': 'backgroundPresets.urbanStreet',
    'minimalist-gradient': 'backgroundPresets.minimalistGradient',
    'office-workspace': 'backgroundPresets.officeWorkspace',
    'beach-coastal': 'backgroundPresets.beachCoastal',
    'coffee-shop': 'backgroundPresets.coffeeShop',
    'urban-studio': 'backgroundPresets.urbanStudio',
    'darken-bg': 'backgroundPresets.darkenBg',
    'simplify-scene': 'backgroundPresets.simplifyScene',
    'golden-hour': 'backgroundPresets.goldenHour',
    'sunrise-glow': 'backgroundPresets.sunriseGlow',
    'blue-hour': 'backgroundPresets.blueHour',
    'moonlit-night': 'backgroundPresets.moonlitNight',
    'bright-midday': 'backgroundPresets.brightMidday',
    'winter-light': 'backgroundPresets.winterLight',
    'overcast-sky': 'backgroundPresets.overcastSky',
    'foggy-misty': 'backgroundPresets.foggyMisty',
    'rainy-day': 'backgroundPresets.rainyDay',
  };

  // Translation key mappings for model builder options
  const MODEL_OPTION_KEYS: Record<string, Record<string, string>> = {
    gender: {
      'female': 'modelBuilder.gender.female',
      'male': 'modelBuilder.gender.male',
      'any': 'modelBuilder.gender.any',
    },
    ageRange: {
      '18-25': 'modelBuilder.ageRange.youngAdult',
      '26-35': 'modelBuilder.ageRange.adult',
      '36-50': 'modelBuilder.ageRange.middleAged',
      '50+': 'modelBuilder.ageRange.mature',
    },
    ethnicity: {
      'east-asian': 'modelBuilder.ethnicity.eastAsian',
      'south-asian': 'modelBuilder.ethnicity.southAsian',
      'black': 'modelBuilder.ethnicity.black',
      'hispanic': 'modelBuilder.ethnicity.hispanic',
      'middle-eastern': 'modelBuilder.ethnicity.middleEastern',
      'white': 'modelBuilder.ethnicity.white',
      'mixed': 'modelBuilder.ethnicity.mixed',
    },
    hairColor: {
      'black': 'modelBuilder.hairColor.black',
      'brown': 'modelBuilder.hairColor.brown',
      'blonde': 'modelBuilder.hairColor.blonde',
      'red': 'modelBuilder.hairColor.red',
      'gray': 'modelBuilder.hairColor.gray',
    },
    hairType: {
      'straight': 'modelBuilder.hairType.straight',
      'wavy': 'modelBuilder.hairType.wavy',
      'curly': 'modelBuilder.hairType.curly',
      'coily': 'modelBuilder.hairType.coily',
      'short': 'modelBuilder.hairType.short',
      'long': 'modelBuilder.hairType.long',
      'bald': 'modelBuilder.hairType.bald',
    },
    bodyType: {
      'slim': 'modelBuilder.bodyType.slim',
      'athletic': 'modelBuilder.bodyType.athletic',
      'average': 'modelBuilder.bodyType.average',
      'curvy': 'modelBuilder.bodyType.curvy',
      'plus-size': 'modelBuilder.bodyType.plusSize',
    },
    expression: {
      'warm-friendly': 'modelBuilder.expression.warmFriendly',
      'confident': 'modelBuilder.expression.confident',
      'playful': 'modelBuilder.expression.playful',
      'serious': 'modelBuilder.expression.serious',
      'mysterious': 'modelBuilder.expression.mysterious',
      'approachable': 'modelBuilder.expression.approachable',
    },
    vibe: {
      'classic': 'modelBuilder.vibe.classic',
      'modern-edgy': 'modelBuilder.vibe.modernEdgy',
      'outdoorsy': 'modelBuilder.vibe.outdoorsy',
      'urban': 'modelBuilder.vibe.urban',
      'glamorous': 'modelBuilder.vibe.glamorous',
      'next-door': 'modelBuilder.vibe.nextDoor',
    },
  };

  // Background suggestions for the Backgrounds tool
  const BACKGROUND_SUGGESTIONS = [
    // Scene/Location backgrounds
    { id: 'blur-bg', name: 'Blur Background', prompt: 'Blur the background to create depth of field effect, keep main subject perfectly sharp. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'white-studio', name: 'White Studio', prompt: 'Clean white studio background with soft shadows, professional ecommerce style. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'outdoor-nature', name: 'Outdoor Nature', prompt: 'Natural outdoor setting with greenery, trees, and soft natural light. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'urban-street', name: 'Urban Street', prompt: 'Modern urban street scene with city architecture and contemporary elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'minimalist-gradient', name: 'Minimalist Gradient', prompt: 'Simple gradient background fading from light to dark, modern editorial style. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'office-workspace', name: 'Office/Workspace', prompt: 'Modern office or workspace setting with desk and professional environment. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'beach-coastal', name: 'Beach/Coastal', prompt: 'Beach or coastal setting with ocean, sand, and warm sunlight. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'coffee-shop', name: 'Coffee Shop', prompt: 'Cozy coffee shop or cafe interior with warm ambient lighting. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'urban-studio', name: 'Urban Photo Studio', prompt: 'High-end editorial photoshoot in a spacious industrial loft studio. Polished concrete floors, tall ceilings with exposed beams, minimal clean aesthetic. Large floor-to-ceiling windows with soft diffused natural light streaming in - the subtle glow and atmosphere outside suggests a major city without showing explicit skyline. Elegant simplicity, the kind of refined space where Vogue or Harper\'s Bazaar would shoot. Sophisticated, understated luxury. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'darken-bg', name: 'Darken Background', prompt: 'Keep the exact same background scene and location but darken it for dramatic subject emphasis. Do not change or replace the background - only reduce its brightness and exposure. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'simplify-scene', name: 'Simplify Scene', prompt: 'Reduce visual clutter, remove distracting elements from background. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    // Lighting adjustments (preserve scene, change only lighting/mood)
    { id: 'golden-hour', name: 'Golden Hour', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply warm golden hour lighting with soft orange and amber tones, long dramatic shadows. Adjust the color temperature and lighting to simulate sunset/sunrise. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'sunrise-glow', name: 'Sunrise Glow', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply soft early morning sunrise lighting with pink and orange hues, gentle warm glow. Adjust shadows and color temperature for dawn atmosphere. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'blue-hour', name: 'Blue Hour', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply twilight blue hour lighting with cool blue and purple tones, dramatic cinematic shadows. Adjust color temperature to cool tones. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'moonlit-night', name: 'Moonlit Night', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply nighttime moonlight illumination with cool blue tones and subtle shadows. Darken the scene and adjust to nocturnal lighting. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'bright-midday', name: 'Bright Midday', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply bright midday sun lighting with high contrast, strong overhead shadows, vibrant saturated colors. Adjust exposure and shadows for summer sun. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'winter-light', name: 'Winter Light', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply cool winter sunlight with low angle lighting, soft cool blue tones, crisp clear atmosphere. Adjust color temperature to cool. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    // Weather/atmosphere adjustments (preserve scene, change only mood)
    { id: 'overcast-sky', name: 'Overcast Sky', prompt: 'LIGHTING ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply soft overcast lighting with diffused shadows, no harsh contrasts, even gentle illumination. Flatten the lighting as if clouds are diffusing the sun. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'foggy-misty', name: 'Foggy/Misty', prompt: 'ATMOSPHERE ADJUSTMENT ONLY: Keep the exact same background scene and location. Add subtle atmospheric fog or mist to create ethereal dreamy quality with soft diffused light. Reduce background clarity slightly. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
    { id: 'rainy-day', name: 'Rainy Day', prompt: 'ATMOSPHERE ADJUSTMENT ONLY: Keep the exact same background scene and location. Apply rainy day mood with wet surface reflections, moody overcast lighting, atmospheric dampness. Add subtle rain atmosphere. Do not change or replace the background elements. IMPORTANT: The subject\'s face must remain exactly the same - same facial features, same expression, same identity. Any text or lettering in the image must not be changed or altered in any way.' },
  ];

  // Model builder options
  const MODEL_OPTIONS = {
    gender: [
      { id: 'female', label: 'Female' },
      { id: 'male', label: 'Male' },
      { id: 'any', label: 'Any' },
    ],
    ageRange: [
      { id: '18-25', label: 'Young Adult (18-25)' },
      { id: '26-35', label: 'Adult (26-35)' },
      { id: '36-50', label: 'Middle-Aged (36-50)' },
      { id: '50+', label: 'Mature (50+)' },
    ],
    ethnicity: [
      { id: 'east-asian', label: 'East Asian' },
      { id: 'south-asian', label: 'South Asian' },
      { id: 'black', label: 'Black/African' },
      { id: 'hispanic', label: 'Hispanic/Latino' },
      { id: 'middle-eastern', label: 'Middle Eastern' },
      { id: 'white', label: 'White/Caucasian' },
      { id: 'mixed', label: 'Mixed/Multiracial' },
    ],
    hairColor: [
      { id: 'black', label: 'Black' },
      { id: 'brown', label: 'Brown' },
      { id: 'blonde', label: 'Blonde' },
      { id: 'red', label: 'Red' },
      { id: 'gray', label: 'Gray/Silver' },
    ],
    hairType: [
      { id: 'straight', label: 'Straight' },
      { id: 'wavy', label: 'Wavy' },
      { id: 'curly', label: 'Curly' },
      { id: 'coily', label: 'Coily' },
      { id: 'short', label: 'Short' },
      { id: 'long', label: 'Long' },
      { id: 'bald', label: 'Bald' },
    ],
    bodyType: [
      { id: 'slim', label: 'Slim' },
      { id: 'athletic', label: 'Athletic' },
      { id: 'average', label: 'Average' },
      { id: 'curvy', label: 'Curvy' },
      { id: 'plus-size', label: 'Plus-size' },
    ],
    expression: [
      { id: 'warm-friendly', label: 'Warm & Friendly' },
      { id: 'confident', label: 'Confident' },
      { id: 'playful', label: 'Playful' },
      { id: 'serious', label: 'Serious/Intense' },
      { id: 'mysterious', label: 'Mysterious' },
      { id: 'approachable', label: 'Approachable' },
    ],
    vibe: [
      { id: 'classic', label: 'Classic/Timeless' },
      { id: 'modern-edgy', label: 'Modern/Edgy' },
      { id: 'outdoorsy', label: 'Outdoorsy' },
      { id: 'urban', label: 'Urban' },
      { id: 'glamorous', label: 'Glamorous' },
      { id: 'next-door', label: 'Girl/Guy Next Door' },
    ],
  };

  const [viewingOriginalResizedSize, setViewingOriginalResizedSize] = useState<string | null>(null);

  // Load API keys and default weirdness from localStorage on mount
  useEffect(() => {
    // Load Gemini key
    const storedGeminiKey = getStoredApiKey();
    setApiKeyState(storedGeminiKey);

    // Load OpenAI key
    const storedOpenAIKey = getStoredOpenAIKey();
    setOpenaiApiKeyState(storedOpenAIKey);

    // Load DashScope key
    const storedDashScopeKey = getStoredDashScopeKey();
    setDashscopeApiKeyState(storedDashScopeKey);

    setIsApiKeyLoaded(true);

    const savedWeirdness = localStorage.getItem('defaultWeirdness');
    if (savedWeirdness) {
      setWeirdnessLevel(parseInt(savedWeirdness));
    }

    // Load saved image quality preference
    const savedQuality = localStorage.getItem('imageQuality') as ImageQuality | null;
    if (savedQuality && ['low', 'medium', 'high'].includes(savedQuality)) {
      setImageQuality(savedQuality);
    }

    // Check if first visit
    const hasVisited = localStorage.getItem('statickit_has_visited');

    // Show welcome modal on first visit without any API key
    // Show API key setup on return visits without any API key
    const hasAnyKey = storedGeminiKey || storedOpenAIKey || storedDashScopeKey;
    if (!hasAnyKey) {
      if (!hasVisited) {
        setShowWelcome(true);
      } else {
        setShowApiKeySetup(true);
      }
    }

    // Check for existing session to resume
    checkForExistingSession().then((sessionInfo) => {
      setSessionChecked(true);
      if (sessionInfo.exists && hasAnyKey) {
        setResumeSessionData({
          thumbnailUrl: sessionInfo.thumbnailUrl,
          savedAt: sessionInfo.savedAt,
          size: sessionInfo.size,
        });
        setShowResumeSessionModal(true);
      }
    });
  }, []);

  // Persist image quality preference to localStorage
  useEffect(() => {
    localStorage.setItem('imageQuality', imageQuality);
  }, [imageQuality]);

  // Auto-save session when state changes (only if we have an uploaded image)
  useEffect(() => {
    if (!uploadedImage || !sessionChecked) return;

    const sessionState: SessionState = {
      uploadedImage,
      analysis,
      baseVersions,
      variations,
      activeBaseId,
      selectedVariationId,
      selectedTool,
      selectedPresets,
      customPrompt,
      additionalContext,
      originalEditPrompt,
      backgroundCustomPrompt,
      modelCustomPrompt,
      keepClothing,
      modelBuilder: {
        gender: selectedGender,
        ageRange: selectedAgeRange,
        ethnicity: selectedEthnicity,
        hairColor: selectedHairColor,
        hairType: selectedHairType,
        bodyType: selectedBodyType,
        expression: selectedExpression,
        vibe: selectedVibe,
      },
      backgroundReferences,
      modelReferences,
      editReferences,
      selectedAIModel,
      imageQuality,
      weirdnessLevel,
    };

    scheduleSave(sessionState);
  }, [
    uploadedImage,
    analysis,
    baseVersions,
    variations,
    activeBaseId,
    selectedVariationId,
    selectedTool,
    selectedPresets,
    customPrompt,
    additionalContext,
    originalEditPrompt,
    backgroundCustomPrompt,
    modelCustomPrompt,
    keepClothing,
    selectedGender,
    selectedAgeRange,
    selectedEthnicity,
    selectedHairColor,
    selectedHairType,
    selectedBodyType,
    selectedExpression,
    selectedVibe,
    backgroundReferences,
    modelReferences,
    editReferences,
    selectedAIModel,
    imageQuality,
    weirdnessLevel,
    sessionChecked,
    scheduleSave,
  ]);

  // Save session immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (uploadedImage) {
        saveNow();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && uploadedImage) {
        saveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [uploadedImage, saveNow]);

  // Handle continuing a previous session
  const handleContinueSession = async () => {
    setIsRestoringSession(true);
    try {
      const restoredState = await restoreSession();
      if (restoredState) {
        // Restore all state
        setUploadedImage(restoredState.uploadedImage as UploadedImage);
        setAnalysis(restoredState.analysis);
        setBaseVersions(restoredState.baseVersions);
        setVariations(restoredState.variations);
        setActiveBaseId(restoredState.activeBaseId);
        setSelectedVariationId(restoredState.selectedVariationId);
        setSelectedTool(restoredState.selectedTool as Tool);
        setSelectedPresets(restoredState.selectedPresets);
        setCustomPrompt(restoredState.customPrompt);
        setAdditionalContext(restoredState.additionalContext);
        setOriginalEditPrompt(restoredState.originalEditPrompt);
        setBackgroundCustomPrompt(restoredState.backgroundCustomPrompt);
        setModelCustomPrompt(restoredState.modelCustomPrompt);
        setKeepClothing(restoredState.keepClothing);
        setSelectedGender(restoredState.modelBuilder.gender);
        setSelectedAgeRange(restoredState.modelBuilder.ageRange);
        setSelectedEthnicity(restoredState.modelBuilder.ethnicity);
        setSelectedHairColor(restoredState.modelBuilder.hairColor);
        setSelectedHairType(restoredState.modelBuilder.hairType);
        setSelectedBodyType(restoredState.modelBuilder.bodyType);
        setSelectedExpression(restoredState.modelBuilder.expression);
        setSelectedVibe(restoredState.modelBuilder.vibe);
        setBackgroundReferences(restoredState.backgroundReferences);
        setModelReferences(restoredState.modelReferences);
        setEditReferences(restoredState.editReferences);
        setSelectedAIModel(restoredState.selectedAIModel as AIModel);
        setImageQuality(restoredState.imageQuality as ImageQuality);
        setWeirdnessLevel(restoredState.weirdnessLevel);

        // Switch to editor mode
        setStep('editor');
        toast.success(t('session.sessionSaved'));
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      toast.error('Failed to restore session');
    } finally {
      setIsRestoringSession(false);
      setShowResumeSessionModal(false);
    }
  };

  // Handle starting fresh (clear session)
  const handleStartFresh = async () => {
    await clearSessionData();
    setShowResumeSessionModal(false);
  };

  // Handle clearing session from menu
  const handleClearSession = async () => {
    await clearSessionData();
    toast.success(t('session.sessionCleared'));
  };

  // Helper to update Gemini API key in both state and localStorage
  const handleSetApiKey = (key: string) => {
    setStoredApiKey(key);
    setApiKeyState(key);
  };

  // Helper to update OpenAI API key in both state and localStorage
  const handleSetOpenAIKey = (key: string) => {
    setStoredOpenAIKey(key);
    setOpenaiApiKeyState(key);
  };

  // Helper to update DashScope API key in both state and localStorage
  const handleSetDashScopeKey = (key: string) => {
    setStoredDashScopeKey(key);
    setDashscopeApiKeyState(key);
  };

  // Get display name for selected model
  const getModelDisplayName = (model: AIModel): string => {
    switch (model) {
      case 'gemini-3-pro-image-preview': return 'Gemini 3 Pro';
      case 'gemini-2.5-flash-image': return 'Gemini 2.5 Flash';
      case 'gpt-image-1': return 'GPT Image 1.5';
      case 'wan2.6-image': return 'Wan 2.6';
      default: return model;
    }
  };

  // Refs to hold current values for keyboard handler (avoids stale closures without dep array issues)
  const compareStateRef = useRef({ isCompareMode, compareLeftIndex, compareRightIndex });
  useEffect(() => {
    compareStateRef.current = { isCompareMode, compareLeftIndex, compareRightIndex };
  }, [isCompareMode, compareLeftIndex, compareRightIndex]);

  // Keyboard navigation for version control (left/right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const selectedVariation = variations.find(v => v.id === selectedVariationId);
      const isShowingGenerated = selectedVariation && selectedVariation.imageUrl;

      // Read compare state from ref (always current)
      const { isCompareMode: inCompareMode, compareLeftIndex: leftIdx, compareRightIndex: rightIdx } = compareStateRef.current;

      if (e.shiftKey && e.key === 'ArrowLeft') {
        // Shift + Left = Previous tool
        const tools: Tool[] = ['iterations', 'edit', 'backgrounds', 'model', 'export'];
        setSelectedTool(prev => {
          if (prev === null) return 'export'; // Start from end
          const currentIndex = tools.indexOf(prev);
          return currentIndex <= 0 ? null : tools[currentIndex - 1];
        });
      } else if (e.shiftKey && e.key === 'ArrowRight') {
        // Shift + Right = Next tool
        const tools: Tool[] = ['iterations', 'edit', 'backgrounds', 'model', 'export'];
        setSelectedTool(prev => {
          if (prev === null) return 'iterations'; // Start from beginning
          const currentIndex = tools.indexOf(prev);
          return currentIndex >= tools.length - 1 ? null : tools[currentIndex + 1];
        });
      } else if (e.key === 'ArrowLeft') {
        if (inCompareMode && rightIdx !== null) {
          // In compare mode: navigate the right side (blue dot)
          if (rightIdx > 0) {
            const newIndex = rightIdx - 1;
            // Skip the locked left index
            if (newIndex === leftIdx && newIndex > 0) {
              setCompareRightIndex(newIndex - 1);
            } else if (newIndex !== leftIdx) {
              setCompareRightIndex(newIndex);
            }
          }
        } else if (isShowingGenerated && selectedVariation.versions.length > 1) {
          // Navigate generated image versions
          if (selectedVariation.currentVersionIndex > 0) {
            setVariations(prev => prev.map(v =>
              v.id === selectedVariationId
                ? { ...v, currentVersionIndex: v.currentVersionIndex - 1, hasNewVersion: false }
                : v
            ));
          }
        } else if (!isShowingGenerated && originalVersions.length > 1 && originalVersionIndex > 0) {
          // Navigate original image versions
          setOriginalVersionIndex(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (inCompareMode && rightIdx !== null) {
          // In compare mode: navigate the right side (blue dot)
          if (rightIdx < originalVersions.length - 1) {
            const newIndex = rightIdx + 1;
            // Skip the locked left index
            if (newIndex === leftIdx && newIndex < originalVersions.length - 1) {
              setCompareRightIndex(newIndex + 1);
            } else if (newIndex !== leftIdx) {
              setCompareRightIndex(newIndex);
            }
          }
        } else if (isShowingGenerated && selectedVariation.versions.length > 1) {
          // Navigate generated image versions
          if (selectedVariation.currentVersionIndex < selectedVariation.versions.length - 1) {
            setVariations(prev => prev.map(v =>
              v.id === selectedVariationId
                ? { ...v, currentVersionIndex: v.currentVersionIndex + 1, hasNewVersion: false }
                : v
            ));
          }
        } else if (!isShowingGenerated && originalVersions.length > 1 && originalVersionIndex < originalVersions.length - 1) {
          // Navigate original image versions
          setOriginalVersionIndex(prev => prev + 1);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete current edit (not original, not variations)
        if (!isShowingGenerated && originalVersionIndex > 0 && originalVersions.length > 1) {
          const currentVersion = originalVersions[originalVersionIndex];
          if (currentVersion?.status !== 'processing') {
            // Delete the version and go to previous
            setOriginalVersions(prev => prev.filter((_, idx) => idx !== originalVersionIndex));
            setOriginalVersionIndex(Math.max(0, originalVersionIndex - 1));
          }
        }
      } else if (e.key === '1') {
        setSelectedTool('iterations');
      } else if (e.key === '2') {
        setSelectedTool('edit');
      } else if (e.key === '3') {
        setSelectedTool('backgrounds');
      } else if (e.key === '4') {
        setSelectedTool('model');
      } else if (e.key === '5') {
        setSelectedTool('export');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVariationId, variations, originalVersions, originalVersionIndex]);

  // Helper to calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Swipe/pinch gesture handlers for mobile image navigation and zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
      setInitialZoom(zoomLevel);
    } else if (e.touches.length === 1) {
      // Single touch for swipe
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  }, [getTouchDistance, zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Disable pinch zoom in compare mode
    if (isCompareMode) return;

    if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.min(Math.max(initialZoom * scale, 1), 4);
      setZoomLevel(newZoom);

      // Reset position when zooming back to 1
      if (newZoom <= 1.05) {
        setZoomPosition({ x: 0, y: 0 });
      }
    }
  }, [initialPinchDistance, initialZoom, getTouchDistance, isCompareMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Reset pinch state
    setInitialPinchDistance(null);

    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Only register as swipe if:
    // 1. Not zoomed in (zoom level is 1)
    // 2. Horizontal movement is greater than vertical
    // 3. Swipe distance is significant (> 50px)
    if (zoomLevel === 1 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const selectedVariation = variations.find(v => v.id === selectedVariationId);
      const isShowingGenerated = selectedVariation && selectedVariation.imageUrl;

      if (deltaX > 0) {
        // Swipe right = previous version
        if (isShowingGenerated && selectedVariation.versions.length > 1) {
          if (selectedVariation.currentVersionIndex > 0) {
            setVariations(prev => prev.map(v =>
              v.id === selectedVariationId
                ? { ...v, currentVersionIndex: v.currentVersionIndex - 1 }
                : v
            ));
          }
        } else if (!isShowingGenerated && originalVersions.length > 1 && originalVersionIndex > 0) {
          setOriginalVersionIndex(prev => prev - 1);
        }
      } else {
        // Swipe left = next version
        if (isShowingGenerated && selectedVariation.versions.length > 1) {
          if (selectedVariation.currentVersionIndex < selectedVariation.versions.length - 1) {
            setVariations(prev => prev.map(v =>
              v.id === selectedVariationId
                ? { ...v, currentVersionIndex: v.currentVersionIndex + 1 }
                : v
            ));
          }
        } else if (!isShowingGenerated && originalVersions.length > 1 && originalVersionIndex < originalVersions.length - 1) {
          setOriginalVersionIndex(prev => prev + 1);
        }
      }
    }

    setTouchStart(null);
  }, [touchStart, selectedVariationId, variations, originalVersions, originalVersionIndex, setVariations, setOriginalVersionIndex, zoomLevel]);

  // Automatically analyze image when uploaded (for the image description tooltip)
  useEffect(() => {
    if (!uploadedImage || analysis) return; // Skip if no image or already analyzed

    const analyzeImageForDescription = async () => {
      try {
        const base64 = await fileToBase64(uploadedImage.file);
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            image: base64,
            mimeType: uploadedImage.file.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysis(data.analysis);
        } else {
          // Set a fallback analysis with a generic description
          setAnalysis({
            product: 'Image subject',
            brand_style: 'Clean aesthetic',
            visual_elements: ['Main subject', 'Background'],
            key_selling_points: ['Visual quality'],
            target_audience: 'General',
            colors: ['Various'],
            mood: 'Neutral',
            imageDescription: 'Unable to analyze image - please try again',
          });
        }
      } catch (error) {
        console.error('Auto-analysis error:', error);
        setAnalysis({
          product: 'Image subject',
          brand_style: 'Clean aesthetic',
          visual_elements: ['Main subject'],
          key_selling_points: ['Visual quality'],
          target_audience: 'General',
          colors: ['Various'],
          mood: 'Neutral',
          imageDescription: 'Unable to analyze image',
        });
      }
    };

    analyzeImageForDescription();
  }, [uploadedImage, analysis]);

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

          // Initialize base versions with the restored Original
          setBaseVersions([{
            id: 'original',
            name: 'Original',
            baseImageUrl: data.originalImageUrl,
            sourceLabel: 'Restored from session',
            versions: [{ imageUrl: data.originalImageUrl, prompt: null, parentIndex: -1, status: 'completed' as const }],
            currentVersionIndex: 0,
            resizedVersions: [],
          }]);
          setActiveBaseId('original');

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
            versions: v.image_url ? [{ imageUrl: v.image_url, prompt: null, parentIndex: -1, status: 'completed' as const }] : [],
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
        const currentVersion = originalVersions[originalVersionIndex];
        // If current version is processing, show parent version or original
        if (currentVersion.imageUrl) {
          return currentVersion.imageUrl;
        }
        // Fall back to parent version or original for processing/error states
        if (currentVersion.parentIndex >= 0 && originalVersions[currentVersion.parentIndex]?.imageUrl) {
          return originalVersions[currentVersion.parentIndex].imageUrl;
        }
        return uploadedImage?.url;
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

  // Reset zoom when image changes
  useEffect(() => {
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  }, [selectedVariationId, originalVersionIndex, uploadedImage?.url]);

  // Exit compare mode when tool changes or when switching to variations
  useEffect(() => {
    if (isCompareMode) {
      setIsCompareMode(false);
      setCompareLeftIndex(null);
      setCompareRightIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, selectedVariationId]);

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
      // Initialize base versions with the Original
      setBaseVersions([{
        id: 'original',
        name: 'Original',
        baseImageUrl: objectUrl,
        sourceLabel: 'Uploaded image',
        versions: [{ imageUrl: objectUrl, prompt: null, parentIndex: -1, status: 'completed' as const }],
        currentVersionIndex: 0,
        resizedVersions: [],
      }]);
      setActiveBaseId('original');
      setStep('editor');
      setSelectedTool('edit'); // Default to edit tool

      // Track upload
      track('image_uploaded', {
        width: img.width,
        height: img.height,
        aspectRatio: label,
        fileSize: file.size,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to read image');
    };

    img.src = objectUrl;
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: uploadedImage !== null, // Only disabled when we have an image
    noClick: uploadedImage !== null, // Disable click when image exists
  });

  // Trigger upload icon animation when dragging files over
  useEffect(() => {
    if (isDragActive) {
      uploadIconRef.current?.startAnimation();
    } else {
      uploadIconRef.current?.stopAnimation();
    }
  }, [isDragActive]);

  // Generate iterations on-demand (called from the Iterations tool)
  const handleGenerateIterations = async () => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    setIsAnalyzingForIterations(true);
    setError(null);

    try {
      const base64 = await fileToBase64(uploadedImage.file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
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
          product: 'Image subject',
          brand_style: 'Clean aesthetic',
          visual_elements: ['Main subject', 'Background', 'Visual elements'],
          key_selling_points: ['Visual quality', 'Composition'],
          target_audience: 'General',
          colors: ['Various'],
          mood: 'Neutral',
          imageDescription: 'Unable to analyze image - please try again',
        };
      }

      setAnalysis(analysisData);

      const varResponse = await fetch('/api/suggest-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
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
      track('variations_generated', { count: variationsData.length });
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
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

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
          apiKey,
          openaiApiKey,
          dashscopeApiKey,
          image: base64,
          mimeType: uploadedImage.file.type,
          analysis,
          variationDescription: variation.description,
          aspectRatio: uploadedImage.aspectRatio,
          model: selectedAIModel,
          quality: imageQuality,
        }),
      });

      let imageUrl: string;
      let generationSucceeded = false;
      if (response.ok) {
        const data = await response.json();
        imageUrl = data.imageUrl;
        generationSucceeded = true;
      } else {
        imageUrl = `https://placehold.co/400x500/6366f1/white?text=${encodeURIComponent(variation.title)}`;
      }

      setVariations(prev =>
        prev.map(v => (v.id === variationId ? {
          ...v,
          status: 'completed',
          imageUrl,
          versions: [{ imageUrl, prompt: null, parentIndex: -1, status: 'completed' as const }], // Store first version (no edit prompt for initial generation)
          currentVersionIndex: 0,
        } : v))
      );

      if (generationSucceeded) {
        track('image_generated', { tool: 'iterate' });
      }

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
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
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
    if (value <= 40) return { label: 'Lifestyle', color: 'text-green-700 dark:text-green-400' };
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
          apiKey,
          openaiApiKey,
          dashscopeApiKey,
          image: variation.imageUrl?.startsWith('data:')
            ? variation.imageUrl.split(',')[1]
            : base64,
          mimeType: uploadedImage.file.type,
          analysis,
          variationDescription: `${variation.description}\n\nEDIT REQUEST: ${editPromptUsed}`,
          aspectRatio: uploadedImage.aspectRatio,
          isEdit: true,
          model: selectedAIModel,
          quality: imageQuality,
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
          const newVersions: ImageVersion[] = [...v.versions, { imageUrl, prompt: editPromptUsed, parentIndex: v.currentVersionIndex, status: 'completed' as const }];
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
      track('image_generated', { tool: 'edit' });
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

    // Store the prompt before clearing it
    const editPromptUsed = originalEditPrompt.trim();
    setOriginalEditPrompt('');

    try {
      // Determine which image to edit based on currently selected size
      let currentImageUrl: string | null;
      let aspectRatioToUse: string;

      if (viewingOriginalResizedSize) {
        // Editing a resized version
        const resizedVersion = originalResizedVersions.find(r => r.size === viewingOriginalResizedSize);
        if (!resizedVersion?.imageUrl) {
          console.error('Resized version not found');
          return;
        }
        currentImageUrl = resizedVersion.imageUrl;
        aspectRatioToUse = viewingOriginalResizedSize;
      } else {
        // Editing the original - only allow editing completed versions
        const currentVersion = originalVersions.length > 0 ? originalVersions[originalVersionIndex] : null;
        if (currentVersion && currentVersion.status !== 'completed') {
          console.error('Cannot edit a processing version');
          return;
        }
        currentImageUrl = currentVersion?.imageUrl || uploadedImage.url;
        aspectRatioToUse = uploadedImage.aspectRatio;
      }

      if (!currentImageUrl) {
        console.error('No image URL available');
        return;
      }

      // Convert image URL to base64 if it's a data URL, otherwise fetch and convert
      let imageToEdit: string;
      if (currentImageUrl.startsWith('data:')) {
        imageToEdit = currentImageUrl.split(',')[1];
      } else {
        const base64 = await fileToBase64(uploadedImage.file);
        imageToEdit = base64;
      }

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

      // Find selected edit reference (if any)
      const selectedRef = editReferences.find(r => r.id === selectedEditRef);

      // Determine which models to use
      const modelsToUse = isCompareModelsEnabled && selectedModelsForCompare.length > 1
        ? selectedModelsForCompare
        : [selectedAIModel];

      // For non-resized edits, immediately add processing versions for all models
      let newVersionIndices: number[] = [];
      if (!viewingOriginalResizedSize) {
        const currentVersions: ImageVersion[] = originalVersions.length === 0
          ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
          : originalVersions;

        const processingVersions: ImageVersion[] = modelsToUse.map(model => ({
          imageUrl: null,
          prompt: modelsToUse.length > 1 ? `${editPromptUsed} [${getModelDisplayName(model)}]` : editPromptUsed,
          parentIndex: originalVersionIndex,
          status: 'processing' as const
        }));

        const newVersions = [...currentVersions, ...processingVersions];
        newVersionIndices = processingVersions.map((_, idx) => currentVersions.length + idx);
        setOriginalVersions(newVersions);
        // Don't auto-switch to the processing version - user can continue working
      }

      // Run generation(s) - parallel if multiple models
      const generateForModel = async (model: AIModel, versionIndex: number | null) => {
        const apiKeys = getApiKeysForModel(model);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...apiKeys,
            image: imageToEdit,
            mimeType: uploadedImage.file.type,
            analysis: analysisToUse,
            variationDescription: `EDIT REQUEST: ${editPromptUsed}`,
            aspectRatio: aspectRatioToUse,
            isEdit: true,
            model,
            quality: imageQuality,
            // Include edit reference if selected
            ...(selectedRef && {
              editRefImage: selectedRef.base64,
              editRefMimeType: selectedRef.mimeType,
            }),
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
          } else if (versionIndex !== null) {
            // Update the processing version with the completed image
            setOriginalVersions(prev => prev.map((v, idx) =>
              idx === versionIndex
                ? { ...v, imageUrl: newImageUrl, status: 'completed' as const }
                : v
            ));
          }
          track('image_generated', { tool: 'edit' });
          if (selectedRef) {
            track('reference_image_used', { tool: 'edit' });
          }
        } else {
          // Mark version as error
          if (versionIndex !== null) {
            setOriginalVersions(prev => prev.map((v, idx) =>
              idx === versionIndex
                ? { ...v, status: 'error' as const }
                : v
            ));
          }
        }
      };

      // Execute generations
      await Promise.allSettled(
        modelsToUse.map((model, idx) =>
          generateForModel(model, newVersionIndices[idx] ?? null)
        )
      );
    } catch (err) {
      console.error('Original edit error:', err);
    }
  };

  // Handle locale change
  const handleLocaleChange = (newLocale: Locale) => {
    // Set a cookie to persist the locale preference
    document.cookie = `NEXT_LOCALE=${newLocale}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
    // Use next-intl's router which handles locale prefixes correctly
    intlRouter.replace(intlPathname, { locale: newLocale });
  };

  // Apply presets to the current image
  const handleApplyPresets = async () => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }
    if (!apiKey && !openaiApiKey && !dashscopeApiKey) {
      setShowApiKeySetup(true);
      return;
    }

    // Build combined prompt from selected presets
    const prompts: string[] = [];
    const presetNames: string[] = [];

    // Helper to add preset if selected
    const addPreset = (category: keyof typeof PRESETS, selected: string | null) => {
      if (selected) {
        const preset = PRESETS[category].find(p => p.id === selected);
        if (preset) {
          prompts.push(preset.prompt);
          presetNames.push(preset.name);
        }
      }
    };

    addPreset('lighting', selectedPresets.lighting);
    addPreset('style', selectedPresets.style);
    addPreset('mood', selectedPresets.mood);
    addPreset('color', selectedPresets.color);
    addPreset('era', selectedPresets.era);
    addPreset('camera', selectedPresets.camera);
    addPreset('framing', selectedPresets.framing);
    addPreset('rotation', selectedPresets.rotation);
    addPreset('enhance', selectedPresets.enhance);

    if (prompts.length === 0) return;

    // Build preset label for the version history
    const presetLabel = presetNames.filter(Boolean).join(' + ') + ' [preset]';

    // Clear selections immediately
    setSelectedPresets({ lighting: null, style: null, mood: null, color: null, era: null, camera: null, framing: null, rotation: null, enhance: null });

    try {
      // Get current image to edit - only from completed versions
      const currentVersion = originalVersions.length > 0 ? originalVersions[originalVersionIndex] : null;
      if (currentVersion && currentVersion.status !== 'completed') {
        console.error('Cannot apply preset to a processing version');
        return;
      }
      const currentImageUrl = currentVersion?.imageUrl || uploadedImage.url;

      if (!currentImageUrl) {
        console.error('No image URL available');
        return;
      }

      // Convert to base64
      let imageToEdit: string;
      if (currentImageUrl.startsWith('data:')) {
        imageToEdit = currentImageUrl.split(',')[1];
      } else {
        const base64 = await fileToBase64(uploadedImage.file);
        imageToEdit = base64;
      }

      // Determine which models to use
      const modelsToUse = isCompareModelsEnabled && selectedModelsForCompare.length > 1
        ? selectedModelsForCompare
        : [selectedAIModel];

      // Immediately add processing versions for all models
      const currentVersions: ImageVersion[] = originalVersions.length === 0
        ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
        : originalVersions;

      const processingVersions: ImageVersion[] = modelsToUse.map(model => ({
        imageUrl: null,
        prompt: modelsToUse.length > 1 ? `${presetLabel} [${getModelDisplayName(model)}]` : presetLabel,
        parentIndex: originalVersionIndex,
        status: 'processing' as const
      }));

      const newVersionIndices = processingVersions.map((_, idx) => currentVersions.length + idx);
      setOriginalVersions([...currentVersions, ...processingVersions]);

      const combinedPrompt = prompts.join('. ');

      const analysisToUse = analysis || {
        product: 'Image',
        brand_style: 'Not specified',
        visual_elements: [],
        key_selling_points: [],
        target_audience: 'General',
        colors: [],
        mood: 'Not specified',
      };

      // Run generation for each model
      const generateForModel = async (model: AIModel, versionIndex: number) => {
        const apiKeys = getApiKeysForModel(model);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...apiKeys,
            image: imageToEdit,
            mimeType: uploadedImage.file.type,
            analysis: analysisToUse,
            variationDescription: `PRESET APPLICATION: ${combinedPrompt}`,
            aspectRatio: uploadedImage.aspectRatio,
            isEdit: true,
            model,
            quality: imageQuality,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newImageUrl = data.imageUrl;

          // Update the processing version with the completed image
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === versionIndex
              ? { ...v, imageUrl: newImageUrl, status: 'completed' as const }
              : v
          ));
          track('image_generated', { tool: 'edit' });
        } else {
          // Mark version as error
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === versionIndex
              ? { ...v, status: 'error' as const }
              : v
          ));
        }
      };

      // Execute generations in parallel
      await Promise.allSettled(
        modelsToUse.map((model, idx) => generateForModel(model, newVersionIndices[idx]))
      );
    } catch (err) {
      console.error('Preset apply error:', err);
    }
  };

  // Apply a background change with background-scoped prompt
  const handleApplyBackgroundChange = async (prompt: string, label: string) => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }
    if (!apiKey && !openaiApiKey && !dashscopeApiKey) {
      setShowApiKeySetup(true);
      return;
    }

    // Build background label for version history
    const backgroundLabel = `[background] ${label}`;

    // Compute values BEFORE state update (React 18+ batches state updates)
    const currentVersions: ImageVersion[] = originalVersions.length === 0
      ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
      : originalVersions;

    const safeIndex = Math.min(originalVersionIndex, currentVersions.length - 1);
    const currentVersion = currentVersions[safeIndex] || currentVersions[0];

    // Only allow editing completed versions
    if (!currentVersion || currentVersion.status !== 'completed') {
      return;
    }

    const imageToUse = currentVersion.imageUrl || uploadedImage.url;

    // Determine which models to use
    const modelsToUse = isCompareModelsEnabled && selectedModelsForCompare.length > 1
      ? selectedModelsForCompare
      : [selectedAIModel];

    // Add processing versions for all models
    const processingVersions: ImageVersion[] = modelsToUse.map(model => ({
      imageUrl: null,
      prompt: modelsToUse.length > 1 ? `${backgroundLabel} [${getModelDisplayName(model)}]` : backgroundLabel,
      parentIndex: safeIndex,
      status: 'processing' as const
    }));

    const newVersionIndices = processingVersions.map((_, idx) => currentVersions.length + idx);
    setOriginalVersions([...currentVersions, ...processingVersions]);

    try {
      // Convert image to base64 - use File directly if available (avoids blob URL fetch issues)
      let base64: string;
      let mimeType: string;

      if (imageToUse === uploadedImage.url && uploadedImage.file) {
        // Use the original file directly - more reliable than fetching blob URL
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(uploadedImage.file);
        });
        mimeType = uploadedImage.file.type;
      } else {
        // Fetch the image (works for data URLs from API responses)
        const imageResponse = await fetch(imageToUse);
        const blob = await imageResponse.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
        mimeType = blob.type;
      }

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

      // Get selected reference image if any
      const selectedBgRef = backgroundReferences.find(r => r.id === selectedBackgroundRef);

      // Run generation for each model
      const generateForModel = async (model: AIModel, versionIndex: number) => {
        const apiKeys = getApiKeysForModel(model);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...apiKeys,
            image: base64,
            mimeType: mimeType,
            analysis: analysisToUse,
            variationDescription: prompt,
            aspectRatio: uploadedImage.aspectRatio,
            isEdit: true,
            isBackgroundOnly: true,
            model,
            quality: imageQuality,
            // Include reference image if selected
            ...(selectedBgRef && {
              backgroundRefImage: selectedBgRef.base64,
              backgroundRefMimeType: selectedBgRef.mimeType,
            }),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === versionIndex
              ? { ...v, imageUrl: data.imageUrl, status: 'completed' as const }
              : v
          ));
          track('image_generated', { tool: 'background' });
          if (selectedBgRef) {
            track('reference_image_used', { tool: 'background' });
          }
        } else {
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === versionIndex
              ? { ...v, status: 'error' as const }
              : v
          ));
        }
      };

      // Execute generations in parallel
      await Promise.allSettled(
        modelsToUse.map((model, idx) => generateForModel(model, newVersionIndices[idx]))
      );
    } catch (err) {
      console.error('Background change error:', err);
      // Mark all processing versions as error
      setOriginalVersions(prev => prev.map((v, idx) =>
        newVersionIndices.includes(idx) && v.status === 'processing'
          ? { ...v, status: 'error' as const }
          : v
      ));
    }
  };

  // Remove background using client-side AI (rembg-webgpu)
  const handleRemoveBackground = async () => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }

    // Compute values BEFORE state update
    const currentVersions: ImageVersion[] = originalVersions.length === 0
      ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
      : originalVersions;

    const safeIndex = Math.min(originalVersionIndex, currentVersions.length - 1);
    const currentVersion = currentVersions[safeIndex] || currentVersions[0];

    // Only allow editing completed versions
    if (!currentVersion || currentVersion.status !== 'completed') {
      return;
    }

    const imageToUse = currentVersion.imageUrl || uploadedImage.url;
    const newVersionIndex = currentVersions.length;

    // Add processing version to state
    const processingVersion: ImageVersion = {
      imageUrl: null,
      prompt: '[background] Remove Background',
      parentIndex: safeIndex,
      status: 'processing'
    };

    setOriginalVersions([...currentVersions, processingVersion]);
    setIsRemovingBackground(true);
    setBgRemovalProgress({ phase: 'idle', progress: 0 });

    try {
      const result = await removeImageBackground(imageToUse, (progress) => {
        setBgRemovalProgress(progress);
      });

      // Create data URL from the result
      const dataUrl = `data:image/png;base64,${result.base64}`;

      // Update version with completed image
      setOriginalVersions(prev => prev.map((v, idx) =>
        idx === newVersionIndex
          ? { ...v, imageUrl: dataUrl, status: 'completed' as const }
          : v
      ));

      track('image_generated', { tool: 'background' });
      toast.success(`Background removed in ${result.processingTimeSeconds.toFixed(1)}s`);
    } catch (err) {
      console.error('Background removal error:', err);
      setOriginalVersions(prev => prev.map((v, idx) =>
        idx === newVersionIndex
          ? { ...v, status: 'error' as const }
          : v
      ));
      toast.error('Failed to remove background. Your browser may not support this feature.');
    } finally {
      setIsRemovingBackground(false);
      setBgRemovalProgress(null);
    }
  };

  // Generate AI background suggestions based on current image
  const handleGenerateBackgroundSuggestions = async () => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    setIsLoadingBackgroundSuggestions(true);

    try {
      // Get current image URL - use File directly if available
      const currentVersion = originalVersions.length > 0 ? originalVersions[originalVersionIndex] : null;
      const imageUrl = currentVersion?.imageUrl || uploadedImage.url;

      let base64: string;
      let mimeType: string;

      if (imageUrl === uploadedImage.url && uploadedImage.file) {
        // Use the original file directly
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(uploadedImage.file);
        });
        mimeType = uploadedImage.file.type;
      } else {
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
        mimeType = blob.type;
      }

      // Use analysis if available for better suggestions
      const analysisToUse = analysis || {
        product: 'Unknown',
        brand_style: 'Not specified',
        target_audience: 'General',
        mood: 'Not specified',
      };

      // Pass existing suggestion names to avoid duplicates
      const existingSuggestionNames = backgroundSuggestions.map(s => s.name);

      const response = await fetch('/api/suggest-backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          image: base64,
          mimeType: mimeType,
          analysis: analysisToUse,
          existingSuggestions: existingSuggestionNames,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Append new suggestions to existing ones
        setBackgroundSuggestions(prev => [...prev, ...(data.suggestions || [])]);
      }
    } catch (err) {
      console.error('Background suggestions error:', err);
    } finally {
      setIsLoadingBackgroundSuggestions(false);
    }
  };

  // Apply model change - similar to background change but for model only
  const handleApplyModelChange = async (prompt: string, label: string) => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }
    if (!apiKey && !openaiApiKey && !dashscopeApiKey) {
      setShowApiKeySetup(true);
      return;
    }

    // Build model label for version history
    const modelLabel = `[model] ${label}`;

    // Compute values BEFORE state update (React 18+ batches state updates)
    const currentVersions: ImageVersion[] = originalVersions.length === 0
      ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
      : originalVersions;

    const safeIndex = Math.min(originalVersionIndex, currentVersions.length - 1);
    const currentVersion = currentVersions[safeIndex] || currentVersions[0];

    if (!currentVersion || currentVersion.status !== 'completed') {
      return;
    }

    const imageToUse = currentVersion.imageUrl || uploadedImage.url;

    // Determine which models to use
    const modelsToUse = isCompareModelsEnabled && selectedModelsForCompare.length > 1
      ? selectedModelsForCompare
      : [selectedAIModel];

    // Add processing versions for all models
    const processingVersions: ImageVersion[] = modelsToUse.map(model => ({
      imageUrl: null,
      prompt: modelsToUse.length > 1 ? `${modelLabel} [${getModelDisplayName(model)}]` : modelLabel,
      parentIndex: safeIndex,
      status: 'processing' as const
    }));

    const newVersionIndices = processingVersions.map((_, idx) => currentVersions.length + idx);
    setOriginalVersions([...currentVersions, ...processingVersions]);

    try {
      // Convert image to base64 - use File directly if available (avoids blob URL fetch issues)
      let base64: string;
      let mimeType: string;

      if (imageToUse === uploadedImage.url && uploadedImage.file) {
        // Use the original file directly - more reliable than fetching blob URL
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(uploadedImage.file);
        });
        mimeType = uploadedImage.file.type;
      } else {
        // Fetch the image (works for data URLs from API responses)
        const imageResponse = await fetch(imageToUse);
        const blob = await imageResponse.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
        mimeType = blob.type;
      }

      const analysisToUse = analysis || {
        product: 'Image',
        brand_style: 'Not specified',
        visual_elements: [],
        key_selling_points: [],
        target_audience: 'General',
        colors: [],
        mood: 'Not specified',
      };

      // Get selected reference image if any
      const selectedModelReference = modelReferences.find(r => r.id === selectedModelRef);

      // Run generation for each model
      const generateForModel = async (model: AIModel, versionIndex: number) => {
        const apiKeys = getApiKeysForModel(model);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...apiKeys,
            image: base64,
            mimeType: mimeType,
            analysis: analysisToUse,
            variationDescription: prompt,
            aspectRatio: uploadedImage.aspectRatio,
            isEdit: true,
            isModelOnly: true,
            keepClothing: keepClothing,
            model,
            quality: imageQuality,
            // Include reference image if selected
            ...(selectedModelReference && {
              modelRefImage: selectedModelReference.base64,
              modelRefMimeType: selectedModelReference.mimeType,
            }),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === versionIndex
              ? { ...v, imageUrl: data.imageUrl, status: 'completed' as const }
              : v
          ));
          track('image_generated', { tool: 'model' });
          if (selectedModelReference) {
            track('reference_image_used', { tool: 'model' });
          }
        } else {
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === versionIndex
              ? { ...v, status: 'error' as const }
              : v
          ));
        }
      };

      // Execute generations in parallel
      await Promise.allSettled(
        modelsToUse.map((model, idx) => generateForModel(model, newVersionIndices[idx]))
      );
    } catch (err) {
      console.error('Model change error:', err);
      // Mark all processing versions as error
      setOriginalVersions(prev => prev.map((v, idx) =>
        newVersionIndices.includes(idx) && v.status === 'processing'
          ? { ...v, status: 'error' as const }
          : v
      ));
    }
  };

  // Generate AI model suggestions based on current image
  const handleGenerateModelSuggestions = async () => {
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    setIsLoadingModelSuggestions(true);

    try {
      const currentVersion = originalVersions.length > 0 ? originalVersions[originalVersionIndex] : null;
      const imageUrl = currentVersion?.imageUrl || uploadedImage.url;

      let base64: string;
      let mimeType: string;

      if (imageUrl === uploadedImage.url && uploadedImage.file) {
        // Use the original file directly
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(uploadedImage.file);
        });
        mimeType = uploadedImage.file.type;
      } else {
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
        mimeType = blob.type;
      }

      const analysisToUse = analysis || {
        product: 'Unknown',
        brand_style: 'Not specified',
        target_audience: 'General',
        mood: 'Not specified',
      };

      // Pass existing suggestion names to avoid duplicates
      const existingSuggestionNames = modelSuggestions.map(s => s.name);

      const response = await fetch('/api/suggest-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          image: base64,
          mimeType: mimeType,
          analysis: analysisToUse,
          existingSuggestions: existingSuggestionNames,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Append new suggestions to existing ones
        setModelSuggestions(prev => [...prev, ...(data.suggestions || [])]);
      }
    } catch (err) {
      console.error('Model suggestions error:', err);
    } finally {
      setIsLoadingModelSuggestions(false);
    }
  };

  // Apply model builder selections
  const handleApplyModelBuilder = () => {
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }

    const parts: string[] = [];

    if (selectedGender && selectedGender !== 'any') {
      parts.push(MODEL_OPTIONS.gender.find(g => g.id === selectedGender)?.label || '');
    }
    if (selectedAgeRange) {
      parts.push(MODEL_OPTIONS.ageRange.find(a => a.id === selectedAgeRange)?.label || '');
    }
    if (selectedEthnicity) {
      parts.push(MODEL_OPTIONS.ethnicity.find(e => e.id === selectedEthnicity)?.label || '');
    }
    if (selectedBodyType) {
      parts.push(`${MODEL_OPTIONS.bodyType.find(b => b.id === selectedBodyType)?.label || ''} build`);
    }
    if (selectedHairColor || selectedHairType) {
      const hairParts: string[] = [];
      if (selectedHairColor) hairParts.push(MODEL_OPTIONS.hairColor.find(h => h.id === selectedHairColor)?.label || '');
      if (selectedHairType) hairParts.push(MODEL_OPTIONS.hairType.find(h => h.id === selectedHairType)?.label?.toLowerCase() || '');
      parts.push(`${hairParts.join(' ')} hair`);
    }
    if (selectedExpression) {
      parts.push(`${MODEL_OPTIONS.expression.find(e => e.id === selectedExpression)?.label || ''} expression`);
    }
    if (selectedVibe) {
      parts.push(`${MODEL_OPTIONS.vibe.find(v => v.id === selectedVibe)?.label || ''} vibe`);
    }

    const prompt = parts.filter(Boolean).join(', ');
    if (prompt) {
      handleApplyModelChange(prompt, prompt);
    }
  };

  // Clear all model builder selections
  const clearModelSelections = () => {
    setSelectedGender(null);
    setSelectedAgeRange(null);
    setSelectedEthnicity(null);
    setSelectedHairColor(null);
    setSelectedHairType(null);
    setSelectedBodyType(null);
    setSelectedExpression(null);
    setSelectedVibe(null);
  };

  // Handle background reference image upload
  const handleBackgroundRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];

      const newRef: ReferenceImage = {
        id: `bg-ref-${Date.now()}`,
        url: dataUrl,
        base64,
        mimeType: file.type,
        name: file.name,
        type: 'background',
      };

      setBackgroundReferences(prev => [...prev, newRef]);
      setSelectedBackgroundRef(newRef.id);
      setBackgroundCustomPrompt(t('modelBuilder.useBackgroundFromReference'));
      track('reference_image_uploaded', { tool: 'background' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle model reference image upload
  const handleModelRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];

      const newRef: ReferenceImage = {
        id: `model-ref-${Date.now()}`,
        url: dataUrl,
        base64,
        mimeType: file.type,
        name: file.name,
        type: 'model',
      };

      setModelReferences(prev => [...prev, newRef]);
      setSelectedModelRef(newRef.id);
      setModelCustomPrompt(t('modelBuilder.usePersonFromReference'));
      track('reference_image_uploaded', { tool: 'model' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle edit reference image upload
  const handleEditRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];

      const newRef: ReferenceImage = {
        id: `edit-ref-${Date.now()}`,
        url: dataUrl,
        base64,
        mimeType: file.type,
        name: file.name,
        type: 'edit',
      };

      setEditReferences(prev => [...prev, newRef]);
      setSelectedEditRef(newRef.id);
      track('reference_image_uploaded', { tool: 'edit' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
      versions: [{ imageUrl: currentVersionImage, prompt: null, parentIndex: -1, status: 'completed' as const }],
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
          apiKey,
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
      track('image_generated', { tool: 'resize' });
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
    if (!uploadedImage) {
      toast.info(t('common.uploadFirst'));
      return;
    }

    // Get the current image to resize (either original or edited version)
    const currentImageUrl = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.imageUrl
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
          apiKey,
          image: imageData,
          mimeType: 'image/png',
          targetWidth: size.width,
          targetHeight: size.height,
          targetRatio: size.name,
          // Send original dimensions so API can determine extend vs crop strategy
          originalWidth: uploadedImage.width,
          originalHeight: uploadedImage.height,
          analysis,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalResizedVersions(prev =>
          prev.map(r => r.size === size.name ? { ...r, status: 'completed', imageUrl: data.imageUrl } : r)
        );
        track('image_generated', { tool: 'resize' });
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

  const handleNewClick = () => {
    // If there's an existing image, show confirmation modal
    if (uploadedImage) {
      setShowNewConfirmModal(true);
    }
    // Otherwise, just proceed with reset
  };

  const handleReset = () => {
    if (uploadedImage?.url) URL.revokeObjectURL(uploadedImage.url);
    // Stay in editor mode, just clear the image
    setUploadedImage(null);
    setAnalysis(null);
    setVariations([]);
    setSelectedVariationId(null);
    setViewingResizedSize(null);
    setError(null);
    setCustomPrompt('');
    setAdditionalContext('');
    // Reset base versions and editing state
    setOriginalEditPrompt('');
    setBaseVersions([]);
    setActiveBaseId('original');
    setViewingOriginalResizedSize(null);
    setSelectedTool('edit');
    setShowNewConfirmModal(false);
  };

  const handleDownload = async (imageUrl: string, filename: string, trackAs?: 'single' | 'batch' | 'all_sizes') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statickit-${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      if (trackAs) {
        track('image_downloaded', { type: trackAs });
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Comparison mode handlers
  const handleToggleCompare = () => {
    if (isCompareMode) {
      // Exit comparison mode
      setIsCompareMode(false);
      setCompareLeftIndex(null);
      setCompareRightIndex(null);
    } else {
      // Enter comparison mode
      setIsCompareMode(true);
      setCompareLeftIndex(originalVersionIndex); // Lock current as reference (LEFT)

      // Auto-select adjacent version for RIGHT side
      if (originalVersionIndex < originalVersions.length - 1) {
        setCompareRightIndex(originalVersionIndex + 1); // Next version
      } else if (originalVersionIndex > 0) {
        setCompareRightIndex(originalVersionIndex - 1); // Previous version
      }

      track('tool_used', { tool: 'compare' });
    }
  };

  const handleCompareSelectRight = (index: number) => {
    if (index !== compareLeftIndex) {
      setCompareRightIndex(index);
    }
  };

  const exitCompareMode = () => {
    setIsCompareMode(false);
    setCompareLeftIndex(null);
    setCompareRightIndex(null);
  };

  // Create a new base version from the current image
  // This adds a new card to the sidebar with its own fresh edit history
  const handleCreateVersion = (imageUrl: string, sourceLabel: string) => {
    const newBaseId = `base-${Date.now()}`;
    const versionNumber = baseVersions.length; // 0 is original, so this gives us 1, 2, 3...

    const newBaseVersion: BaseVersion = {
      id: newBaseId,
      name: `Version ${versionNumber}`,
      baseImageUrl: imageUrl,
      sourceLabel: sourceLabel,
      versions: [{ imageUrl, prompt: null, parentIndex: -1, status: 'completed' as const }],
      currentVersionIndex: 0,
      resizedVersions: [],
    };

    // Add new base version to the list
    setBaseVersions(prev => [...prev, newBaseVersion]);

    // Switch to the new base version
    setActiveBaseId(newBaseId);

    // Switch to viewing original (non-generated) to show the new version
    setSelectedVariationId(null);

    // Switch to Versions tool so user sees where the new version is
    setSelectedTool('iterations');

    // Show confirmation toast
    toast.success(`Version ${versionNumber} created`, {
      description: 'Find it in the Versions panel on the left',
      duration: 3000,
    });
  };

  // Delete the current version and navigate to the previous one
  const handleDeleteVersion = () => {
    // Exit compare mode if deleting one of the comparison versions
    if (isCompareMode && (originalVersionIndex === compareLeftIndex || originalVersionIndex === compareRightIndex)) {
      exitCompareMode();
    }

    const isOriginalBase = activeBaseId === 'original';

    // If we're at index 0 (the base image of this version)
    if (originalVersionIndex === 0) {
      if (isOriginalBase) {
        // Deleting original base - check if we can reset
        const hasEdits = originalVersions.length > 1;
        const hasOtherVersions = baseVersions.some(b => b.id !== 'original');
        const hasVariations = variations.length > 0;

        if (!hasEdits && !hasOtherVersions && !hasVariations) {
          // No other work - safe to delete and reset
          handleReset();
          toast.success('Image deleted');
        }
        return;
      } else {
        // Deleting a non-original base version - delete the whole version
        handleDeleteBaseVersion(activeBaseId);
        return;
      }
    }

    // Deleting an edit (not the base image)
    setOriginalVersions(prev => {
      const newVersions = prev.filter((_, idx) => idx !== originalVersionIndex);
      return newVersions;
    });

    // Navigate to previous version
    setOriginalVersionIndex(Math.max(0, originalVersionIndex - 1));
    toast.success('Edit deleted');
  };

  // Delete a base version from the Versions panel
  const handleDeleteBaseVersion = (baseId: string) => {
    const isOriginal = baseId === 'original';

    if (isOriginal) {
      // Deleting original - check if we can reset
      const hasEdits = originalVersions.length > 1;
      const hasOtherVersions = baseVersions.some(b => b.id !== 'original');
      const hasVariations = variations.length > 0;

      if (!hasEdits && !hasOtherVersions && !hasVariations) {
        // Safe to delete - reset to empty state
        handleReset();
        toast.success('Image deleted');
      }
      return;
    }

    // Deleting a non-original version
    setBaseVersions(prev => prev.filter(b => b.id !== baseId));

    // If we were viewing this version, switch to original
    if (activeBaseId === baseId) {
      setActiveBaseId('original');
    }

    toast.success('Version deleted');
  };

  // Check if a base version can be deleted
  const canDeleteBaseVersion = (baseId: string) => {
    const isOriginal = baseId === 'original';

    if (isOriginal) {
      // Original can only be deleted if there's no other work
      const hasEdits = originalVersions.length > 1;
      const hasOtherVersions = baseVersions.some(b => b.id !== 'original');
      const hasVariations = variations.length > 0;
      return !hasEdits && !hasOtherVersions && !hasVariations;
    }

    // Non-original versions can always be deleted
    return true;
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

    // Add all versions (filter out null imageUrls from processing versions)
    variation.versions.forEach((version, idx) => {
      if (version.imageUrl) {
        downloads.push({ url: version.imageUrl, name: `${variation.title}_v${idx + 1}.png` });
      }
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
    track('image_downloaded', { type: 'batch' });
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
    if (!currentVersion || !currentVersion.imageUrl) return;

    track('image_downloaded', { type: 'all_sizes' });
    // Download current version
    await handleDownload(currentVersion.imageUrl, `${variation.title}_v${variation.currentVersionIndex + 1}.png`);

    // Download all completed resizes
    for (const resize of variation.resizedVersions.filter(r => r.status === 'completed' && r.imageUrl)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await handleDownload(resize.imageUrl!, `${variation.title}_v${variation.currentVersionIndex + 1}_${resize.size}.png`);
    }
  };

  const completedCount = variations.filter(v => v.status === 'completed').length;
  const generatingCount = variations.filter(v => v.status === 'generating').length;

  // Helper to check if API key is configured
  const requireApiKey = (action: () => void) => {
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }
    action();
  };

  // Show loading while checking API key
  if (!isApiKeyLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Left section: Logo and mobile slider button */}
          <div className="flex items-center gap-2">
            {/* Mobile: Slider panel button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Open edits drawer"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            {/* Logo - far left */}
            <button onClick={uploadedImage ? () => setShowNewConfirmModal(true) : handleReset} className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
              <svg className="w-8 h-8 text-foreground" viewBox="0 0 101 101" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M59.9691 26.3024C59.9691 28.6266 61.8532 30.5107 64.1774 30.5107C66.5016 30.5107 68.3857 28.6266 68.3857 26.3024C68.3857 23.9782 66.5016 22.0941 64.1774 22.0941C61.8532 22.0941 59.9691 23.9782 59.9691 26.3024Z"/>
                <path d="M74.6982 26.3024C74.6982 28.6266 76.5824 30.5107 78.9066 30.5107C81.2308 30.5107 83.1149 28.6266 83.1149 26.3024C83.1149 23.9782 81.2308 22.0941 78.9066 22.0941C76.5824 22.0941 74.6982 23.9782 74.6982 26.3024Z"/>
                <path d="M59.9691 74.6982C59.9691 77.0224 61.8532 78.9066 64.1774 78.9066C66.5016 78.9066 68.3857 77.0224 68.3857 74.6982C68.3857 72.374 66.5016 70.4899 64.1774 70.4899C61.8532 70.4899 59.9691 72.374 59.9691 74.6982Z"/>
                <path d="M61.0212 13.6774C61.0212 15.4206 62.4343 16.8337 64.1774 16.8337C65.9206 16.8337 67.3337 15.4206 67.3337 13.6774C67.3337 11.9343 65.9206 10.5212 64.1774 10.5212C62.4343 10.5212 61.0212 11.9343 61.0212 13.6774Z"/>
                <path d="M87.3232 42.0837C87.3232 43.8268 88.7363 45.2399 90.4795 45.2399C92.2226 45.2399 93.6357 43.8268 93.6357 42.0837C93.6357 40.3405 92.2226 38.9274 90.4795 38.9274C88.7363 38.9274 87.3232 40.3405 87.3232 42.0837Z"/>
                <path d="M87.3232 58.917C87.3232 60.6601 88.7363 62.0732 90.4795 62.0732C92.2226 62.0732 93.6357 60.6601 93.6357 58.917C93.6357 57.1738 92.2226 55.7607 90.4795 55.7607C88.7363 55.7607 87.3232 57.1738 87.3232 58.917Z"/>
                <path d="M61.0212 87.3232C61.0212 89.0664 62.4343 90.4795 64.1774 90.4795C65.9206 90.4795 67.3337 89.0664 67.3337 87.3232C67.3337 85.5801 65.9206 84.167 64.1774 84.167C62.4343 84.167 61.0212 85.5801 61.0212 87.3232Z"/>
                <path d="M57.8649 42.0837C57.8649 45.57 60.6911 48.3962 64.1774 48.3962C67.6637 48.3962 70.4899 45.57 70.4899 42.0837C70.4899 38.5974 67.6637 35.7712 64.1774 35.7712C60.6911 35.7712 57.8649 38.5974 57.8649 42.0837Z"/>
                <path d="M57.8649 58.917C57.8649 62.4033 60.6911 65.2295 64.1774 65.2295C67.6637 65.2295 70.4899 62.4033 70.4899 58.917C70.4899 55.4307 67.6637 52.6045 64.1774 52.6045C60.6911 52.6045 57.8649 55.4307 57.8649 58.917Z"/>
                <path d="M74.6982 42.0837C74.6982 44.4079 76.5824 46.292 78.9066 46.292C81.2308 46.292 83.1149 44.4079 83.1149 42.0837C83.1149 39.7595 81.2308 37.8753 78.9066 37.8753C76.5824 37.8753 74.6982 39.7595 74.6982 42.0837Z"/>
                <path d="M74.6982 58.917C74.6982 61.2412 76.5824 63.1253 78.9066 63.1253C81.2308 63.1253 83.1149 61.2412 83.1149 58.917C83.1149 56.5928 81.2308 54.7087 78.9066 54.7087C76.5824 54.7087 74.6982 56.5928 74.6982 58.917Z"/>
                <path d="M74.6982 74.6982C74.6982 77.0224 76.5824 78.9066 78.9066 78.9066C81.2308 78.9066 83.1149 77.0224 83.1149 74.6982C83.1149 72.374 81.2308 70.4899 78.9066 70.4899C76.5824 70.4899 74.6982 72.374 74.6982 74.6982Z"/>
                <path d="M50.5003 8.41699C52.2435 8.41699 53.6566 9.83009 53.6566 11.5732V89.4274C53.6566 91.1706 52.2435 92.5837 50.5003 92.5837C27.2583 92.5837 8.41699 73.7423 8.41699 50.5003C8.41699 27.2583 27.2583 8.41699 50.5003 8.41699Z"/>
              </svg>
              <span className="text-lg">StaticKit</span>
            </button>
          </div>

          {/* Right: Hamburger Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors">
                  <Menu className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* API Key */}
                <DropdownMenuItem onClick={() => setShowApiKeySetup(true)} className="cursor-pointer group">
                  <Key className={`w-4 h-4 ${apiKey ? 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-300' : ''}`} />
                  <span>{t('nav.apiKeys')}</span>
                  {apiKey && (
                    <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-300">{t('nav.apiKeysActive')}</span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Keyboard Shortcuts Section */}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 font-normal flex items-center gap-1.5">
                  <Keyboard className="w-3 h-3" />
                  {t('nav.shortcuts')}
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t('nav.selectTool')}</span>
                    <span className="text-muted-foreground/60">1 - 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('nav.navigateVersions')}</span>
                    <span className="text-muted-foreground/60">← →</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('nav.deleteVersion')}</span>
                    <span className="text-muted-foreground/60">⌫</span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Links */}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a
                    href="https://github.com/coreyrab/statickit"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    <span>{t('nav.github')}</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Theme Toggle */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{t('nav.theme')}</span>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-colors ${
                        theme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-colors ${
                        theme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-colors ${
                        theme === 'system' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Language Selector */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{t('nav.language')}</span>
                    <span className="text-xs text-muted-foreground/60">{LANGUAGES[locale].flag}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {routing.locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className={`flex items-center justify-center p-1.5 rounded-md transition-colors text-xs ${
                          locale === loc ? 'bg-background shadow-sm font-medium' : 'hover:bg-muted'
                        }`}
                        title={LANGUAGES[loc].name}
                      >
                        {LANGUAGES[loc].flag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Storage Indicator */}
                {uploadedImage && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className={`w-3.5 h-3.5 ${
                            isSessionVeryLarge ? 'text-red-500' :
                            isSessionLarge ? 'text-amber-500' :
                            'text-muted-foreground'
                          }`} />
                          <span className="text-xs text-muted-foreground">{t('session.sessionStorage')}</span>
                        </div>
                        <span className={`text-xs ${
                          isSessionVeryLarge ? 'text-red-500 font-medium' :
                          isSessionLarge ? 'text-amber-500' :
                          'text-muted-foreground/60'
                        }`}>
                          {isSessionSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : (
                            sessionSizeFormatted
                          )}
                        </span>
                      </div>
                      {isSessionLarge && (
                        <p className={`text-[10px] mt-1 ${isSessionVeryLarge ? 'text-red-400' : 'text-amber-400'}`}>
                          {isSessionVeryLarge
                            ? 'Session very large - consider clearing'
                            : 'Session getting large'}
                        </p>
                      )}
                      <button
                        onClick={handleClearSession}
                        className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-md hover:bg-muted transition-colors text-left"
                      >
                        {t('session.clearSession')}
                      </button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden touch-none"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Interface */}
      <main className="flex-1 flex flex-col md:flex-row p-3 md:p-6 gap-3 md:gap-6 pb-20 md:pb-6 overflow-hidden">
          {/* Center Panel - Image Preview */}
          <div className="flex-1 flex flex-col min-w-0 order-1 md:order-none overflow-hidden">
            {/* Horizontal Toolbar - Above Image (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center mb-4">
              <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-xl">
                <button
                  onClick={() => setSelectedTool('iterations')}
                  className={`px-2 py-2 rounded-lg flex items-end gap-0.5 transition-all duration-200 ${
                    selectedTool === 'iterations'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className={`text-[10px] leading-none self-end mb-[-2px] ${selectedTool === 'iterations' ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`}>1</span>
                </button>

                <button
                  onClick={() => setSelectedTool('edit')}
                  className={`px-2 py-2 rounded-lg flex items-end gap-0.5 transition-all duration-200 ${
                    selectedTool === 'edit'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                  <span className={`text-[10px] leading-none self-end mb-[-2px] ${selectedTool === 'edit' ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`}>2</span>
                </button>

                <button
                  onClick={() => setSelectedTool('backgrounds')}
                  className={`px-2 py-2 rounded-lg flex items-end gap-0.5 transition-all duration-200 ${
                    selectedTool === 'backgrounds'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className={`text-[10px] leading-none self-end mb-[-2px] ${selectedTool === 'backgrounds' ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`}>3</span>
                </button>

                <button
                  onClick={() => setSelectedTool('model')}
                  className={`px-2 py-2 rounded-lg flex items-end gap-0.5 transition-all duration-200 ${
                    selectedTool === 'model'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className={`text-[10px] leading-none self-end mb-[-2px] ${selectedTool === 'model' ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`}>4</span>
                </button>

                <button
                  onClick={() => setSelectedTool('export')}
                  className={`px-2 py-2 rounded-lg flex items-end gap-0.5 transition-all duration-200 ${
                    selectedTool === 'export'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Expand className="w-4 h-4" />
                  <span className={`text-[10px] leading-none self-end mb-[-2px] ${selectedTool === 'export' ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`}>5</span>
                </button>
              </div>
            </div>

            {/* Version Control Bar */}
            <div className="flex flex-col items-center gap-1.5 mb-3">
              {/* Original image versions */}
              {!isShowingGenerated && uploadedImage && (
                <>
                  {/* Dots row - fixed position */}
                  <div className="flex items-center justify-center gap-2">
                    {/* Always show dot for original */}
                    {originalVersions.length === 0 && (
                      <button
                        className="w-2.5 h-2.5 rounded-full transition-all bg-emerald-500 scale-110"
                      />
                    )}
                    {originalVersions.map((version, idx) => (
                      version.status === 'processing' ? (
                        <Loader2
                          key={idx}
                          className={`w-2.5 h-2.5 animate-spin ${
                            isCompareMode && idx === compareLeftIndex
                              ? 'text-emerald-500'
                              : isCompareMode && idx === compareRightIndex
                                ? 'text-blue-500'
                                : idx === originalVersionIndex
                                  ? 'text-emerald-500'
                                  : 'text-muted-foreground/80'
                          }`}
                        />
                      ) : (
                        <button
                          key={idx}
                          onClick={() => {
                            if (version.status !== 'completed') return;
                            if (isCompareMode) {
                              // In compare mode: clicking changes RIGHT side (blue dot)
                              handleCompareSelectRight(idx);
                            } else {
                              // Normal mode: clicking navigates to that version
                              setOriginalVersionIndex(idx);
                            }
                          }}
                          disabled={isCompareMode && idx === compareLeftIndex}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            version.status === 'error'
                              ? 'bg-red-500/50'
                              : isCompareMode && idx === compareLeftIndex
                                ? 'bg-emerald-500 scale-110 ring-2 ring-emerald-500/30 cursor-not-allowed'
                                : isCompareMode && idx === compareRightIndex
                                  ? 'bg-blue-500 scale-110 ring-2 ring-blue-500/30'
                                  : idx === originalVersionIndex && !isCompareMode
                                    ? 'bg-emerald-500 scale-110'
                                    : 'bg-foreground/20 hover:bg-foreground/30'
                          }`}
                        />
                      )
                    ))}
                  </div>
                  {/* Label row - changes but dots stay fixed */}
                  <span className="text-xs text-muted-foreground/80 text-center max-w-xs">
                    {originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing' ? (
                      <span className="italic text-muted-foreground/70">
                        Processing{originalVersions[originalVersionIndex]?.prompt ? (
                          originalVersions[originalVersionIndex].prompt.includes('[preset]')
                            ? ` "${originalVersions[originalVersionIndex].prompt.replace(' [preset]', '')}"`
                            : originalVersions[originalVersionIndex].prompt.includes('[background]')
                            ? ` "${originalVersions[originalVersionIndex].prompt.replace('[background] ', '')}"`
                            : ` "${originalVersions[originalVersionIndex].prompt}"`
                        ) : ''}...
                      </span>
                    ) : originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'error' ? (
                      <span className="italic text-red-400">Error - try again</span>
                    ) : originalVersions.length > 0 && originalVersions[originalVersionIndex]?.prompt ? (
                      originalVersions[originalVersionIndex].prompt.includes('[preset]') ? (
                        <span>
                          <span className="text-primary">[preset]</span>
                          <span className="italic text-muted-foreground"> {originalVersions[originalVersionIndex].prompt.replace(' [preset]', '')}</span>
                        </span>
                      ) : originalVersions[originalVersionIndex].prompt.includes('[background]') ? (
                        <span>
                          <span className="text-primary">[background]</span>
                          <span className="italic text-muted-foreground"> {originalVersions[originalVersionIndex].prompt.replace('[background] ', '')}</span>
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground">"{originalVersions[originalVersionIndex].prompt}"</span>
                      )
                    ) : (
                      activeBase?.name || 'Original'
                    )}
                  </span>
                </>
              )}

              {/* Generated image versions */}
              {isShowingGenerated && selectedVariation && selectedVariation.versions.length > 0 && (
                <>
                  {/* Dots row - fixed position */}
                  <div className="flex items-center justify-center gap-2">
                    {selectedVariation.versions.map((version, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVariations(prev => prev.map(v =>
                            v.id === selectedVariation.id
                              ? { ...v, currentVersionIndex: idx, hasNewVersion: false }
                              : v
                          ));
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === selectedVariation.currentVersionIndex
                            ? 'bg-emerald-500 scale-110'
                            : 'bg-foreground/20 hover:bg-foreground/30'
                        }`}
                      />
                    ))}
                    {selectedVariation.isRegenerating && (
                      <Loader2 className="w-2.5 h-2.5 text-muted-foreground/80 animate-spin" />
                    )}
                  </div>
                  {/* Label row */}
                  <span className="text-xs text-muted-foreground/80 text-center">
                    {(() => {
                      const currentVersionPrompt = selectedVariation.versions[selectedVariation.currentVersionIndex]?.prompt;
                      if (!currentVersionPrompt) return selectedVariation.title;
                      if (currentVersionPrompt.includes('[preset]')) {
                        return (
                          <span>
                            <span className="text-primary">[preset]</span>
                            <span className="italic text-muted-foreground"> {currentVersionPrompt.replace(' [preset]', '')}</span>
                          </span>
                        );
                      }
                      if (currentVersionPrompt.includes('[background]')) {
                        return (
                          <span>
                            <span className="text-primary">[background]</span>
                            <span className="italic text-muted-foreground"> {currentVersionPrompt.replace('[background] ', '')}</span>
                          </span>
                        );
                      }
                      return <span className="italic text-muted-foreground">"{currentVersionPrompt}"</span>;
                    })()}
                  </span>
                </>
              )}
            </div>

            {/* Legacy Controls Section - Removed, keeping closing structure */}
            <div className="hidden">
              {isShowingGenerated && selectedVariation?.status === 'completed' && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  {selectedVariation.versions.length > 1 && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVersionChange(selectedVariation.id, 'prev')}
                          disabled={selectedVariation.currentVersionIndex === 0}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
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
                                      ? 'bg-primary scale-110'
                                      : idx === selectedVariation.versions.length - 1 && selectedVariation.hasNewVersion
                                      ? 'bg-green-500 animate-pulse'
                                      : 'bg-foreground/20 hover:bg-foreground/30'
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
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-muted-foreground/70 ml-1">
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
                      className="w-full mb-3 p-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      New version ready - Click to view
                    </button>
                  )}

                  {/* Refine prompt */}
                  <p className="text-sm font-medium mb-2 text-foreground/70">Refine this image</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 'make the lighting warmer'"
                      value={selectedVariation.editPrompt}
                      onChange={(e) => handleEditGenerated(selectedVariation.id, e.target.value)}
                      className="flex-1 bg-muted/50 border-border text-foreground/80 text-sm placeholder:text-muted-foreground/50"
                      disabled={selectedVariation.isRegenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedVariation.editPrompt.trim() && !selectedVariation.isRegenerating) {
                          handleRegenerateWithEdit(selectedVariation.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleRegenerateWithEdit(selectedVariation.id)}
                      disabled={!selectedVariation.editPrompt.trim() || selectedVariation.isRegenerating}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50"
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


              {/* Edit controls for original image */}
              {!isShowingGenerated && uploadedImage && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  {/* Version indicator and navigation */}
                  {originalVersions.length > 1 && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOriginalVersionChange('prev')}
                          disabled={originalVersionIndex === 0}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
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
                                      : 'bg-foreground/20 hover:bg-foreground/30'
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {version.prompt ? `v${idx + 1}: "${version.prompt}"` : `v${idx + 1}: ${activeBase?.name || 'Original'}`}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                        <button
                          onClick={() => handleOriginalVersionChange('next')}
                          disabled={originalVersionIndex === originalVersions.length - 1}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-muted-foreground/70 ml-1">
                          {originalVersionIndex === 0 ? (activeBase?.name || 'Original') : `${activeBase?.name || 'Original'} v${originalVersionIndex + 1}`}
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
                  <p className="text-sm font-medium mb-2 text-foreground/70">Edit this image</p>
                  <div className="flex gap-2">
                    {(() => {
                      const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                      return (
                        <>
                          <Input
                            placeholder="e.g., 'make the background brighter'"
                            value={originalEditPrompt}
                            onChange={(e) => setOriginalEditPrompt(e.target.value)}
                            className="flex-1 bg-muted/50 border-border text-foreground/80 text-sm placeholder:text-muted-foreground/50"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && originalEditPrompt.trim() && !currentVersionProcessing) {
                                handleEditOriginal();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEditOriginal()}
                            disabled={!originalEditPrompt.trim() || currentVersionProcessing}
                            className="bg-primary hover:bg-primary/90 disabled:opacity-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* Image Preview */}
            <div
              className="flex-1 flex items-center justify-center bg-muted/40 rounded-2xl border border-border overflow-hidden relative min-h-0 p-4 md:p-8 touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {previewImage && uploadedImage ? (
                <>
                  {/*
                    Container sized based on what we're viewing:
                    - Original/edits: use original image's aspect ratio
                    - Resized versions: use the target size's aspect ratio (e.g., 9:16 for Story)
                    Uses CSS to calculate max size that fits container while preserving aspect ratio.
                  */}
                  {isCompareMode && compareLeftIndex !== null && compareRightIndex !== null ? (
                    // Comparison slider mode
                    <div
                      className="relative rounded-lg shadow-2xl overflow-hidden"
                      style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: `min(100%, calc((100vh - 200px) * ${uploadedImage.width / uploadedImage.height}))`,
                        maxHeight: `min(100%, calc(100vw * ${uploadedImage.height / uploadedImage.width}))`,
                        aspectRatio: `${uploadedImage.width} / ${uploadedImage.height}`,
                      }}
                    >
                      <ReactCompareSlider
                        handle={isUIHidden ? <></> : undefined}
                        itemOne={
                          <div className="relative w-full h-full">
                            <ReactCompareSliderImage
                              src={originalVersions[compareLeftIndex]?.imageUrl || uploadedImage?.url}
                              alt="Reference"
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                            {/* Left side label */}
                            {!isUIHidden && (() => {
                              const leftText = compareLeftIndex === 0 ? 'Original' : (originalVersions[compareLeftIndex]?.prompt || `Edit ${compareLeftIndex}`);
                              const isTruncated = leftText.length > 22;
                              const labelContent = (
                                <div className={`absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-white text-xs backdrop-blur-sm max-w-[200px] ${isTruncated ? 'cursor-default' : ''}`}>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="truncate">{leftText}</span>
                                  </div>
                                </div>
                              );
                              return isTruncated ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>{labelContent}</TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[300px]">
                                    <p className="text-xs">{leftText}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : labelContent;
                            })()}
                          </div>
                        }
                        itemTwo={
                          <div className="relative w-full h-full">
                            <ReactCompareSliderImage
                              src={originalVersions[compareRightIndex]?.imageUrl || uploadedImage?.url}
                              alt="Comparison"
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                            {/* Right side label */}
                            {!isUIHidden && (() => {
                              const rightText = compareRightIndex === 0 ? 'Original' : (originalVersions[compareRightIndex]?.prompt || `Edit ${compareRightIndex}`);
                              const isTruncated = rightText.length > 22;
                              const labelContent = (
                                <div className={`absolute top-3 right-3 px-2 py-1 rounded bg-blue-500/80 text-white text-xs backdrop-blur-sm max-w-[200px] ${isTruncated ? 'cursor-default' : ''}`}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{rightText}</span>
                                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                  </div>
                                </div>
                              );
                              return isTruncated ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>{labelContent}</TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[300px]">
                                    <p className="text-xs">{rightText}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : labelContent;
                            })()}
                          </div>
                        }
                        style={{ width: '100%', height: '100%' }}
                      />
                      {/* Comparison descriptions below slider */}
                      {!isUIHidden && (originalVersions[compareLeftIndex]?.prompt || originalVersions[compareRightIndex]?.prompt) && (
                        <div className="flex justify-between mt-3 text-xs text-foreground gap-4">
                          <div className="flex-1">
                            {originalVersions[compareLeftIndex]?.prompt && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span>"{originalVersions[compareLeftIndex].prompt}"</span>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-right">
                            {originalVersions[compareRightIndex]?.prompt && (
                              <span className="flex items-center justify-end gap-1.5">
                                <span>"{originalVersions[compareRightIndex].prompt}"</span>
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Normal single image view
                    (() => {
                      // Determine display dimensions based on whether viewing a resize
                      const displayDimensions = viewingOriginalResizedSize
                        ? AD_SIZES.find(s => s.name === viewingOriginalResizedSize) || { width: uploadedImage.width, height: uploadedImage.height }
                        : { width: uploadedImage.width, height: uploadedImage.height };

                      return (
                        <div
                          className="relative rounded-lg shadow-2xl overflow-hidden transition-transform duration-100"
                          style={{
                            width: '100%',
                            height: '100%',
                            maxWidth: `min(100%, calc((100vh - 200px) * ${displayDimensions.width / displayDimensions.height}))`,
                            maxHeight: `min(100%, calc(100vw * ${displayDimensions.height / displayDimensions.width}))`,
                            aspectRatio: `${displayDimensions.width} / ${displayDimensions.height}`,
                            transform: `scale(${zoomLevel}) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`,
                          }}
                        >
                          <img
                            src={previewImage}
                            alt={isShowingGenerated ? 'Generated version' : 'Original ad'}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {/* Processing overlay - inside image container so it only covers the image */}
                          {!isShowingGenerated && originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing' && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black/30">
                              <AsciiGrid variant="processing" />
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                  {/* Error overlay when viewing a failed version */}
                  {!isShowingGenerated && originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'error' && (
                    <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 max-w-xs text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="w-6 h-6 text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Generation Failed</span>
                        <span className="text-xs text-gray-300">The AI couldn't process this edit. This can happen with certain prompts or images. Try a different edit or preset.</span>
                        <button
                          onClick={() => {
                            // Remove the failed version and go back to previous
                            const failedIndex = originalVersionIndex;
                            const parentIndex = originalVersions[failedIndex]?.parentIndex ?? 0;
                            setOriginalVersions(prev => prev.filter((_, idx) => idx !== failedIndex));
                            setOriginalVersionIndex(Math.max(0, parentIndex));
                          }}
                          className="mt-2 px-4 py-2 text-xs bg-muted hover:bg-muted rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Zoom controls - show on mobile when zoomed or always on desktop (hidden in compare mode or when UI hidden) */}
                  {!isUIHidden && (zoomLevel > 1) && !isCompareMode && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-lg p-1 border border-border">
                      <button
                        onClick={() => {
                          setZoomLevel(Math.max(1, zoomLevel - 0.5));
                          if (zoomLevel <= 1.5) setZoomPosition({ x: 0, y: 0 });
                        }}
                        className="p-2 text-foreground/70 hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-foreground/70 min-w-[3rem] text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))}
                        className="p-2 text-foreground/70 hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setZoomLevel(1);
                          setZoomPosition({ x: 0, y: 0 });
                        }}
                        className="p-2 text-foreground/70 hover:text-foreground hover:bg-muted rounded-md transition-colors border-l border-border ml-1"
                        aria-label="Reset zoom"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {/* Swipe hint - show on mobile when there are multiple versions */}
                  {!isUIHidden && ((originalVersions.length > 1 && !isShowingGenerated) ||
                    (isShowingGenerated && selectedVariation && selectedVariation.versions.length > 1)) &&
                    zoomLevel === 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
                      <span className="text-[10px] text-muted-foreground/70 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full">
                        Swipe to navigate versions
                      </span>
                    </div>
                  )}
                </>
              ) : !uploadedImage ? (
                <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
                  {/* ASCII Grid Animation */}
                  <AsciiGrid isDragActive={isDragActive} />

                  <div
                    {...getRootProps()}
                    onMouseEnter={() => uploadIconRef.current?.startAnimation()}
                    onMouseLeave={() => !isDragActive && uploadIconRef.current?.stopAnimation()}
                    className={`relative z-10 flex flex-col items-center justify-center max-w-2xl w-full h-96 gap-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                      isDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-background/80'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                      isDragActive ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <UploadIcon
                        ref={uploadIconRef}
                        size={28}
                        className={`transition-colors ${
                          isDragActive ? 'text-primary' : 'text-primary/70'
                        }`}
                      />
                    </div>
                    {isDragActive ? (
                      <p className="text-primary font-medium">{t('upload.dragDrop')}...</p>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="font-medium mb-1">{t('upload.dragDrop')}</p>
                          <p className="text-muted-foreground/80 text-sm">{t('upload.supportedFormats')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground/50">PNG, JPG, WebP • Max 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground/50">No image</div>
              )}

              {/* Floating Edit Chat Input - shows when edit tool selected */}
              {!isUIHidden && selectedTool === 'edit' && !isShowingGenerated && uploadedImage && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  {(() => {
                    const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                    const selectedRef = editReferences.find(r => r.id === selectedEditRef);
                    return (
                      <div className={`bg-background/40 backdrop-blur-xl border border-border/30 shadow-lg overflow-hidden transition-all duration-200 focus-within:bg-background/70 focus-within:border-border/50 ${
                        selectedRef ? 'rounded-2xl' : 'rounded-full'
                      }`}>
                        {/* Reference attachment row - animates in/out smoothly */}
                        <div className={`overflow-hidden transition-all duration-200 ease-out ${
                          selectedRef ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
                            <div className="relative">
                              {selectedRef?.url && (
                                <img
                                  src={selectedRef.url}
                                  alt={selectedRef.name || ''}
                                  className="w-6 h-6 rounded object-cover"
                                />
                              )}
                              <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-primary">
                                <Paperclip className="w-2.5 h-2.5 text-primary-foreground" />
                              </div>
                            </div>
                            <span className="text-xs text-primary font-medium">{t('common.reference')}</span>
                            <button
                              onClick={() => setSelectedEditRef(null)}
                              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {/* Main input row */}
                        <div className="flex items-center gap-2 pl-4 pr-1.5 py-1.5">
                          <input
                            type="text"
                            placeholder={selectedRef ? "Describe how to use the reference..." : "Describe an edit..."}
                            value={originalEditPrompt}
                            onChange={(e) => setOriginalEditPrompt(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && originalEditPrompt.trim() && !currentVersionProcessing) {
                                handleEditOriginal();
                              }
                            }}
                          />
                          <button
                            onClick={() => handleEditOriginal()}
                            disabled={!originalEditPrompt.trim() || currentVersionProcessing}
                            className="p-2 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Floating Background Input - shows when backgrounds tool selected */}
              {!isUIHidden && selectedTool === 'backgrounds' && !isShowingGenerated && uploadedImage && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  {(() => {
                    const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                    const selectedRef = backgroundReferences.find(r => r.id === selectedBackgroundRef);
                    return (
                      <div className={`bg-background/40 backdrop-blur-xl border border-border/30 shadow-lg overflow-hidden transition-all duration-200 focus-within:bg-background/70 focus-within:border-border/50 ${
                        selectedRef ? 'rounded-2xl' : 'rounded-full'
                      }`}>
                        {/* Reference attachment row - animates in/out smoothly */}
                        <div className={`overflow-hidden transition-all duration-200 ease-out ${
                          selectedRef ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
                            <div className="relative">
                              {selectedRef?.url && (
                                <img
                                  src={selectedRef.url}
                                  alt={selectedRef.name || ''}
                                  className="w-6 h-6 rounded object-cover"
                                />
                              )}
                              <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-primary">
                                <Paperclip className="w-2.5 h-2.5 text-primary-foreground" />
                              </div>
                            </div>
                            <span className="text-xs text-primary font-medium">{t('common.reference')}</span>
                            <button
                              onClick={() => {
                                setSelectedBackgroundRef(null);
                                setBackgroundCustomPrompt('');
                              }}
                              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {/* Main input row */}
                        <div className="flex items-center gap-2 pl-4 pr-1.5 py-1.5">
                          <input
                            type="text"
                            placeholder={selectedRef ? "Describe how to use the reference..." : "Describe a background..."}
                            value={backgroundCustomPrompt}
                            onChange={(e) => setBackgroundCustomPrompt(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && backgroundCustomPrompt.trim() && !currentVersionProcessing) {
                                handleApplyBackgroundChange(backgroundCustomPrompt, 'Custom background');
                                setBackgroundCustomPrompt('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              handleApplyBackgroundChange(backgroundCustomPrompt, 'Custom background');
                              setBackgroundCustomPrompt('');
                            }}
                            disabled={!backgroundCustomPrompt.trim() || currentVersionProcessing}
                            className="p-2 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Floating Model Input - shows when model tool selected */}
              {!isUIHidden && selectedTool === 'model' && !isShowingGenerated && uploadedImage && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  {(() => {
                    const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                    const selectedRef = modelReferences.find(r => r.id === selectedModelRef);
                    return (
                      <div className={`bg-background/40 backdrop-blur-xl border border-border/30 shadow-lg overflow-hidden transition-all duration-200 focus-within:bg-background/70 focus-within:border-border/50 ${
                        selectedRef ? 'rounded-2xl' : 'rounded-full'
                      }`}>
                        {/* Reference attachment row - animates in/out smoothly */}
                        <div className={`overflow-hidden transition-all duration-200 ease-out ${
                          selectedRef ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
                            <div className="relative">
                              {selectedRef?.url && (
                                <img
                                  src={selectedRef.url}
                                  alt={selectedRef.name || ''}
                                  className="w-6 h-6 rounded object-cover"
                                />
                              )}
                              <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-primary">
                                <Paperclip className="w-2.5 h-2.5 text-primary-foreground" />
                              </div>
                            </div>
                            <span className="text-xs text-primary font-medium">{t('common.reference')}</span>
                            <button
                              onClick={() => {
                                setSelectedModelRef(null);
                                setModelCustomPrompt('');
                              }}
                              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {/* Main input row */}
                        <div className="flex items-center gap-2 pl-4 pr-1.5 py-1.5">
                          <input
                            type="text"
                            placeholder={selectedRef ? "Describe how to use the reference..." : "Describe a model..."}
                            value={modelCustomPrompt}
                            onChange={(e) => setModelCustomPrompt(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && modelCustomPrompt.trim() && !currentVersionProcessing) {
                                handleApplyModelChange(modelCustomPrompt, 'Custom');
                                setModelCustomPrompt('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              handleApplyModelChange(modelCustomPrompt, 'Custom');
                              setModelCustomPrompt('');
                            }}
                            disabled={!modelCustomPrompt.trim() || currentVersionProcessing}
                            className="p-2 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* AI Model selector - top left (always visible) */}
              <div className="absolute top-3 left-3 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-normal bg-card/80 hover:bg-card backdrop-blur-sm border border-border/50 text-foreground/40 hover:text-foreground/60 rounded-md transition-colors">
                        {isCompareModelsEnabled && selectedModelsForCompare.length > 0 ? (
                          <>
                            <SplitSquareHorizontal className="w-3 h-3" />
                            Compare
                            <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">
                              {selectedModelsForCompare.length}
                            </span>
                          </>
                        ) : (
                          <>
                            {isOpenAIModel(selectedAIModel) ? (
                              <OpenAILogoGrey className="w-3 h-3 opacity-30" />
                            ) : isWanModel(selectedAIModel) ? (
                              <QwenLogoGrey className="w-3 h-3" />
                            ) : (
                              <GeminiLogoGrey className="w-3 h-3" />
                            )}
                            {getModelDisplayName(selectedAIModel)}
                          </>
                        )}
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[250px]">
                      {/* Gemini Models Section */}
                      <DropdownMenuLabel className={`text-[10px] font-normal flex items-center gap-1.5 ${apiKey ? 'text-muted-foreground/60' : 'text-muted-foreground/30'}`}>
                        <GeminiLogoGrey className="w-3 h-3" />
                        GOOGLE GEMINI
                        {!apiKey && <span className="ml-auto text-[9px]">No key</span>}
                      </DropdownMenuLabel>

                      {/* Gemini 3 Pro */}
                      <DropdownMenuItem
                        onClick={() => {
                          if (!apiKey) {
                            setShowApiKeySetup(true);
                            return;
                          }
                          if (isCompareModelsEnabled) {
                            toggleModelForCompare('gemini-3-pro-image-preview');
                          } else {
                            setSelectedAIModel('gemini-3-pro-image-preview');
                          }
                        }}
                        onSelect={(e) => { if (isCompareModelsEnabled && apiKey) e.preventDefault(); }}
                        className={`justify-between ${!apiKey ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompareModelsEnabled && apiKey && (
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              selectedModelsForCompare.includes('gemini-3-pro-image-preview')
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedModelsForCompare.includes('gemini-3-pro-image-preview') && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          )}
                          <span className="font-medium text-sm">Gemini 3 Pro</span>
                        </div>
                        {!isCompareModelsEnabled && selectedAIModel === 'gemini-3-pro-image-preview' && apiKey && <Check className="w-4 h-4 text-primary" />}
                      </DropdownMenuItem>

                      {/* Gemini 2.5 Flash */}
                      <DropdownMenuItem
                        onClick={() => {
                          if (!apiKey) {
                            setShowApiKeySetup(true);
                            return;
                          }
                          if (isCompareModelsEnabled) {
                            toggleModelForCompare('gemini-2.5-flash-image');
                          } else {
                            setSelectedAIModel('gemini-2.5-flash-image');
                          }
                        }}
                        onSelect={(e) => { if (isCompareModelsEnabled && apiKey) e.preventDefault(); }}
                        className={`justify-between ${!apiKey ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompareModelsEnabled && apiKey && (
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              selectedModelsForCompare.includes('gemini-2.5-flash-image')
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedModelsForCompare.includes('gemini-2.5-flash-image') && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          )}
                          <span className="font-medium text-sm">Gemini 2.5 Flash</span>
                        </div>
                        {!isCompareModelsEnabled && selectedAIModel === 'gemini-2.5-flash-image' && apiKey && <Check className="w-4 h-4 text-primary" />}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* OpenAI Models Section */}
                      <DropdownMenuLabel className={`text-[10px] font-normal flex items-center gap-1.5 ${openaiApiKey ? 'text-muted-foreground/60' : 'text-muted-foreground/30'}`}>
                        <OpenAILogoGrey className="w-3 h-3 opacity-50" />
                        OPENAI
                        {!openaiApiKey && <span className="ml-auto text-[9px]">No key</span>}
                      </DropdownMenuLabel>

                      {/* GPT Image 1.5 */}
                      <DropdownMenuItem
                        onClick={() => {
                          if (!openaiApiKey) {
                            setShowApiKeySetup(true);
                            return;
                          }
                          if (isCompareModelsEnabled) {
                            toggleModelForCompare('gpt-image-1');
                          } else {
                            setSelectedAIModel('gpt-image-1');
                          }
                        }}
                        onSelect={(e) => { if (isCompareModelsEnabled && openaiApiKey) e.preventDefault(); }}
                        className={`justify-between ${!openaiApiKey ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompareModelsEnabled && openaiApiKey && (
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              selectedModelsForCompare.includes('gpt-image-1')
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedModelsForCompare.includes('gpt-image-1') && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          )}
                          <span className="font-medium text-sm">GPT Image 1.5</span>
                        </div>
                        {!isCompareModelsEnabled && selectedAIModel === 'gpt-image-1' && openaiApiKey && <Check className="w-4 h-4 text-primary" />}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Qwen Models Section */}
                      <DropdownMenuLabel className={`text-[10px] font-normal flex items-center gap-1.5 ${dashscopeApiKey ? 'text-muted-foreground/60' : 'text-muted-foreground/30'}`}>
                        <QwenLogoGrey className="w-3 h-3" />
                        QWEN (ALIBABA)
                        {!dashscopeApiKey && <span className="ml-auto text-[9px]">No key</span>}
                      </DropdownMenuLabel>

                      {/* Qwen Image Edit */}
                      <DropdownMenuItem
                        onClick={() => {
                          if (!dashscopeApiKey) {
                            setShowApiKeySetup(true);
                            return;
                          }
                          if (isCompareModelsEnabled) {
                            toggleModelForCompare('wan2.6-image');
                          } else {
                            setSelectedAIModel('wan2.6-image');
                          }
                        }}
                        onSelect={(e) => { if (isCompareModelsEnabled && dashscopeApiKey) e.preventDefault(); }}
                        className={`justify-between ${!dashscopeApiKey ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompareModelsEnabled && dashscopeApiKey && (
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              selectedModelsForCompare.includes('wan2.6-image')
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedModelsForCompare.includes('wan2.6-image') && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          )}
                          <span className="font-medium text-sm">Qwen Image Edit</span>
                        </div>
                        {!isCompareModelsEnabled && selectedAIModel === 'wan2.6-image' && dashscopeApiKey && <Check className="w-4 h-4 text-primary" />}
                      </DropdownMenuItem>

                      {/* Compare Models Toggle */}
                      <DropdownMenuSeparator />
                      <div className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60 font-normal">
                        <div className="flex items-center gap-1">
                          <span className="uppercase">Compare Models</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-muted-foreground transition-colors"
                              >
                                <Info className="w-2.5 h-2.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p>Run edits on multiple models simultaneously. Results appear as separate versions.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCompareModelsEnabled(!isCompareModelsEnabled);
                            if (!isCompareModelsEnabled) {
                              // When enabling, pre-select current model if it has API key
                              if (hasApiKeyForModel(selectedAIModel) && !selectedModelsForCompare.includes(selectedAIModel)) {
                                setSelectedModelsForCompare([selectedAIModel]);
                              }
                            }
                          }}
                          className={`relative w-7 h-4 rounded-full transition-colors ${
                            isCompareModelsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                            isCompareModelsEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Quality Settings */}
                      <DropdownMenuSeparator />
                      <div className="w-full px-2 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60 font-normal">
                        <div className="flex items-center gap-1">
                          <span className="uppercase">{t('models.quality')}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-muted-foreground transition-colors"
                              >
                                <Info className="w-2.5 h-2.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px] text-xs">
                              <p className="font-medium mb-1">{t('quality.title')}</p>
                              <ul className="space-y-1 text-muted-foreground">
                                <li><span className="text-foreground">{t('quality.draft')}:</span> {t('quality.draftDescription')}</li>
                                <li><span className="text-foreground">{t('quality.standard')}:</span> {t('quality.standardDescription')}</li>
                                <li><span className="text-foreground">{t('quality.best')}:</span> {t('quality.bestDescription')}</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <button
                          onClick={() => setShowQualitySettings(!showQualitySettings)}
                          className="flex items-center gap-1.5 hover:text-muted-foreground transition-colors"
                        >
                          <QualityIcon quality={imageQuality} className="!w-4 !h-4" />
                          <ChevronRight className={`w-2.5 h-2.5 transition-transform ${showQualitySettings ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                      {showQualitySettings && (
                        <div className="px-2 pb-2 flex flex-col gap-1">
                          {(['low', 'medium', 'high'] as ImageQuality[]).map((q) => (
                            <button
                              key={q}
                              onClick={() => setImageQuality(q)}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-muted ${
                                imageQuality === q
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <QualityIcon quality={q} />
                              <span>{getQualityLabel(q)}</span>
                            </button>
                          ))}
                        </div>
                      )}

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              {/* Action buttons overlay (always visible, ghosted when no image) */}
              <div className="absolute top-3 right-3 flex gap-2">
                  {/* Delete Version button - enabled on edits, versions, or original if no other work exists */}
                  {(!isShowingGenerated || !previewImage) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={previewImage ? handleDeleteVersion : undefined}
                          disabled={
                            !previewImage ||
                            originalVersions[originalVersionIndex]?.status === 'processing' ||
                            (originalVersionIndex === 0 && activeBaseId === 'original' && !canDeleteBaseVersion('original'))
                          }
                          className="p-2 rounded-lg bg-card/80 hover:bg-red-500/20 backdrop-blur-sm text-foreground/70 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-card/80 disabled:hover:text-foreground/70 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!previewImage
                          ? t('common.uploadFirst')
                          : originalVersionIndex === 0
                            ? activeBaseId === 'original'
                              ? canDeleteBaseVersion('original')
                                ? t('viewer.deleteImageStartOver')
                                : t('viewer.cantDeleteOriginal')
                              : t('viewer.deleteVersion')
                            : t('viewer.deleteEdit')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Create Version button - works on any image */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={previewImage ? () => {
                          const sourceLabel = isShowingGenerated && selectedVariation
                            ? `From: ${selectedVariation.title}`
                            : originalVersionIndex === 0
                              ? 'From: Original'
                              : originalVersions[originalVersionIndex]?.prompt || 'From: Edit';
                          handleCreateVersion(previewImage, sourceLabel);
                        } : undefined}
                        disabled={!previewImage}
                        className="p-2 rounded-lg bg-card/80 hover:bg-card backdrop-blur-sm text-foreground/70 hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:bg-card/80 disabled:hover:text-foreground/70 disabled:cursor-not-allowed"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {previewImage ? t('viewer.newVersion') : t('common.uploadFirst')}
                    </TooltipContent>
                  </Tooltip>
                  {/* Compare button - always show for original/edits, ghosted when < 2 versions or no image */}
                  {!isShowingGenerated && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={previewImage && originalVersions.length >= 2 ? handleToggleCompare : undefined}
                          disabled={!previewImage || originalVersions.length < 2}
                          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
                            isCompareMode
                              ? 'bg-blue-500 text-white'
                              : 'bg-card/80 hover:bg-card text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:hover:bg-card/80 disabled:hover:text-foreground/70 disabled:cursor-not-allowed'
                          }`}
                        >
                          <SplitSquareHorizontal className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!previewImage
                          ? t('common.uploadFirst')
                          : isCompareMode
                            ? t('viewer.exitCompare')
                            : originalVersions.length >= 2
                              ? t('viewer.compare')
                              : t('viewer.makeEditToCompare')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Hide UI toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsUIHidden(!isUIHidden)}
                        disabled={!previewImage}
                        className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
                          isUIHidden
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card/80 hover:bg-card text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:hover:bg-card/80 disabled:hover:text-foreground/70 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isUIHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{isUIHidden ? t('viewer.showUI') : t('viewer.hideUI')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={previewImage ? () => {
                          const filename = isShowingGenerated && selectedVariation
                            ? `${selectedVariation.title}${viewingResizedSize ? `_${viewingResizedSize}` : ''}.png`
                            : uploadedImage?.filename || 'image.png';
                          handleDownload(previewImage, filename, 'single');
                        } : undefined}
                        disabled={!previewImage}
                        className="p-2 rounded-lg bg-card/80 hover:bg-card backdrop-blur-sm text-foreground/70 hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:bg-card/80 disabled:hover:text-foreground/70 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{previewImage ? t('viewer.download') : t('common.uploadFirst')}</TooltipContent>
                  </Tooltip>
                </div>

              {isShowingGenerated && selectedVariation?.imageUrl && (
                <div className="absolute bottom-4 right-4">
                  <Button
                    size="sm"
                    onClick={() => handleDuplicateVariation(selectedVariation.id)}
                    className="bg-muted hover:bg-muted backdrop-blur-sm"
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    {t('viewer.duplicate')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Left Panel - Tool Panel */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[360px] transform transition-transform duration-300 ease-in-out
            md:relative md:inset-auto md:z-auto md:w-[360px] md:transform-none
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            flex-shrink-0 border-r md:border border-border md:rounded-2xl bg-background md:bg-muted/30 flex flex-col overflow-y-auto overscroll-contain pr-2 md:pr-0 md:overflow-hidden md:order-first
          `}>
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border md:hidden">
              <span className="font-semibold">{t('tools.title')}</span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Versions Tool */}
            {selectedTool === 'iterations' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col overflow-hidden">
                {/* Image Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground/70">{t('sidebar.image')}</h3>
                    <div className="flex items-center gap-2">
                      {uploadedImage && (
                        <button
                          onClick={() => setShowClearConfirmModal(true)}
                          className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                      <button
                        onClick={uploadedImage ? handleNewClick : openFileDialog}
                        className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-primary hover:text-primary/80"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    </div>
                  </div>
                  {uploadedImage ? (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/70 truncate flex-1 mr-2">{uploadedImage.filename}</span>
                        <span className="text-[11px] text-muted-foreground/80">{uploadedImage.width}×{uploadedImage.height}</span>
                      </div>
                      {analysis && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={() => setIsImageDescExpanded(!isImageDescExpanded)}
                            className="w-full flex items-center justify-between gap-2 group"
                          >
                            <p className={`text-[10px] text-muted-foreground/70 text-left flex-1 ${isImageDescExpanded ? '' : 'truncate'}`}>
                              {analysis.product}{analysis.mood ? ` · ${analysis.mood}` : ''}{analysis.colors?.length > 0 ? ` · ${analysis.colors.slice(0, 2).join(', ')}` : ''}
                            </p>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-all flex-shrink-0 ${isImageDescExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`grid transition-all duration-200 ease-out ${isImageDescExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-2 rounded-md bg-background/50 border border-border/30">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground/80 italic leading-relaxed flex-1">
                                    {analysis.imageDescription || 'Analyzing image...'}
                                  </p>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const text = analysis.imageDescription || `${analysis.product} · ${analysis.mood}`;
                                          navigator.clipboard.writeText(text);
                                          toast.success('Copied to clipboard');
                                        }}
                                        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">Copy description</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openFileDialog}
                      className="w-full p-3 rounded-lg border border-dashed border-border hover:border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[11px] text-muted-foreground/50">No image uploaded</span>
                    </button>
                  )}
                </div>
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <h2 className="font-semibold text-base flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"><Layers className="w-3.5 h-3.5 text-primary-foreground" /></span>{t('sidebar.versions')}</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[140px]">
                            <p className="text-xs">{t('sidebar.snapshotsDescription')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground/80">{t('sidebar.savedEditsDescription')}</p>
                    </div>
                    {variations.length > 0 && (
                      <div className="flex items-center gap-3">
                        {completedCount > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                                className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                              >
                                <FolderDown className="w-3.5 h-3.5" />
                                Download All
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Download all {completedCount} generated versions
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <span className="text-sm text-muted-foreground/70">
                          {completedCount}/{variations.length} generated
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Generate Iterations button - show when no variations yet */}
                  {variations.length === 0 && !isAnalyzingForIterations && (
                    <div className="mt-4">
                      {/* Number of generations */}
                      <div className="mb-3">
                        <label className="text-xs text-muted-foreground/70 mb-1.5 block">{t('sidebar.generateSuggestions')}</label>
                        <div className="flex items-center gap-2">
                          {[3, 5, 8, 10].map((num) => (
                            <button
                              key={num}
                              onClick={() => setNumGenerations(num)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                numGenerations === num
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/50 text-muted-foreground/80 hover:bg-muted hover:text-foreground/70'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Context input */}
                      <div className="mb-3">
                        <Textarea
                          placeholder="Optional: add context to guide the AI-powered suggestions"
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          className="w-full bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 min-h-[60px] resize-none text-sm"
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={handleGenerateIterations}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        {t('sidebar.generateSuggestions')}
                      </Button>

                      {/* Custom iteration section */}
                      <div className="mt-4 pt-4 border-t border-border">
                        {!showCustomIteration ? (
                          <button
                            onClick={() => setShowCustomIteration(true)}
                            className="w-full px-3 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground/80 hover:text-foreground/70 hover:border-border transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            {t('common.customVersion')}
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Describe the iteration you want to create..."
                              value={customIterationDescription}
                              onChange={(e) => setCustomIterationDescription(e.target.value)}
                              className="w-full bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-none text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAddCustomIteration}
                                disabled={!customIterationDescription.trim()}
                                size="sm"
                                className="flex-1 bg-muted hover:bg-muted text-foreground"
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
                                className="text-muted-foreground/80 hover:text-foreground hover:bg-muted"
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
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Analyzing your ad...</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Generating version ideas (10-20 seconds)</p>
                    </div>
                  )}
                  {/* Create all button - show when variations exist but not all generated */}
                  {variations.length > 0 && generatingCount === 0 && variations.some(v => v.status === 'idle') && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateAll()}
                      className="w-full mt-3 bg-primary hover:bg-primary/90"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Create all
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Edit Tool - with resize presets */}
            {selectedTool === 'edit' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col h-full">
                {/* Image Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground/70">{t('sidebar.image')}</h3>
                    <div className="flex items-center gap-2">
                      {uploadedImage && (
                        <button
                          onClick={() => setShowClearConfirmModal(true)}
                          className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                      <button
                        onClick={uploadedImage ? handleNewClick : openFileDialog}
                        className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-primary hover:text-primary/80"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    </div>
                  </div>
                  {uploadedImage ? (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/70 truncate flex-1 mr-2">{uploadedImage.filename}</span>
                        <span className="text-[11px] text-muted-foreground/80">{uploadedImage.width}×{uploadedImage.height}</span>
                      </div>
                      {analysis && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={() => setIsImageDescExpanded(!isImageDescExpanded)}
                            className="w-full flex items-center justify-between gap-2 group"
                          >
                            <p className={`text-[10px] text-muted-foreground/70 text-left flex-1 ${isImageDescExpanded ? '' : 'truncate'}`}>
                              {analysis.product}{analysis.mood ? ` · ${analysis.mood}` : ''}{analysis.colors?.length > 0 ? ` · ${analysis.colors.slice(0, 2).join(', ')}` : ''}
                            </p>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-all flex-shrink-0 ${isImageDescExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`grid transition-all duration-200 ease-out ${isImageDescExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-2 rounded-md bg-background/50 border border-border/30">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground/80 italic leading-relaxed flex-1">
                                    {analysis.imageDescription || 'Analyzing image...'}
                                  </p>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const text = analysis.imageDescription || `${analysis.product} · ${analysis.mood}`;
                                          navigator.clipboard.writeText(text);
                                          toast.success('Copied to clipboard');
                                        }}
                                        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">Copy description</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openFileDialog}
                      className="w-full p-3 rounded-lg border border-dashed border-border hover:border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[11px] text-muted-foreground/50">No image uploaded</span>
                    </button>
                  )}
                </div>

                {/* Tool Content */}
                <div className="p-4 flex-1 flex flex-col min-h-0">
                  <h2 className="font-semibold text-base mb-2 flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"><Wand2 className="w-3.5 h-3.5 text-primary-foreground" /></span>{t('tools.edit')}</h2>
                  <div className="text-xs text-muted-foreground/80 mb-3">
                    {t('edit.description')}
                    {uploadedImage && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => analysis?.imageDescription && setShowImageDetails(!showImageDetails)}
                            disabled={!analysis?.imageDescription}
                            className={`inline-flex items-center gap-1 ml-1.5 transition-colors ${
                              analysis?.imageDescription
                                ? 'text-muted-foreground hover:text-foreground/80 cursor-pointer'
                                : 'text-muted-foreground/50 cursor-not-allowed'
                            }`}
                          >
                            <span>{t('edit.imageDetails')}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showImageDetails ? 'rotate-180' : ''}`} />
                          </button>
                        </TooltipTrigger>
                        {!analysis?.imageDescription && (
                          <TooltipContent side="bottom">
                            <p className="text-xs">{t('edit.stillAnalyzing')}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                  <div className={`grid transition-all duration-200 ease-out ${showImageDetails && analysis?.imageDescription ? 'grid-rows-[1fr] opacity-100 mb-3' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                    <div className="overflow-hidden">
                      <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] text-muted-foreground/80 italic leading-relaxed flex-1">{analysis?.imageDescription}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  if (analysis?.imageDescription) {
                                    navigator.clipboard.writeText(analysis.imageDescription);
                                    toast.success('Description copied');
                                  }
                                }}
                                className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground/60 hover:text-muted-foreground"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">{t('edit.copyDescription')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 touch-scroll pr-2 md:pr-0 pb-20 md:pb-16">
                    {/* Enhance/Touchup */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'enhance' ? null : 'enhance')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.enhance')}</span>
                          {selectedPresets.enhance && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'enhance' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'enhance' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.enhance.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  enhance: prev.enhance === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.enhance === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lighting */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'lighting' ? null : 'lighting')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.lighting')}</span>
                          {selectedPresets.lighting && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'lighting' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'lighting' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.lighting.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  lighting: prev.lighting === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.lighting === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Style */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'style' ? null : 'style')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.style')}</span>
                          {selectedPresets.style && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'style' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'style' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.style.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  style: prev.style === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.style === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Camera */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'camera' ? null : 'camera')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.cameraAngle')}</span>
                          {selectedPresets.camera && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'camera' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'camera' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.camera.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  camera: prev.camera === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.camera === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mood */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'mood' ? null : 'mood')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.mood')}</span>
                          {selectedPresets.mood && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'mood' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'mood' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.mood.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  mood: prev.mood === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.mood === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Color */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'color' ? null : 'color')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.color')}</span>
                          {selectedPresets.color && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'color' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'color' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.color.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  color: prev.color === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.color === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Era */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'era' ? null : 'era')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.era')}</span>
                          {selectedPresets.era && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'era' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'era' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.era.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  era: prev.era === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.era === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Framing */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'framing' ? null : 'framing')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Scan className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.framing')}</span>
                          {selectedPresets.framing && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'framing' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'framing' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.framing.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  framing: prev.framing === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.framing === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rotation */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'rotation' ? null : 'rotation')}
                        className="w-full px-3 py-3 md:py-2 flex items-center justify-between text-sm bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <RotateCw className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('edit.rotation')}</span>
                          {selectedPresets.rotation && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/80 transition-transform ${expandedPresetCategory === 'rotation' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'rotation' && (
                        <div className="p-2 space-y-1 bg-muted/50">
                          {PRESETS.rotation.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setSelectedPresets(prev => ({
                                  ...prev,
                                  rotation: prev.rotation === preset.id ? null : preset.id
                                }));
                              }}
                              className={`w-full px-3 py-2.5 md:py-1.5 rounded text-left text-xs text-foreground/70 transition-all touch-manipulation active:bg-muted ${
                                selectedPresets.rotation === preset.id
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {t(PRESET_KEYS[preset.id])}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reference Image Section */}
                    <div className="border-t border-border/50 pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{t('edit.referenceImage')}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                <Info className="w-3 h-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[200px]">
                              <p className="text-xs">Upload a reference image and describe how to use it in your edit prompt.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {editReferences.length > 0 && (
                          <button
                            onClick={() => {
                              setEditReferences([]);
                              setSelectedEditRef(null);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {t('backgrounds.clearAll')}
                          </button>
                        )}
                      </div>

                      {/* Existing references grid */}
                      {editReferences.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {editReferences.map((ref) => (
                            <div
                              key={ref.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedEditRef(ref.id === selectedEditRef ? null : ref.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedEditRef(ref.id === selectedEditRef ? null : ref.id);
                                }
                              }}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                selectedEditRef === ref.id
                                  ? 'border-primary ring-2 ring-primary/20'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditReferences(prev => prev.filter(r => r.id !== ref.id));
                                  if (selectedEditRef === ref.id) setSelectedEditRef(null);
                                }}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/50 hover:bg-black/70 transition-colors"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add reference button */}
                      <button
                        onClick={() => editRefInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ImagePlus className="w-4 h-4 text-muted-foreground/50" />
                        Add reference
                      </button>

                      {/* Hidden file input */}
                      <input
                        ref={editRefInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditRefUpload}
                      />
                    </div>

                    {/* Apply button - always rendered, visibility controlled by opacity */}
                    <div className={`mt-3 pt-3 border-t border-border transition-opacity duration-150 ${
                      (selectedPresets.lighting || selectedPresets.style || selectedPresets.mood || selectedPresets.color || selectedPresets.era || selectedPresets.camera || selectedPresets.framing || selectedPresets.rotation || selectedPresets.enhance)
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none'
                    }`}>
                      <Button
                        onClick={() => handleApplyPresets()}
                        disabled={originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing'}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Apply {Object.values(selectedPresets).filter(Boolean).length > 1 ? 'Presets' : 'Preset'}
                      </Button>
                      <button
                        onClick={() => setSelectedPresets({ lighting: null, style: null, mood: null, color: null, era: null, camera: null, framing: null, rotation: null, enhance: null })}
                        className="w-full mt-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                      >
                        Clear selections
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Resize Tool */}
            {selectedTool === 'export' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col h-full">
                {/* Image Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground/70">{t('sidebar.image')}</h3>
                    <div className="flex items-center gap-2">
                      {uploadedImage && (
                        <button
                          onClick={() => setShowClearConfirmModal(true)}
                          className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                      <button
                        onClick={uploadedImage ? handleNewClick : openFileDialog}
                        className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-primary hover:text-primary/80"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    </div>
                  </div>
                  {uploadedImage ? (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/70 truncate flex-1 mr-2">{uploadedImage.filename}</span>
                        <span className="text-[11px] text-muted-foreground/80">{uploadedImage.width}×{uploadedImage.height}</span>
                      </div>
                      {analysis && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={() => setIsImageDescExpanded(!isImageDescExpanded)}
                            className="w-full flex items-center justify-between gap-2 group"
                          >
                            <p className={`text-[10px] text-muted-foreground/70 text-left flex-1 ${isImageDescExpanded ? '' : 'truncate'}`}>
                              {analysis.product}{analysis.mood ? ` · ${analysis.mood}` : ''}{analysis.colors?.length > 0 ? ` · ${analysis.colors.slice(0, 2).join(', ')}` : ''}
                            </p>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-all flex-shrink-0 ${isImageDescExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`grid transition-all duration-200 ease-out ${isImageDescExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-2 rounded-md bg-background/50 border border-border/30">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground/80 italic leading-relaxed flex-1">
                                    {analysis.imageDescription || 'Analyzing image...'}
                                  </p>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const text = analysis.imageDescription || `${analysis.product} · ${analysis.mood}`;
                                          navigator.clipboard.writeText(text);
                                          toast.success('Copied to clipboard');
                                        }}
                                        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">Copy description</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openFileDialog}
                      className="w-full p-3 rounded-lg border border-dashed border-border hover:border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[11px] text-muted-foreground/50">No image uploaded</span>
                    </button>
                  )}
                </div>

                {/* Tool Content */}
                <div className="p-4 flex-1 flex flex-col overflow-hidden">
                  <h2 className="font-semibold text-base mb-2 flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"><Expand className="w-3.5 h-3.5 text-primary-foreground" /></span>{t('export.resize')}</h2>
                  <p className="text-xs text-muted-foreground/80 mb-3">
                    {t('export.description')}
                  </p>

                  {/* Smart Resize Section */}
                  <div className="mb-4">
                    <div className="space-y-1.5">
                      {/* Original size button - only show when image uploaded */}
                      {uploadedImage && (
                        <button
                          onClick={() => setViewingOriginalResizedSize(null)}
                          className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between text-sm ${
                            !viewingOriginalResizedSize
                              ? 'bg-emerald-600/20 border-emerald-500/40'
                              : 'bg-muted/50 border-border hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Check className={`w-3.5 h-3.5 ${!viewingOriginalResizedSize ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground/70'}`} />
                            <span className={!viewingOriginalResizedSize ? 'text-emerald-700 dark:text-emerald-400' : ''}>{t('export.original')}</span>
                          </div>
                          <span className="text-muted-foreground/70 text-xs">{uploadedImage.width}×{uploadedImage.height}</span>
                        </button>
                      )}
                      {/* Resize options */}
                      {AD_SIZES.map((size) => {
                        const resized = originalResizedVersions.find(r => r.size === size.name);
                        const isResizing = resized?.status === 'resizing';
                        const isCompleted = resized?.status === 'completed';
                        const isViewing = viewingOriginalResizedSize === size.name;
                        return (
                          <button
                            key={size.name}
                            onClick={() => {
                              if (!uploadedImage) {
                                toast.info(t('common.uploadFirst'));
                                return;
                              }
                              if (isCompleted) {
                                setViewingOriginalResizedSize(isViewing ? null : size.name);
                              } else if (!isResizing) {
                                handleResizeOriginal(size);
                              }
                            }}
                            disabled={isResizing}
                            className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between text-sm disabled:cursor-default ${
                              isViewing
                                ? 'bg-emerald-600/20 border-emerald-500/40'
                                : isCompleted
                                ? 'bg-primary/10 border-primary/30 hover:bg-primary/20'
                                : 'bg-muted/50 border-border hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                                {isResizing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/80" />
                                ) : isCompleted ? (
                                  <Check className={`w-3.5 h-3.5 ${isViewing ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'}`} />
                                ) : (
                                  <div
                                    className="bg-muted-foreground/20 border-2 border-muted-foreground rounded-[2px]"
                                    style={{
                                      width: size.width >= size.height ? 14 : 14 * (size.width / size.height),
                                      height: size.height >= size.width ? 14 : 14 * (size.height / size.width),
                                    }}
                                  />
                                )}
                              </div>
                              <span className={isViewing ? 'text-emerald-700 dark:text-emerald-400' : isCompleted ? 'text-primary' : ''}>{getSizeLabel(size.label)}</span>
                            </div>
                            <span className="text-muted-foreground/70 text-xs">{size.name}</span>
                          </button>
                        );
                      })}
                      {/* Generate All link - only show when image uploaded */}
                      {uploadedImage && (() => {
                        const ungeneratedSizes = AD_SIZES.filter(size => {
                          const resized = originalResizedVersions.find(r => r.size === size.name);
                          return !resized || resized.status === 'idle' || resized.status === 'error';
                        });
                        const isAnyResizing = originalResizedVersions.some(r => r.status === 'resizing');
                        if (ungeneratedSizes.length === 0) return null;
                        return (
                          <button
                            onClick={() => {
                              ungeneratedSizes.forEach(size => handleResizeOriginal(size));
                            }}
                            disabled={isAnyResizing}
                            className="w-full mt-2 text-xs text-primary hover:text-primary disabled:text-muted-foreground/50 disabled:cursor-not-allowed transition-colors text-center py-1"
                          >
                            {isAnyResizing ? t('export.resizingMayTakeMinute') : t('export.generateAllSizes', { count: ungeneratedSizes.length })}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                {/* Download Section */}
                <div className="mt-auto space-y-2">
                  <h3 className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-2">{t('export.downloadSection')}</h3>
                  {!uploadedImage && (
                    <div className="text-sm text-muted-foreground/70 italic">{t('export.noImagesToDownload')}</div>
                  )}
                  {uploadedImage && (
                    <button
                      onClick={() => {
                        if (viewingOriginalResizedSize) {
                          const resized = originalResizedVersions.find(r => r.size === viewingOriginalResizedSize);
                          if (resized?.imageUrl) {
                            handleDownload(resized.imageUrl, `${uploadedImage.filename.replace(/\.[^.]+$/, '')}_${viewingOriginalResizedSize}.png`, 'single');
                          }
                        } else {
                          handleDownload(uploadedImage.url, uploadedImage.filename, 'single');
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-all text-left flex items-center gap-3"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{t('export.currentView')}</div>
                        <div className="text-xs text-muted-foreground/70">
                          {viewingOriginalResizedSize || `${uploadedImage.width}×${uploadedImage.height}`}
                        </div>
                      </div>
                    </button>
                  )}
                  {originalResizedVersions.filter(r => r.status === 'completed').length > 0 && (
                    <button
                      onClick={async () => {
                        track('image_downloaded', { type: 'all_sizes' });
                        if (uploadedImage?.url) {
                          await handleDownload(uploadedImage.url, `original_${uploadedImage.width}x${uploadedImage.height}.png`);
                        }
                        for (const resized of originalResizedVersions.filter(r => r.status === 'completed' && r.imageUrl)) {
                          await handleDownload(resized.imageUrl!, `original_${resized.size}.png`);
                          await new Promise(resolve => setTimeout(resolve, 300));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-all text-left flex items-center gap-3"
                    >
                      <FolderDown className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-primary">{t('export.downloadAllSizes')}</div>
                        <div className="text-xs text-muted-foreground/70">
                          {t('export.sizes', { count: originalResizedVersions.filter(r => r.status === 'completed').length + 1 })}
                        </div>
                      </div>
                    </button>
                  )}
                  {completedCount > 0 && (
                    <button
                      onClick={() => {
                        const count = getAllFileCount();
                        setDownloadModal({
                          isOpen: true,
                          title: t('export.downloadAll'),
                          fileCount: count,
                          onConfirm: downloadAllGenerations,
                        });
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-all text-left flex items-center gap-3"
                    >
                      <FolderDown className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{t('export.downloadAllVersions')}</div>
                        <div className="text-xs text-muted-foreground/70">{t('export.generatedImages', { count: completedCount })}</div>
                      </div>
                    </button>
                  )}
                </div>
                </div>
              </div>
            )}

            {/* Backgrounds Tool */}
            {selectedTool === 'backgrounds' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col h-full">
                {/* Image Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground/70">{t('sidebar.image')}</h3>
                    <div className="flex items-center gap-2">
                      {uploadedImage && (
                        <button
                          onClick={() => setShowClearConfirmModal(true)}
                          className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                      <button
                        onClick={uploadedImage ? handleNewClick : openFileDialog}
                        className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-primary hover:text-primary/80"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    </div>
                  </div>
                  {uploadedImage ? (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/70 truncate flex-1 mr-2">{uploadedImage.filename}</span>
                        <span className="text-[11px] text-muted-foreground/80">{uploadedImage.width}×{uploadedImage.height}</span>
                      </div>
                      {analysis && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={() => setIsImageDescExpanded(!isImageDescExpanded)}
                            className="w-full flex items-center justify-between gap-2 group"
                          >
                            <p className={`text-[10px] text-muted-foreground/70 text-left flex-1 ${isImageDescExpanded ? '' : 'truncate'}`}>
                              {analysis.product}{analysis.mood ? ` · ${analysis.mood}` : ''}{analysis.colors?.length > 0 ? ` · ${analysis.colors.slice(0, 2).join(', ')}` : ''}
                            </p>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-all flex-shrink-0 ${isImageDescExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`grid transition-all duration-200 ease-out ${isImageDescExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-2 rounded-md bg-background/50 border border-border/30">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground/80 italic leading-relaxed flex-1">
                                    {analysis.imageDescription || 'Analyzing image...'}
                                  </p>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const text = analysis.imageDescription || `${analysis.product} · ${analysis.mood}`;
                                          navigator.clipboard.writeText(text);
                                          toast.success('Copied to clipboard');
                                        }}
                                        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">Copy description</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openFileDialog}
                      className="w-full p-3 rounded-lg border border-dashed border-border hover:border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[11px] text-muted-foreground/50">No image uploaded</span>
                    </button>
                  )}
                </div>

                {/* Tool Content */}
                <div className="p-4 flex flex-col flex-1 overflow-hidden">
                  <h2 className="font-semibold text-base mb-2 flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"><ImageIcon className="w-3.5 h-3.5 text-primary-foreground" /></span>{t('tools.backgrounds')}</h2>
                  <div className="text-xs text-muted-foreground/80 mb-3">
                    {t('backgrounds.description')}
                    {uploadedImage && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => analysis?.backgroundDescription && setShowBackgroundDetails(!showBackgroundDetails)}
                            disabled={!analysis?.backgroundDescription}
                            className={`inline-flex items-center gap-1 ml-1.5 transition-colors ${
                              analysis?.backgroundDescription
                                ? 'text-muted-foreground hover:text-foreground/80 cursor-pointer'
                                : 'text-muted-foreground/50 cursor-not-allowed'
                            }`}
                          >
                            <span>{t('backgrounds.currentBackground')}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showBackgroundDetails ? 'rotate-180' : ''}`} />
                          </button>
                        </TooltipTrigger>
                        {!analysis?.backgroundDescription && (
                          <TooltipContent side="bottom">
                            <p className="text-xs">{t('edit.stillAnalyzing')}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                  {showBackgroundDetails && analysis?.backgroundDescription && (
                    <div className="mb-3 p-2.5 rounded-lg bg-muted/50 border border-border">
                      <p className="text-[11px] text-muted-foreground/80 italic leading-relaxed">{analysis.backgroundDescription}</p>
                    </div>
                  )}

                {/* Generate AI Suggestions Button - Top */}
                <button
                  onClick={() => {
                    if (!uploadedImage) {
                      toast.info(t('common.uploadFirst'));
                      return;
                    }
                    handleGenerateBackgroundSuggestions();
                  }}
                  disabled={isLoadingBackgroundSuggestions}
                  className="w-full px-3 py-2 mb-4 rounded-lg text-sm border border-border hover:border-primary/50 hover:bg-primary/10 text-foreground/70 hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoadingBackgroundSuggestions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-muted-foreground/80">{t('backgrounds.suggesting')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-primary/70" />
                      {t('backgrounds.suggestBackgrounds')}
                    </>
                  )}
                </button>

                {/* Backgrounds Grid */}
                <div className="flex-1 overflow-y-auto touch-scroll pr-2 md:pr-0 pb-20 md:pb-16">
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Separator above AI suggestions */}
                    {(isLoadingBackgroundSuggestions || backgroundSuggestions.length > 0) && (
                      <div className="col-span-2 h-px bg-muted my-1" />
                    )}

                    {/* AI-Generated Suggestions */}
                    {isLoadingBackgroundSuggestions && (
                      // Skeleton loading placeholders
                      <>
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={`skeleton-${i}`}
                            className="h-9 rounded-lg bg-primary/5 border border-primary/20 animate-pulse"
                          />
                        ))}
                      </>
                    )}
                    {backgroundSuggestions.map((suggestion) => {
                      const isActive = activeBackgroundId === suggestion.id;
                      const useCount = backgroundUseCounts[suggestion.id] || 0;
                      return (
                        <button
                          key={suggestion.id}
                          onClick={() => {
                            if (!uploadedImage) {
                              toast.info(t('common.uploadFirst'));
                              return;
                            }
                            setActiveBackgroundId(suggestion.id);
                            setTimeout(() => setActiveBackgroundId(null), 1500);
                            setBackgroundUseCounts(prev => ({
                              ...prev,
                              [suggestion.id]: (prev[suggestion.id] || 0) + 1
                            }));
                            handleApplyBackgroundChange(suggestion.prompt, suggestion.name);
                          }}
                          className={`px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400'
                              : useCount > 0
                                ? 'bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 text-foreground/80'
                                : 'bg-primary/5 border border-primary/40 hover:bg-primary/10 hover:border-primary/60 text-foreground/80'
                          }`}
                        >
                          <span>{suggestion.name}</span>
                          {(isActive || useCount > 0) && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              {Array.from({ length: Math.min(useCount + (isActive && useCount === 0 ? 1 : 0), 5) }).map((_, i) => (
                                <Check key={i} className={`w-3 h-3 text-green-500 ${isActive && i === useCount ? 'animate-in fade-in duration-200' : ''}`} />
                              ))}
                              {useCount > 5 && <span className="text-[10px] text-green-500 ml-0.5">+{useCount - 5}</span>}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Common Backgrounds */}
                    {BACKGROUND_SUGGESTIONS.map((suggestion) => {
                      const isActive = activeBackgroundId === suggestion.id;
                      const useCount = backgroundUseCounts[suggestion.id] || 0;
                      return (
                        <button
                          key={suggestion.id}
                          onClick={() => {
                            if (!uploadedImage) {
                              toast.info(t('common.uploadFirst'));
                              return;
                            }
                            setActiveBackgroundId(suggestion.id);
                            setTimeout(() => setActiveBackgroundId(null), 1500);
                            setBackgroundUseCounts(prev => ({
                              ...prev,
                              [suggestion.id]: (prev[suggestion.id] || 0) + 1
                            }));
                            handleApplyBackgroundChange(suggestion.prompt, t(BACKGROUND_PRESET_KEYS[suggestion.id]));
                          }}
                          className={`px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400'
                              : useCount > 0
                                ? 'bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 text-foreground/80'
                                : 'bg-muted/50 border border-border hover:bg-muted hover:border-border text-foreground/80'
                          }`}
                        >
                          <span>{t(BACKGROUND_PRESET_KEYS[suggestion.id])}</span>
                          {(isActive || useCount > 0) && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              {Array.from({ length: Math.min(useCount + (isActive && useCount === 0 ? 1 : 0), 5) }).map((_, i) => (
                                <Check key={i} className={`w-3 h-3 text-green-500 ${isActive && i === useCount ? 'animate-in fade-in duration-200' : ''}`} />
                              ))}
                              {useCount > 5 && <span className="text-[10px] text-green-500 ml-0.5">+{useCount - 5}</span>}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reference Backgrounds Section */}
                  <div className="border-t border-border/50 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{t('backgrounds.referenceBackgrounds')}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                              <Info className="w-3 h-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[140px]">
                            <p className="text-xs">Upload a photo to extract its background and apply it to your image.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {backgroundReferences.length > 0 && (
                        <button
                          onClick={() => {
                            setBackgroundReferences([]);
                            setSelectedBackgroundRef(null);
                            setBackgroundCustomPrompt('');
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Existing references grid */}
                    {backgroundReferences.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {backgroundReferences.map((ref) => (
                          <div
                            key={ref.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedBackgroundRef(ref.id);
                              setBackgroundCustomPrompt(t('modelBuilder.useBackgroundFromReference'));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedBackgroundRef(ref.id);
                                setBackgroundCustomPrompt(t('modelBuilder.useBackgroundFromReference'));
                              }
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              selectedBackgroundRef === ref.id
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBackgroundReferences(prev => prev.filter(r => r.id !== ref.id));
                                if (selectedBackgroundRef === ref.id) {
                                  setSelectedBackgroundRef(null);
                                  setBackgroundCustomPrompt('');
                                }
                              }}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/50 hover:bg-black/70 transition-colors"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add reference button */}
                    <button
                      onClick={() => backgroundRefInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ImagePlus className="w-4 h-4 text-muted-foreground/50" />
                      Add reference
                    </button>

                    {/* Hidden file input */}
                    <input
                      ref={backgroundRefInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundRefUpload}
                    />
                  </div>

                  {/* Remove Background - Special feature (no API key needed) */}
                  <div className="border-t border-border/50 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{t('backgrounds.removeBackground')}</span>
                      <span className="text-[10px] text-muted-foreground/60">{t('backgrounds.noApiNeeded')}</span>
                    </div>
                    <button
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBackground || (originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing')}
                      className="w-full py-2 px-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRemovingBackground ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
                          <span>{t('backgrounds.removing')}</span>
                        </>
                      ) : (
                        <>
                          <Eraser className="w-4 h-4 text-muted-foreground/50" />
                          <span>{t('backgrounds.removeBackground')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>

              </div>
            )}

            {/* Model Tool */}
            {selectedTool === 'model' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col h-full overflow-hidden">
                {/* Image Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground/70">{t('sidebar.image')}</h3>
                    <div className="flex items-center gap-2">
                      {uploadedImage && (
                        <button
                          onClick={() => setShowClearConfirmModal(true)}
                          className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                      <button
                        onClick={uploadedImage ? handleNewClick : openFileDialog}
                        className="text-xs flex items-center gap-0.5 transition-colors cursor-pointer text-primary hover:text-primary/80"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    </div>
                  </div>
                  {uploadedImage ? (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/70 truncate flex-1 mr-2">{uploadedImage.filename}</span>
                        <span className="text-[11px] text-muted-foreground/80">{uploadedImage.width}×{uploadedImage.height}</span>
                      </div>
                      {analysis && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={() => setIsImageDescExpanded(!isImageDescExpanded)}
                            className="w-full flex items-center justify-between gap-2 group"
                          >
                            <p className={`text-[10px] text-muted-foreground/70 text-left flex-1 ${isImageDescExpanded ? '' : 'truncate'}`}>
                              {analysis.product}{analysis.mood ? ` · ${analysis.mood}` : ''}{analysis.colors?.length > 0 ? ` · ${analysis.colors.slice(0, 2).join(', ')}` : ''}
                            </p>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-all flex-shrink-0 ${isImageDescExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`grid transition-all duration-200 ease-out ${isImageDescExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-2 rounded-md bg-background/50 border border-border/30">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground/80 italic leading-relaxed flex-1">
                                    {analysis.imageDescription || 'Analyzing image...'}
                                  </p>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const text = analysis.imageDescription || `${analysis.product} · ${analysis.mood}`;
                                          navigator.clipboard.writeText(text);
                                          toast.success('Copied to clipboard');
                                        }}
                                        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">Copy description</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openFileDialog}
                      className="w-full p-3 rounded-lg border border-dashed border-border hover:border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[11px] text-muted-foreground/50">No image uploaded</span>
                    </button>
                  )}
                </div>

                {/* Tool Content */}
                <div className="p-4 flex flex-col flex-1 overflow-hidden">
                  <h2 className="font-semibold text-base mb-2 flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"><User className="w-3.5 h-3.5 text-primary-foreground" /></span>{t('tools.model')}</h2>
                  <div className="text-xs text-muted-foreground/80 mb-3">
                    {t('model.description')}
                    {uploadedImage && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => analysis?.subjectDescription && setShowModelDetails(!showModelDetails)}
                            disabled={!analysis?.subjectDescription}
                            className={`inline-flex items-center gap-1 ml-1.5 transition-colors ${
                              analysis?.subjectDescription
                                ? 'text-muted-foreground hover:text-foreground/80 cursor-pointer'
                                : 'text-muted-foreground/50 cursor-not-allowed'
                            }`}
                          >
                            <span>{t('model.currentModel')}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showModelDetails ? 'rotate-180' : ''}`} />
                          </button>
                        </TooltipTrigger>
                        {!analysis?.subjectDescription && (
                          <TooltipContent side="bottom">
                            <p className="text-xs">{t('edit.stillAnalyzing')}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                  {showModelDetails && analysis?.subjectDescription && (
                    <div className="mb-3 p-2.5 rounded-lg bg-muted/50 border border-border">
                      <p className="text-[11px] text-muted-foreground/80 italic leading-relaxed">{analysis.subjectDescription}</p>
                    </div>
                  )}

                {/* Model controls wrapper */}
                <div>
                  {/* Preserve Outfit Toggle */}
                  <div className="flex items-center justify-between mb-4 p-2 rounded-lg bg-muted/50 border border-border">
                    <span className="text-sm text-foreground/70">{t('model.preserveOutfit')}</span>
                    <button
                      onClick={() => setKeepClothing(!keepClothing)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        keepClothing ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          keepClothing ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Generate AI Suggestions Button */}
                  <button
                    onClick={() => {
                      if (!uploadedImage) {
                        toast.info(t('common.uploadFirst'));
                        return;
                      }
                      handleGenerateModelSuggestions();
                    }}
                    disabled={isLoadingModelSuggestions}
                    className="w-full px-3 py-2 mb-4 rounded-lg text-sm border border-border hover:border-primary/50 hover:bg-primary/10 text-foreground/70 hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                  {isLoadingModelSuggestions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-muted-foreground/80">{t('model.suggesting')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-primary/70" />
                      {t('model.suggestModels')}
                    </>
                  )}
                </button>

                {/* Reference Models Section */}
                <div className="border-t border-border/50 pt-3 mt-1 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{t('model.referenceModels')}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                            <Info className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[140px]">
                          <p className="text-xs">{t('model.referenceTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {modelReferences.length > 0 && (
                      <button
                        onClick={() => {
                          setModelReferences([]);
                          setSelectedModelRef(null);
                          setModelCustomPrompt('');
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t('model.clearAll')}
                      </button>
                    )}
                  </div>

                  {/* Existing model references */}
                  {modelReferences.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {modelReferences.map((ref) => (
                        <div
                          key={ref.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedModelRef(ref.id);
                            setModelCustomPrompt(t('modelBuilder.usePersonFromReference'));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedModelRef(ref.id);
                              setModelCustomPrompt(t('modelBuilder.usePersonFromReference'));
                            }
                          }}
                          className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            selectedModelRef === ref.id
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModelReferences(prev => prev.filter(r => r.id !== ref.id));
                              if (selectedModelRef === ref.id) {
                                setSelectedModelRef(null);
                                setModelCustomPrompt('');
                              }
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/50 hover:bg-black/70 transition-colors"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add model reference button */}
                  <button
                    onClick={() => modelRefInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <UserPlus className="w-4 h-4 text-muted-foreground/50" />
                    {t('model.addReferenceModel')}
                  </button>

                  {/* Hidden file input */}
                  <input
                    ref={modelRefInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleModelRefUpload}
                  />
                </div>

                {/* AI-Generated Suggestions with Skeleton Loading */}
                {(isLoadingModelSuggestions || modelSuggestions.length > 0) && (
                  <div className="mb-4">
                    <h3 className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-2">{t('model.aiSuggestions')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {isLoadingModelSuggestions ? (
                        <>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-8 rounded-full bg-muted/50 border border-border animate-pulse"
                              style={{ width: `${80 + Math.random() * 50}px` }}
                            />
                          ))}
                        </>
                      ) : (
                        modelSuggestions.map((suggestion) => {
                          const isUsed = usedModelSuggestions.has(suggestion.id);
                          return (
                            <button
                              key={suggestion.id}
                              onClick={() => {
                                if (!uploadedImage) {
                                  toast.info(t('common.uploadFirst'));
                                  return;
                                }
                                setUsedModelSuggestions(prev => new Set([...prev, suggestion.id]));
                                handleApplyModelChange(suggestion.prompt, suggestion.name);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${
                                isUsed
                                  ? 'bg-green-500/20 border border-green-500/40 text-green-700 dark:text-green-700 dark:text-green-400'
                                  : 'bg-primary/20 border border-primary/40 hover:bg-primary/30 hover:border-primary/60 text-primary'
                              }`}
                              title={suggestion.description}
                            >
                              {isUsed && <Check className="w-3 h-3" />}
                              {suggestion.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Model Builder */}
                <div className="flex-1 overflow-y-auto touch-scroll pr-2 md:pr-0 pb-20 md:pb-16">
                  {/* Collapsible Header */}
                  <button
                    onClick={() => setIsModelBuilderExpanded(!isModelBuilderExpanded)}
                    className="w-full px-3 py-2 mb-3 rounded-lg text-sm border border-border hover:border-primary/50 hover:bg-primary/10 text-foreground/70 hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isModelBuilderExpanded ? 'rotate-180' : ''}`} />
                    <span>{t('model.modelBuilder')}</span>
                  </button>

                  {isModelBuilderExpanded && (
                  <div className="space-y-3">
                  {/* Gender */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.gender.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.gender.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedGender(selectedGender === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedGender === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.gender[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Range */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.ageRange.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.ageRange.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedAgeRange(selectedAgeRange === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedAgeRange === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.ageRange[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ethnicity */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.ethnicity.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.ethnicity.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedEthnicity(selectedEthnicity === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedEthnicity === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.ethnicity[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Color */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.hairColor.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.hairColor.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedHairColor(selectedHairColor === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedHairColor === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.hairColor[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Type */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.hairType.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.hairType.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedHairType(selectedHairType === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedHairType === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.hairType[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body Type */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.bodyType.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.bodyType.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedBodyType(selectedBodyType === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedBodyType === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.bodyType[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expression/Mood */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.expression.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.expression.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedExpression(selectedExpression === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedExpression === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.expression[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vibe/Energy */}
                  <div>
                    <label className="text-xs text-muted-foreground/80 mb-1.5 block">{t('modelBuilder.vibe.title')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MODEL_OPTIONS.vibe.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedVibe(selectedVibe === option.id ? null : option.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            selectedVibe === option.id
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'bg-muted/50 text-foreground/70 border border-border hover:bg-muted'
                          }`}
                        >
                          {t(MODEL_OPTION_KEYS.vibe[option.id])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={clearModelSelections}
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-muted/50 hover:bg-muted border border-border transition-colors text-foreground/70"
                  >
                    Clear
                  </button>
                  <button
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      handleApplyModelBuilder();
                      // Brief visual feedback
                      btn.textContent = '✓ Generating';
                      btn.classList.add('bg-green-600');
                      btn.classList.remove('bg-primary');
                      setTimeout(() => {
                        btn.textContent = 'Generate';
                        btn.classList.remove('bg-green-600');
                        btn.classList.add('bg-primary');
                      }, 800);
                    }}
                    disabled={!selectedGender && !selectedAgeRange && !selectedEthnicity && !selectedHairColor && !selectedHairType && !selectedBodyType && !selectedExpression && !selectedVibe}
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Generate
                  </button>
                  </div>
                  </div>
                  )}
                </div>
                </div>
                </div>
              </div>
            )}

            {/* No tool selected */}
            {selectedTool === null && uploadedImage && (
              <div className="animate-in fade-in duration-200 p-4 flex-1 flex flex-col items-center justify-center text-center">
                <Info className="w-8 h-8 text-foreground/20 mb-3" />
                <p className="text-muted-foreground/70 text-sm">Select a tool from the sidebar to get started</p>
              </div>
            )}

            {/* Variation Cards - Show for iterations tool when image uploaded */}
            {selectedTool === 'iterations' && uploadedImage && (
              <div className="flex-1 overflow-y-auto px-4 pr-2 md:pr-4 pb-20 md:pb-4 space-y-3 touch-scroll">
                {/* Base Version Cards - Original and any "New Versions" */}
                {baseVersions.map((base, baseIdx) => {
                  const isActive = activeBaseId === base.id && selectedVariationId === null;
                  const isOriginal = base.id === 'original';
                  const editCount = base.versions.length - 1;
                  const resizeCount = base.resizedVersions.filter(r => r.status === 'completed').length;

                  return (
                    <div
                      key={base.id}
                      onClick={() => {
                        setActiveBaseId(base.id);
                        setSelectedVariationId(null);
                        setViewingResizedSize(null);
                      }}
                      className={`rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? isOriginal ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/10' : 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50 hover:border-border'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            <img
                              src={base.baseImageUrl}
                              alt={base.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isOriginal ? (
                                <ImageIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                              ) : (
                                <Layers className="w-4 h-4 text-primary" />
                              )}
                              <span className={`font-medium text-sm ${isOriginal ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'}`}>
                                {base.name}
                              </span>
                              {editCount > 0 && (
                                <span className="text-xs text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                                  {editCount} edit{editCount > 1 ? 's' : ''}
                                </span>
                              )}
                              {resizeCount > 0 && (
                                <span className="text-xs text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                                  {resizeCount + 1} sizes
                                </span>
                              )}
                              {/* Delete button */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBaseVersion(base.id);
                                    }}
                                    disabled={!canDeleteBaseVersion(base.id)}
                                    className="ml-auto p-1 rounded hover:bg-red-500/20 text-muted-foreground/50 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {canDeleteBaseVersion(base.id)
                                    ? isOriginal ? 'Delete image' : 'Delete version'
                                    : 'Cannot delete (has edits or variations)'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="text-xs text-muted-foreground/80 truncate">
                              {isOriginal ? uploadedImage.filename : base.sourceLabel}
                            </p>
                            {isOriginal && (
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {uploadedImage.aspectRatio.includes('(')
                                  ? uploadedImage.aspectRatio
                                  : `${uploadedImage.aspectRatio} • ${uploadedImage.width}×${uploadedImage.height}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Divider - only show when there are variations */}
              {variations.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground/50 uppercase tracking-wide">{t('common.suggested')}</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
              )}

              {variations.filter(v => !v.isArchived).map((variation) => (
                <div
                  key={variation.id}
                  onClick={() => variation.imageUrl && setSelectedVariationId(variation.id)}
                  className={`rounded-xl border transition-all ${
                    selectedVariationId === variation.id
                      ? 'border-primary bg-primary/10'
                      : variation.hasNewVersion
                      ? 'border-green-500/50 bg-green-500/5 hover:border-green-500'
                      : 'border-border bg-muted/50 hover:border-border'
                  } ${variation.imageUrl ? 'cursor-pointer' : ''}`}
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                        {variation.status === 'generating' ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
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
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-foreground/20 text-xs text-center px-1">
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
                                        ? 'bg-primary'
                                        : idx === variation.versions.length - 1 && variation.hasNewVersion
                                        ? 'bg-green-500 animate-pulse'
                                        : 'bg-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            {/* New version indicator */}
                            {variation.hasNewVersion && (
                              <span className="text-[10px] text-green-700 dark:text-green-400 font-medium">
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
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors"
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
                                        handleGenerateSingle(variation.id);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-primary/20 text-primary hover:text-primary transition-colors"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('common.generate')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteVariation(variation.id);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground/70 hover:text-red-400 transition-colors"
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
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('common.archive')}</TooltipContent>
                                </Tooltip>
                                <span className="text-green-700 dark:text-green-400">
                                  <Check className="w-4 h-4" />
                                </span>
                              </>
                            )}
                            {variation.isRegenerating && (
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            )}
                          </div>
                        </div>

                        {variation.isEditing ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Textarea
                              value={variation.description}
                              onChange={(e) => handleUpdateDescription(variation.id, e.target.value)}
                              className="text-xs bg-muted/50 border-border text-foreground/80 min-h-[60px] resize-none"
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
                            className={`text-xs text-muted-foreground/80 line-clamp-3 ${variation.status === 'idle' ? 'cursor-text hover:text-foreground/70' : ''}`}
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
                                  <span className="text-[10px] text-muted-foreground/50">Sizes:</span>
                                  {variation.resizedVersions
                                    .filter(r => r.status === 'completed')
                                    .map(r => (
                                      <span
                                        key={r.size}
                                        className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30"
                                      >
                                        {r.size}
                                      </span>
                                    ))}
                                  {variation.resizedVersions.some(r => r.status === 'resizing') && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground/80 flex items-center gap-1">
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
                                className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors"
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

              {/* Archived Section */}
              {variations.filter(v => v.isArchived).length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                      <Archive className="w-4 h-4" />
                      <span>Archived ({variations.filter(v => v.isArchived).length})</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground/70 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                  </button>

                  {showArchived && (
                    <div className="mt-2 space-y-2">
                      {variations.filter(v => v.isArchived).map((variation) => (
                        <div
                          key={variation.id}
                          className="rounded-xl border border-border bg-muted/30 p-3"
                        >
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-12 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
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
                                <h4 className="text-sm font-medium text-muted-foreground/80 truncate">{variation.title}</h4>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleRestoreVariation(variation.id)}
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/70 hover:text-foreground/70 transition-colors"
                                    >
                                      <ArchiveRestore className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('common.restore')}</TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-xs text-muted-foreground/50 line-clamp-2 mt-0.5">{variation.description}</p>
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
          </div>
        </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-30 md:hidden safe-area-pb">
        <div className="flex items-stretch h-14">
          <button
            onClick={() => {
              setSelectedTool('iterations');
              setIsMobileSidebarOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-1 rounded-lg transition-all ${selectedTool === 'iterations' ? 'bg-primary/15' : ''}`}
          >
            <Layers className={`w-5 h-5 transition-colors ${selectedTool === 'iterations' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium transition-colors ${selectedTool === 'iterations' ? 'text-primary' : 'text-muted-foreground'}`}>{t('tools.iterations')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedTool('edit');
              setIsMobileSidebarOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-1 rounded-lg transition-all ${selectedTool === 'edit' ? 'bg-primary/15' : ''}`}
          >
            <Wand2 className={`w-5 h-5 transition-colors ${selectedTool === 'edit' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium transition-colors ${selectedTool === 'edit' ? 'text-primary' : 'text-muted-foreground'}`}>{t('tools.edit')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedTool('backgrounds');
              setIsMobileSidebarOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-1 rounded-lg transition-all ${selectedTool === 'backgrounds' ? 'bg-primary/15' : ''}`}
          >
            <ImageIcon className={`w-5 h-5 transition-colors ${selectedTool === 'backgrounds' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium transition-colors ${selectedTool === 'backgrounds' ? 'text-primary' : 'text-muted-foreground'}`}>{t('tools.backgrounds')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedTool('model');
              setIsMobileSidebarOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-1 rounded-lg transition-all ${selectedTool === 'model' ? 'bg-primary/15' : ''}`}
          >
            <User className={`w-5 h-5 transition-colors ${selectedTool === 'model' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium transition-colors ${selectedTool === 'model' ? 'text-primary' : 'text-muted-foreground'}`}>{t('tools.model')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedTool('export');
              setIsMobileSidebarOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-1 rounded-lg transition-all ${selectedTool === 'export' ? 'bg-primary/15' : ''}`}
          >
            <Expand className={`w-5 h-5 transition-colors ${selectedTool === 'export' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium transition-colors ${selectedTool === 'export' ? 'text-primary' : 'text-muted-foreground'}`}>{t('tools.export')}</span>
          </button>
        </div>
      </div>

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

      {/* New Image Confirmation Modal */}
      <Dialog open={showNewConfirmModal} onOpenChange={setShowNewConfirmModal}>
        <DialogContent className="sm:max-w-md !bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">Start Fresh?</DialogTitle>
            <DialogDescription className="text-foreground/70 mt-2">
              Uploading a new image will delete this session and all your current work.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={() => {
                setShowNewConfirmModal(false);
                setSelectedTool('export');
              }}
              variant="outline"
              className="w-full bg-muted hover:bg-muted border-border text-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download First
            </Button>
            <Button
              onClick={() => {
                handleReset();
                // Open file picker after clearing state
                setTimeout(() => openFileDialog(), 0);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Workspace Confirmation Modal */}
      <Dialog open={showClearConfirmModal} onOpenChange={setShowClearConfirmModal}>
        <DialogContent className="sm:max-w-md !bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('dialogs.clearWorkspace')}</DialogTitle>
            <DialogDescription className="text-foreground/70 mt-2">
              {t('dialogs.clearWorkspaceDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowClearConfirmModal(false)}
              variant="outline"
              className="flex-1 bg-muted hover:bg-muted border-border text-foreground"
            >
              No thanks
            </Button>
            <Button
              onClick={() => {
                handleReset();
                setShowClearConfirmModal(false);
              }}
              variant="destructive"
              className="flex-1"
            >
              Yes, clear workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Key Setup Modal */}
      <ApiKeySetupModal
        open={showApiKeySetup}
        onOpenChange={setShowApiKeySetup}
        onGeminiKeySet={handleSetApiKey}
        onOpenAIKeySet={handleSetOpenAIKey}
        onDashScopeKeySet={handleSetDashScopeKey}
        currentGeminiKey={apiKey}
        currentOpenAIKey={openaiApiKey}
        currentDashScopeKey={dashscopeApiKey}
        initialTab={apiKeyModalTab}
      />

      {/* Welcome Modal (first visit only) */}
      <WelcomeModal
        open={showWelcome}
        onOpenChange={(open) => {
          setShowWelcome(open);
          if (!open) {
            localStorage.setItem('statickit_has_visited', 'true');
          }
        }}
        onApiKeySet={handleSetApiKey}
        onOpenAIKeySet={handleSetOpenAIKey}
      />

      {/* Resume Session Modal */}
      {resumeSessionData && (
        <ResumeSessionModal
          open={showResumeSessionModal}
          onOpenChange={setShowResumeSessionModal}
          thumbnailUrl={resumeSessionData.thumbnailUrl}
          savedAt={resumeSessionData.savedAt}
          sessionSize={resumeSessionData.size}
          onContinue={handleContinueSession}
          onStartFresh={handleStartFresh}
          isLoading={isRestoringSession}
        />
      )}

      {!uploadedImage && <Footer />}
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
