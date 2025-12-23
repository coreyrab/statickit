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
  Layers,
  Sun,
  Palette,
  Camera,
  Droplets,
  Clock,
  Aperture,
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
// PlanSelectionModal hidden for BYOK-only mode
// import { PlanSelectionModal } from '@/components/PlanSelectionModal';

type Step = 'upload' | 'editor';
type Tool = 'edit' | 'iterations' | 'export' | 'backgrounds' | null;

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
  // const [showPlanSelection, setShowPlanSelection] = useState(false); // Hidden for BYOK-only mode
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSuggestingIteration, setIsSuggestingIteration] = useState(false);
  const [isAnalyzingForIterations, setIsAnalyzingForIterations] = useState(false);
  const [numGenerations, setNumGenerations] = useState(5);
  const [showCustomIteration, setShowCustomIteration] = useState(false);
  const [customIterationDescription, setCustomIterationDescription] = useState('');

  // Get current user's subscription status and BYOK status
  const dbUser = useQuery(api.users.getCurrent);
  const hasApiKey = useQuery(api.users.hasApiKey);
  const ADMIN_EMAILS = ['coreyrab@gmail.com'];
  const isAdmin = dbUser?.email && ADMIN_EMAILS.includes(dbUser.email.toLowerCase());
  const hasSubscription = isAdmin || (dbUser?.plan && dbUser.plan !== 'none' && dbUser.credits > 0);
  // User can access editor if they have BYOK key OR subscription
  const canAccessEditor = isAdmin || hasSubscription || hasApiKey;
  // User can save to history only if they have subscription (BYOK-only users cannot save)
  const canSaveToHistory = isAdmin || hasSubscription;

  // Debug: log user info
  console.log('dbUser:', dbUser, 'isAdmin:', isAdmin, 'hasSubscription:', hasSubscription, 'hasApiKey:', hasApiKey);
  const [showArchived, setShowArchived] = useState(false);
  const [showCustomVariationInput, setShowCustomVariationInput] = useState(false);

  // Original image editing state
  const [originalEditPrompt, setOriginalEditPrompt] = useState('');
  // isEditingOriginal removed - now tracking per-version with status field
  const [originalVersions, setOriginalVersions] = useState<ImageVersion[]>([]);
  const [originalVersionIndex, setOriginalVersionIndex] = useState(0);
  const [originalResizedVersions, setOriginalResizedVersions] = useState<ResizedVersion[]>([]);

  // Backgrounds tool state
  const [backgroundSuggestions, setBackgroundSuggestions] = useState<{id: string, name: string, prompt: string}[]>([]);
  const [isLoadingBackgroundSuggestions, setIsLoadingBackgroundSuggestions] = useState(false);
  const [backgroundCustomPrompt, setBackgroundCustomPrompt] = useState('');

  // Presets state
  const [selectedPresets, setSelectedPresets] = useState<{
    lighting: string | null;
    style: string | null;
    camera: string | null;
    mood: string | null;
    color: string | null;
    era: string | null;
    hardware: string | null;
  }>({ lighting: null, style: null, camera: null, mood: null, color: null, era: null, hardware: null });
  const [expandedPresetCategory, setExpandedPresetCategory] = useState<string | null>(null);
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
    camera: [
      { id: 'shallow-dof', name: 'Shallow DOF', prompt: 'Apply shallow depth of field effect: simulate f/1.4 aperture, creamy smooth bokeh in background, circular out-of-focus highlights, subject tack-sharp, professional portrait-style background separation, maintain the subject exactly as it is' },
      { id: 'wide-angle', name: 'Wide Angle', prompt: 'Apply wide angle lens perspective: simulate 16-24mm focal length, expanded field of view, subtle barrel distortion at edges, exaggerated perspective with closer objects appearing larger, dramatic sense of space, maintain the subject exactly as it is' },
      { id: 'macro', name: 'Macro', prompt: 'Apply macro lens close-up effect: extreme fine detail visibility, simulate 1:1 magnification ratio, very shallow plane of focus, visible surface textures and micro-details, scientific precision, maintain the subject exactly as it is' },
      { id: 'portrait-85mm', name: 'Portrait 85mm', prompt: 'Apply 85mm portrait lens look: flattering facial compression, smooth creamy background bokeh at f/1.8, classic portrait photography perspective, beautiful subject-background separation, maintain the subject exactly as it is' },
      { id: 'tilt-shift', name: 'Tilt Shift', prompt: 'Apply tilt-shift miniature effect: selective focus plane at an angle, blur at top and bottom of frame, scene appears like a tiny diorama or model, toy-like surreal appearance, maintain the subject in the focused area exactly as it is' },
      { id: 'birds-eye', name: "Bird's Eye", prompt: 'Apply bird\'s eye overhead perspective: viewing angle directly from above at 90 degrees, flat lay composition style, looking straight down at the subject, top-down view, maintain the subject exactly as it is' },
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
    hardware: [
      { id: 'hasselblad', name: 'Hasselblad X2D', prompt: 'Apply Hasselblad medium format camera look: exceptional detail and resolution, medium format sensor rendering, smooth tonal transitions, Hasselblad Natural Color Solution color science, ultra-fine detail in highlights and shadows, studio-quality commercial photography aesthetic, maintain all subjects exactly as they are' },
      { id: 'canon-r5', name: 'Canon EOS R5', prompt: 'Apply Canon EOS R5 camera look: Canon color science with warm pleasing skin tones, excellent dynamic range, vibrant but natural colors, professional full-frame rendering, flagship Canon image quality, maintain all subjects exactly as they are' },
      { id: 'sony-a7rv', name: 'Sony a7R V', prompt: 'Apply Sony a7R V camera look: ultra high resolution detail, Sony color science with accurate true-to-life colors, exceptional sharpness and clarity, professional mirrorless quality, precise highlight and shadow detail, maintain all subjects exactly as they are' },
      { id: 'nikon-z8', name: 'Nikon Z8', prompt: 'Apply Nikon Z8 camera look: Nikon color science with rich natural tones, excellent skin tone rendering, professional-grade image quality, balanced contrast, versatile all-rounder aesthetic, maintain all subjects exactly as they are' },
      { id: 'film-35mm', name: '35mm Film Camera', prompt: 'Apply vintage 35mm film camera look: authentic analog film grain, classic SLR camera rendering, Kodak or Fuji film emulation, mechanical camera aesthetic, nostalgic film photography look with natural imperfections, soft organic detail, maintain all subjects exactly as they are' },
      { id: 'polaroid', name: 'Polaroid Instant', prompt: 'Apply Polaroid instant camera look: characteristic Polaroid color cast, slightly faded and washed out tones, soft dreamy focus, instant film texture, vintage instant photography aesthetic, white border framing feel, nostalgic lo-fi charm, maintain all subjects exactly as they are' },
      { id: 'security-cam', name: 'Security Camera', prompt: 'Apply security camera / Ring doorbell look: lower resolution appearance, slight wide-angle distortion, surveillance camera aesthetic, timestamp overlay style, infrared night-vision green tint option, grainy compressed video still quality, utilitarian lo-fi look, maintain all subjects exactly as they are' },
    ],
  };

  // Background suggestions for the Backgrounds tool
  const BACKGROUND_SUGGESTIONS = [
    // Scene/Location backgrounds
    { id: 'blur-bg', name: 'Blur Background', prompt: 'Blur the background to create depth of field effect, keep main subject perfectly sharp' },
    { id: 'white-studio', name: 'White Studio', prompt: 'Clean white studio background with soft shadows, professional ecommerce style' },
    { id: 'outdoor-nature', name: 'Outdoor Nature', prompt: 'Natural outdoor setting with greenery, trees, and soft natural light' },
    { id: 'urban-street', name: 'Urban Street', prompt: 'Modern urban street scene with city architecture and contemporary elements' },
    { id: 'minimalist-gradient', name: 'Minimalist Gradient', prompt: 'Simple gradient background fading from light to dark, modern editorial style' },
    { id: 'office-workspace', name: 'Office/Workspace', prompt: 'Modern office or workspace setting with desk and professional environment' },
    { id: 'beach-coastal', name: 'Beach/Coastal', prompt: 'Beach or coastal setting with ocean, sand, and warm sunlight' },
    { id: 'coffee-shop', name: 'Coffee Shop', prompt: 'Cozy coffee shop or cafe interior with warm ambient lighting' },
    { id: 'darken-bg', name: 'Darken Background', prompt: 'Darken the background for dramatic subject emphasis' },
    { id: 'simplify-scene', name: 'Simplify Scene', prompt: 'Reduce visual clutter, remove distracting elements from background' },
    // Time of day lighting
    { id: 'golden-hour', name: 'Golden Hour', prompt: 'Warm golden hour lighting with soft orange and amber tones, long shadows, sunset or sunrise atmosphere' },
    { id: 'sunrise-glow', name: 'Sunrise Glow', prompt: 'Soft early morning sunrise light with pink and orange hues, gentle warm glow, dawn atmosphere' },
    { id: 'blue-hour', name: 'Blue Hour', prompt: 'Twilight blue hour lighting with cool blue and purple tones, dramatic cinematic atmosphere' },
    { id: 'moonlit-night', name: 'Moonlit Night', prompt: 'Nighttime scene with soft moonlight illumination, cool blue tones, subtle shadows, nocturnal atmosphere' },
    { id: 'bright-midday', name: 'Bright Midday', prompt: 'Bright midday summer sun with high contrast, strong overhead lighting, vibrant colors' },
    { id: 'winter-light', name: 'Winter Light', prompt: 'Cool winter sunlight with low angle, soft cool blue tones, crisp clear atmosphere' },
    // Weather conditions
    { id: 'overcast-sky', name: 'Overcast Sky', prompt: 'Soft overcast lighting with diffused clouds, no harsh shadows, even gentle illumination' },
    { id: 'foggy-misty', name: 'Foggy/Misty', prompt: 'Atmospheric fog or mist in the background, ethereal dreamy quality, soft diffused light' },
    { id: 'rainy-day', name: 'Rainy Day', prompt: 'Rainy day atmosphere with wet surfaces, reflections, moody overcast sky, atmospheric mood' },
  ];

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

  // Keyboard navigation for version control (left/right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const selectedVariation = variations.find(v => v.id === selectedVariationId);
      const isShowingGenerated = selectedVariation && selectedVariation.imageUrl;

      if (e.shiftKey && e.key === 'ArrowLeft') {
        // Shift + Left = Previous tool
        const tools: Tool[] = ['iterations', 'edit', 'backgrounds', 'export'];
        setSelectedTool(prev => {
          if (prev === null) return 'export'; // Start from end
          const currentIndex = tools.indexOf(prev);
          return currentIndex <= 0 ? null : tools[currentIndex - 1];
        });
      } else if (e.shiftKey && e.key === 'ArrowRight') {
        // Shift + Right = Next tool
        const tools: Tool[] = ['iterations', 'edit', 'backgrounds', 'export'];
        setSelectedTool(prev => {
          if (prev === null) return 'iterations'; // Start from beginning
          const currentIndex = tools.indexOf(prev);
          return currentIndex >= tools.length - 1 ? null : tools[currentIndex + 1];
        });
      } else if (e.key === 'ArrowLeft') {
        if (isShowingGenerated && selectedVariation.versions.length > 1) {
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
        if (isShowingGenerated && selectedVariation.versions.length > 1) {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVariationId, variations, originalVersions, originalVersionIndex]);

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

      // For non-resized edits, immediately add a processing version
      let newVersionIndex: number | null = null;
      if (!viewingOriginalResizedSize) {
        const currentVersions: ImageVersion[] = originalVersions.length === 0
          ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
          : originalVersions;

        const processingVersion: ImageVersion = {
          imageUrl: null,
          prompt: editPromptUsed,
          parentIndex: originalVersionIndex,
          status: 'processing'
        };
        const newVersions = [...currentVersions, processingVersion];
        newVersionIndex = newVersions.length - 1;
        setOriginalVersions(newVersions);
        // Don't auto-switch to the processing version - user can continue working
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
        } else if (newVersionIndex !== null) {
          // Update the processing version with the completed image
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === newVersionIndex
              ? { ...v, imageUrl: newImageUrl, status: 'completed' as const }
              : v
          ));
        }
      } else {
        // Mark version as error
        if (newVersionIndex !== null) {
          setOriginalVersions(prev => prev.map((v, idx) =>
            idx === newVersionIndex
              ? { ...v, status: 'error' as const }
              : v
          ));
        }
      }
    } catch (err) {
      console.error('Original edit error:', err);
    }
  };

  // Apply presets to the current image
  const handleApplyPresets = async () => {
    if (!uploadedImage) return;

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
    addPreset('camera', selectedPresets.camera);
    addPreset('mood', selectedPresets.mood);
    addPreset('color', selectedPresets.color);
    addPreset('era', selectedPresets.era);
    addPreset('hardware', selectedPresets.hardware);

    if (prompts.length === 0) return;

    // Build preset label for the version history
    const presetLabel = presetNames.filter(Boolean).join(' + ') + ' [preset]';

    // Clear selections immediately
    setSelectedPresets({ lighting: null, style: null, camera: null, mood: null, color: null, era: null, hardware: null });

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

      // Immediately add a processing version
      const currentVersions: ImageVersion[] = originalVersions.length === 0
        ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
        : originalVersions;

      const processingVersion: ImageVersion = {
        imageUrl: null,
        prompt: presetLabel,
        parentIndex: originalVersionIndex,
        status: 'processing'
      };
      const newVersions = [...currentVersions, processingVersion];
      const newVersionIndex = newVersions.length - 1;
      setOriginalVersions(newVersions);

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

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageToEdit,
          mimeType: uploadedImage.file.type,
          analysis: analysisToUse,
          variationDescription: `PRESET APPLICATION: ${combinedPrompt}`,
          aspectRatio: uploadedImage.aspectRatio,
          isEdit: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newImageUrl = data.imageUrl;

        // Update the processing version with the completed image
        setOriginalVersions(prev => prev.map((v, idx) =>
          idx === newVersionIndex
            ? { ...v, imageUrl: newImageUrl, status: 'completed' as const }
            : v
        ));
      } else {
        // Mark version as error
        setOriginalVersions(prev => prev.map((v, idx) =>
          idx === newVersionIndex
            ? { ...v, status: 'error' as const }
            : v
        ));
      }
    } catch (err) {
      console.error('Preset apply error:', err);
    }
  };

  // Apply a background change with background-scoped prompt
  const handleApplyBackgroundChange = async (prompt: string, label: string) => {
    if (!uploadedImage) return;

    // Build background label for version history
    const backgroundLabel = `[background] ${label}`;

    // Use functional update to handle concurrent calls correctly
    // Each call will see the latest state and add to it
    let newVersionIndex: number = -1;
    let parentIndex: number = -1;
    let imageToUse: string | null = null;

    setOriginalVersions(prev => {
      const currentVersions: ImageVersion[] = prev.length === 0
        ? [{ imageUrl: uploadedImage.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
        : prev;

      // Find the current version to use as parent
      const safeIndex = Math.min(originalVersionIndex, currentVersions.length - 1);
      const currentVersion = currentVersions[safeIndex] || currentVersions[0];

      // Only allow editing completed versions
      if (!currentVersion || currentVersion.status !== 'completed') {
        return prev; // Don't modify state
      }

      parentIndex = safeIndex;
      imageToUse = currentVersion.imageUrl || uploadedImage.url;

      const processingVersion: ImageVersion = {
        imageUrl: null,
        prompt: backgroundLabel,
        parentIndex: safeIndex,
        status: 'processing'
      };

      newVersionIndex = currentVersions.length;
      return [...currentVersions, processingVersion];
    });

    // If we couldn't create a version, bail out
    if (newVersionIndex === -1 || !imageToUse) {
      return;
    }

    try {
      // imageToUse was captured from the state updater above
      const imageResponse = await fetch(imageToUse);
      const blob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

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
          image: base64,
          mimeType: blob.type,
          analysis: analysisToUse,
          variationDescription: prompt,
          aspectRatio: uploadedImage.aspectRatio,
          isEdit: true,
          isBackgroundOnly: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalVersions(prev => prev.map((v, idx) =>
          idx === newVersionIndex
            ? { ...v, imageUrl: data.imageUrl, status: 'completed' as const }
            : v
        ));
      } else {
        setOriginalVersions(prev => prev.map((v, idx) =>
          idx === newVersionIndex
            ? { ...v, status: 'error' as const }
            : v
        ));
      }
    } catch (err) {
      console.error('Background change error:', err);
      setOriginalVersions(prev => prev.map((v, idx) =>
        idx === newVersionIndex
          ? { ...v, status: 'error' as const }
          : v
      ));
    }
  };

  // Generate AI background suggestions based on current image
  const handleGenerateBackgroundSuggestions = async () => {
    if (!uploadedImage) return;

    setIsLoadingBackgroundSuggestions(true);
    setBackgroundSuggestions([]);

    try {
      // Get current image URL
      const currentVersion = originalVersions.length > 0 ? originalVersions[originalVersionIndex] : null;
      const imageUrl = currentVersion?.imageUrl || uploadedImage.url;

      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Use analysis if available for better suggestions
      const analysisToUse = analysis || {
        product: 'Unknown',
        brand_style: 'Not specified',
        target_audience: 'General',
        mood: 'Not specified',
      };

      const response = await fetch('/api/suggest-backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: blob.type,
          analysis: analysisToUse,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackgroundSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Background suggestions error:', err);
    } finally {
      setIsLoadingBackgroundSuggestions(false);
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
    if (!uploadedImage) return;

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

  // Create a new version from the current image (makes it a new base to edit on top of)
  const handleCreateVersion = (imageUrl: string, sourceLabel: string) => {
    const currentVersions: ImageVersion[] = originalVersions.length === 0
      ? [{ imageUrl: uploadedImage!.url, prompt: null, parentIndex: -1, status: 'completed' as const }]
      : originalVersions;

    const newVersion: ImageVersion = {
      imageUrl,
      prompt: sourceLabel,
      parentIndex: currentVersions.length - 1,
      status: 'completed'
    };

    const newVersions = [...currentVersions, newVersion];
    setOriginalVersions(newVersions);
    setOriginalVersionIndex(newVersions.length - 1);

    // Switch to viewing original (non-generated) to show the new version
    setIsShowingGenerated(false);
    setSelectedVariationId(null);
  };

  // Delete the current version and navigate to the previous one
  const handleDeleteVersion = () => {
    if (originalVersionIndex === 0 || originalVersions.length <= 1) return;

    setOriginalVersions(prev => {
      const newVersions = prev.filter((_, idx) => idx !== originalVersionIndex);
      return newVersions;
    });

    // Navigate to previous version
    setOriginalVersionIndex(Math.max(0, originalVersionIndex - 1));
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

    // BYOK-only users cannot save to history
    if (!canSaveToHistory) {
      alert('Saving to history requires a subscription. You can still download your images directly.');
      return;
    }

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
    // User is signed in, check if they have BYOK key configured
    if (dbUser !== undefined && !canAccessEditor) {
      // Redirect to settings to add API key
      router.push('/settings');
      return;
    }
    action();
  };

  // Handle successful sign-in - check if API key is needed
  useEffect(() => {
    if (user && showSignUpPrompt) {
      setShowSignUpPrompt(false);
      // After sign-in, check if user needs to add API key (wait for dbUser to load)
      if (dbUser !== undefined && !canAccessEditor) {
        // Redirect to settings to add API key
        router.push('/settings');
      } else if (pendingAction && canAccessEditor) {
        // User has API key, execute pending action
        pendingAction();
        setPendingAction(null);
      }
    }
  }, [user, dbUser, canAccessEditor, showSignUpPrompt, pendingAction, router]);

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
                <button
                  onClick={() => setSelectedTool('iterations')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                    selectedTool === 'iterations'
                      ? 'bg-amber-600 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Versions
                </button>

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

                <button
                  onClick={() => setSelectedTool('backgrounds')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                    selectedTool === 'backgrounds'
                      ? 'bg-amber-600 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Backgrounds
                </button>

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
                            idx === originalVersionIndex ? 'text-emerald-500' : 'text-white/50'
                          }`}
                        />
                      ) : (
                        <button
                          key={idx}
                          onClick={() => version.status === 'completed' && setOriginalVersionIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            version.status === 'error'
                              ? 'bg-red-500/50'
                              : idx === originalVersionIndex
                                ? 'bg-emerald-500 scale-110'
                                : 'bg-white/30 hover:bg-white/50'
                          }`}
                        />
                      )
                    ))}
                  </div>
                  {/* Label row - changes but dots stay fixed */}
                  <span className="text-xs text-white/50 text-center">
                    {originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing' ? (
                      <span className="italic text-white/40">Processing...</span>
                    ) : originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'error' ? (
                      <span className="italic text-red-400">Error - try again</span>
                    ) : originalVersions.length > 0 && originalVersions[originalVersionIndex]?.prompt ? (
                      originalVersions[originalVersionIndex].prompt.includes('[preset]') ? (
                        <span>
                          <span className="text-amber-400">[preset]</span>
                          <span className="italic text-white/60"> {originalVersions[originalVersionIndex].prompt.replace(' [preset]', '')}</span>
                        </span>
                      ) : (
                        <span className="italic text-white/60">"{originalVersions[originalVersionIndex].prompt}"</span>
                      )
                    ) : (
                      uploadedImage.filename
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
                            : 'bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                    {selectedVariation.isRegenerating && (
                      <Loader2 className="w-2.5 h-2.5 text-white/50 animate-spin" />
                    )}
                  </div>
                  {/* Label row */}
                  <span className="text-xs text-white/50 text-center">
                    {selectedVariation.versions[selectedVariation.currentVersionIndex]?.prompt ? (
                      selectedVariation.versions[selectedVariation.currentVersionIndex]?.prompt?.includes('[preset]') ? (
                        <span>
                          <span className="text-amber-400">[preset]</span>
                          <span className="italic text-white/60"> {selectedVariation.versions[selectedVariation.currentVersionIndex]?.prompt?.replace(' [preset]', '')}</span>
                        </span>
                      ) : (
                        <span className="italic text-white/60">"{selectedVariation.versions[selectedVariation.currentVersionIndex]?.prompt}"</span>
                      )
                    ) : (
                      selectedVariation.title
                    )}
                  </span>
                </>
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
                    {(() => {
                      const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                      return (
                        <>
                          <Input
                            placeholder="e.g., 'make the background brighter'"
                            value={originalEditPrompt}
                            onChange={(e) => setOriginalEditPrompt(e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white/80 text-sm placeholder:text-white/30"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && originalEditPrompt.trim() && !currentVersionProcessing) {
                                requireAuth(handleEditOriginal);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => requireAuth(handleEditOriginal)}
                            disabled={!originalEditPrompt.trim() || currentVersionProcessing}
                            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
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
            <div className="flex-1 flex items-center justify-center bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden relative min-h-0 p-8">
              {previewImage && uploadedImage ? (
                <>
                  {/*
                    Container sized based on what we're viewing:
                    - Original/edits: use original image's aspect ratio
                    - Resized versions: use the target size's aspect ratio (e.g., 9:16 for Story)
                    Uses CSS to calculate max size that fits container while preserving aspect ratio.
                  */}
                  {(() => {
                    // Determine display dimensions based on whether viewing a resize
                    const displayDimensions = viewingOriginalResizedSize
                      ? AD_SIZES.find(s => s.name === viewingOriginalResizedSize) || { width: uploadedImage.width, height: uploadedImage.height }
                      : { width: uploadedImage.width, height: uploadedImage.height };

                    return (
                      <div
                        className="relative rounded-lg shadow-2xl overflow-hidden"
                        style={{
                          width: '100%',
                          height: '100%',
                          maxWidth: `min(100%, calc((100vh - 200px) * ${displayDimensions.width / displayDimensions.height}))`,
                          maxHeight: `min(100%, calc(100vw * ${displayDimensions.height / displayDimensions.width}))`,
                          aspectRatio: `${displayDimensions.width} / ${displayDimensions.height}`,
                        }}
                      >
                        <img
                          src={previewImage}
                          alt={isShowingGenerated ? 'Generated variation' : 'Original ad'}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    );
                  })()}
                  {/* Loading overlay when viewing a processing version */}
                  {!isShowingGenerated && originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <span className="text-sm text-white/70">Processing...</span>
                      </div>
                    </div>
                  )}
                  {/* Error overlay when viewing a failed version */}
                  {!isShowingGenerated && originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'error' && (
                    <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 max-w-xs text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="w-6 h-6 text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Generation Failed</span>
                        <span className="text-xs text-white/50">The AI couldn't process this edit. This can happen with certain prompts or images. Try a different edit or preset.</span>
                        <button
                          onClick={() => {
                            // Remove the failed version and go back to previous
                            const failedIndex = originalVersionIndex;
                            const parentIndex = originalVersions[failedIndex]?.parentIndex ?? 0;
                            setOriginalVersions(prev => prev.filter((_, idx) => idx !== failedIndex));
                            setOriginalVersionIndex(Math.max(0, parentIndex));
                          }}
                          className="mt-2 px-4 py-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
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
                    {(() => {
                      const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                      return (
                        <>
                          <input
                            type="text"
                            placeholder="Describe an edit..."
                            value={originalEditPrompt}
                            onChange={(e) => setOriginalEditPrompt(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && originalEditPrompt.trim() && !currentVersionProcessing) {
                                requireAuth(handleEditOriginal);
                              }
                            }}
                          />
                          <button
                            onClick={() => requireAuth(handleEditOriginal)}
                            disabled={!originalEditPrompt.trim() || currentVersionProcessing}
                            className="p-2 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4 text-white" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Floating Background Input - shows when backgrounds tool selected */}
              {selectedTool === 'backgrounds' && !isShowingGenerated && uploadedImage && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  <div className="bg-black/70 backdrop-blur-md rounded-full border border-white/20 shadow-2xl flex items-center gap-2 pl-4 pr-1.5 py-1.5">
                    {(() => {
                      const currentVersionProcessing = originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing';
                      return (
                        <>
                          <input
                            type="text"
                            placeholder="Describe a background..."
                            value={backgroundCustomPrompt}
                            onChange={(e) => setBackgroundCustomPrompt(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                            disabled={currentVersionProcessing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && backgroundCustomPrompt.trim() && !currentVersionProcessing) {
                                requireAuth(() => {
                                  handleApplyBackgroundChange(backgroundCustomPrompt, 'Custom background');
                                  setBackgroundCustomPrompt('');
                                });
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              requireAuth(() => {
                                handleApplyBackgroundChange(backgroundCustomPrompt, 'Custom background');
                                setBackgroundCustomPrompt('');
                              });
                            }}
                            disabled={!backgroundCustomPrompt.trim() || currentVersionProcessing}
                            className="p-2 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4 text-white" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Action buttons overlay */}
              {previewImage && (
                <div className="absolute top-3 right-3 flex gap-2">
                  {/* Delete Version button - disabled on original, enabled on edits */}
                  {!isShowingGenerated && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleDeleteVersion}
                          disabled={originalVersionIndex === 0 || originalVersions[originalVersionIndex]?.status === 'processing'}
                          className="p-2 rounded-lg bg-black/50 hover:bg-red-600/80 backdrop-blur-sm text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-black/50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {originalVersionIndex === 0 ? "Can't delete original" : "Delete this edit"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Create Version button - disabled on original, enabled on edits/variations */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          const sourceLabel = isShowingGenerated && selectedVariation
                            ? `From: ${selectedVariation.title}`
                            : originalVersions[originalVersionIndex]?.prompt || 'Edited version';
                          handleCreateVersion(previewImage, sourceLabel);
                        }}
                        disabled={!isShowingGenerated && originalVersionIndex === 0}
                        className="p-2 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-black/50 disabled:cursor-not-allowed"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!isShowingGenerated && originalVersionIndex === 0 ? "Edit image first to create version" : "Create new version"}
                    </TooltipContent>
                  </Tooltip>
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

          {/* Left Panel - Tool Panel */}
          <div className="w-[360px] flex-shrink-0 border border-white/10 rounded-2xl bg-white/[0.02] flex flex-col overflow-hidden order-first">
            {/* Versions Tool */}
            {selectedTool === 'iterations' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold">Versions</h2>
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
                        <Textarea
                          placeholder="Optional: Add additional context to guide the suggestions"
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
              </div>
            )}

            {/* Edit Tool - with resize presets */}
            {selectedTool === 'edit' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 p-4 flex flex-col h-full">
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

                {/* Presets */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-sm font-medium mb-2 text-white/70">Presets</h3>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {/* Lighting */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'lighting' ? null : 'lighting')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-white/60" />
                          <span>Lighting</span>
                          {selectedPresets.lighting && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.lighting.find(p => p.id === selectedPresets.lighting)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'lighting' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'lighting' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.lighting.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                lighting: prev.lighting === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.lighting === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Style */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'style' ? null : 'style')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-white/60" />
                          <span>Style</span>
                          {selectedPresets.style && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.style.find(p => p.id === selectedPresets.style)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'style' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'style' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.style.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                style: prev.style === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.style === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Camera */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'camera' ? null : 'camera')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-white/60" />
                          <span>Camera</span>
                          {selectedPresets.camera && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.camera.find(p => p.id === selectedPresets.camera)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'camera' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'camera' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.camera.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                camera: prev.camera === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.camera === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mood */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'mood' ? null : 'mood')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-white/60" />
                          <span>Mood</span>
                          {selectedPresets.mood && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.mood.find(p => p.id === selectedPresets.mood)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'mood' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'mood' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.mood.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                mood: prev.mood === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.mood === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Color */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'color' ? null : 'color')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-white/60" />
                          <span>Color</span>
                          {selectedPresets.color && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.color.find(p => p.id === selectedPresets.color)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'color' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'color' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.color.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                color: prev.color === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.color === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Era */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'era' ? null : 'era')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-white/60" />
                          <span>Era</span>
                          {selectedPresets.era && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.era.find(p => p.id === selectedPresets.era)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'era' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'era' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.era.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                era: prev.era === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.era === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hardware */}
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedPresetCategory(expandedPresetCategory === 'hardware' ? null : 'hardware')}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Aperture className="w-4 h-4 text-white/60" />
                          <span>Hardware</span>
                          {selectedPresets.hardware && (
                            <span className="text-xs text-amber-400 ml-1">
                              ({PRESETS.hardware.find(p => p.id === selectedPresets.hardware)?.name})
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedPresetCategory === 'hardware' ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedPresetCategory === 'hardware' && (
                        <div className="p-2 space-y-1 bg-black/20">
                          {PRESETS.hardware.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPresets(prev => ({
                                ...prev,
                                hardware: prev.hardware === preset.id ? null : preset.id
                              }))}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm transition-all ${
                                selectedPresets.hardware === preset.id
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'hover:bg-white/10 text-white/70'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply button */}
                  {(selectedPresets.lighting || selectedPresets.style || selectedPresets.camera || selectedPresets.mood || selectedPresets.color || selectedPresets.era || selectedPresets.hardware) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <Button
                        onClick={() => requireAuth(handleApplyPresets)}
                        disabled={originalVersions.length > 0 && originalVersions[originalVersionIndex]?.status === 'processing'}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Apply Preset
                      </Button>
                      <button
                        onClick={() => setSelectedPresets({ lighting: null, style: null, camera: null, mood: null, color: null, era: null, hardware: null })}
                        className="w-full mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                      >
                        Clear selections
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Export Tool */}
            {selectedTool === 'export' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 p-4 flex flex-col h-full">
                <h2 className="font-semibold mb-1">Export</h2>
                <p className="text-xs text-white/50 mb-4">
                  Resize and download your images.
                </p>

                {/* Smart Resize Section */}
                {uploadedImage && (
                  <div className="mb-4">
                    <div className="space-y-1.5">
                      {/* Original size button */}
                      <button
                        onClick={() => setViewingOriginalResizedSize(null)}
                        className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between text-sm ${
                          !viewingOriginalResizedSize
                            ? 'bg-emerald-600/20 border-emerald-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Check className={`w-3.5 h-3.5 ${!viewingOriginalResizedSize ? 'text-emerald-400' : 'text-white/40'}`} />
                          <span className={!viewingOriginalResizedSize ? 'text-emerald-300' : ''}>Original</span>
                        </div>
                        <span className="text-white/40 text-xs">{uploadedImage.width}×{uploadedImage.height}</span>
                      </button>
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
                              if (isCompleted) {
                                setViewingOriginalResizedSize(isViewing ? null : size.name);
                              } else if (!isResizing) {
                                requireAuth(() => handleResizeOriginal(size));
                              }
                            }}
                            disabled={isResizing}
                            className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between text-sm ${
                              isViewing
                                ? 'bg-emerald-600/20 border-emerald-500/40'
                                : isCompleted
                                ? 'bg-amber-600/10 border-amber-500/30 hover:bg-amber-600/20'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isResizing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />
                              ) : isCompleted ? (
                                <Check className={`w-3.5 h-3.5 ${isViewing ? 'text-emerald-400' : 'text-amber-400'}`} />
                              ) : (
                                <div
                                  className="bg-white/20 border border-white/30 rounded-[2px]"
                                  style={{
                                    width: size.width >= size.height ? 14 : 14 * (size.width / size.height),
                                    height: size.height >= size.width ? 14 : 14 * (size.height / size.width),
                                  }}
                                />
                              )}
                              <span className={isViewing ? 'text-emerald-300' : isCompleted ? 'text-amber-300' : ''}>{size.label}</span>
                            </div>
                            <span className="text-white/40 text-xs">{size.name}</span>
                          </button>
                        );
                      })}
                      {/* Generate All link */}
                      {(() => {
                        const ungeneratedSizes = AD_SIZES.filter(size => {
                          const resized = originalResizedVersions.find(r => r.size === size.name);
                          return !resized || resized.status === 'idle' || resized.status === 'error';
                        });
                        const isAnyResizing = originalResizedVersions.some(r => r.status === 'resizing');
                        if (ungeneratedSizes.length === 0) return null;
                        return (
                          <button
                            onClick={() => {
                              requireAuth(() => {
                                ungeneratedSizes.forEach(size => handleResizeOriginal(size));
                              });
                            }}
                            disabled={isAnyResizing}
                            className="w-full mt-2 text-xs text-amber-400 hover:text-amber-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors text-center py-1"
                          >
                            {isAnyResizing ? 'Generating...' : `Generate all ${ungeneratedSizes.length} sizes`}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Download Section */}
                <div className="mt-auto space-y-2">
                  <h3 className="text-xs text-white/40 uppercase tracking-wide mb-2">Download</h3>
                  {uploadedImage && (
                    <button
                      onClick={() => {
                        if (viewingOriginalResizedSize) {
                          const resized = originalResizedVersions.find(r => r.size === viewingOriginalResizedSize);
                          if (resized?.imageUrl) {
                            handleDownload(resized.imageUrl, `${uploadedImage.filename.replace(/\.[^.]+$/, '')}_${viewingOriginalResizedSize}.png`);
                          }
                        } else {
                          handleDownload(uploadedImage.url, uploadedImage.filename);
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Download className="w-4 h-4 text-white/60" />
                      <div>
                        <div className="font-medium">Current View</div>
                        <div className="text-xs text-white/40">
                          {viewingOriginalResizedSize || `${uploadedImage.width}×${uploadedImage.height}`}
                        </div>
                      </div>
                    </button>
                  )}
                  {originalResizedVersions.filter(r => r.status === 'completed').length > 0 && (
                    <button
                      onClick={async () => {
                        if (uploadedImage?.url) {
                          await handleDownload(uploadedImage.url, `original_${uploadedImage.width}x${uploadedImage.height}.png`);
                        }
                        for (const resized of originalResizedVersions.filter(r => r.status === 'completed' && r.imageUrl)) {
                          await handleDownload(resized.imageUrl!, `original_${resized.size}.png`);
                          await new Promise(resolve => setTimeout(resolve, 300));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 transition-all text-left flex items-center gap-3"
                    >
                      <FolderDown className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-medium text-amber-300">Download All Sizes</div>
                        <div className="text-xs text-white/40">
                          {originalResizedVersions.filter(r => r.status === 'completed').length + 1} sizes
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
                          title: 'Download All',
                          fileCount: count,
                          onConfirm: downloadAllGenerations,
                        });
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <FolderDown className="w-4 h-4 text-white/60" />
                      <div>
                        <div className="font-medium">Download All Variations</div>
                        <div className="text-xs text-white/40">{completedCount} generated images</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Backgrounds Tool */}
            {selectedTool === 'backgrounds' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200 p-4 flex flex-col h-full">
                <h2 className="font-semibold mb-1">Backgrounds</h2>
                <p className="text-xs text-white/50 mb-3">
                  Change the background while preserving the product and any models.
                </p>

                {/* Generate AI Suggestions Button - Top */}
                <button
                  onClick={handleGenerateBackgroundSuggestions}
                  disabled={isLoadingBackgroundSuggestions || !uploadedImage}
                  className="w-full px-3 py-2.5 mb-4 rounded-lg text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoadingBackgroundSuggestions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate suggestions
                    </>
                  )}
                </button>

                {/* AI-Generated Suggestions with Skeleton Loading */}
                {(isLoadingBackgroundSuggestions || backgroundSuggestions.length > 0) && (
                  <div className="mb-4">
                    <h3 className="text-xs text-white/40 uppercase tracking-wide mb-2">AI Suggestions</h3>
                    <div className="flex flex-wrap gap-2">
                      {isLoadingBackgroundSuggestions ? (
                        // Skeleton loading placeholders
                        <>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-8 rounded-full bg-white/5 border border-white/10 animate-pulse"
                              style={{ width: `${60 + Math.random() * 40}px` }}
                            />
                          ))}
                        </>
                      ) : (
                        // Actual suggestions as pills
                        backgroundSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => {
                              handleApplyBackgroundChange(suggestion.prompt, suggestion.name);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-500/60 transition-all text-amber-300"
                          >
                            {suggestion.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Common Backgrounds - Compact Grid */}
                <div className="flex-1 overflow-y-auto">
                  <h3 className="text-xs text-white/40 uppercase tracking-wide mb-2">Common Backgrounds</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BACKGROUND_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => {
                          handleApplyBackgroundChange(suggestion.prompt, suggestion.name);
                        }}
                        className="px-2.5 py-2 rounded-lg text-left text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        <span className="text-white/80">{suggestion.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* No tool selected */}
            {selectedTool === null && (
              <div className="animate-in fade-in duration-200 p-4 flex-1 flex flex-col items-center justify-center text-center">
                <Info className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Select a tool from the sidebar to get started</p>
              </div>
            )}

            {/* Variation Cards - Show for iterations tool when image uploaded */}
            {selectedTool === 'iterations' && uploadedImage && (
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {/* Original Image Card - Always at top */}
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
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-sm text-emerald-400">Original</span>
                          {originalVersions.length > 1 && (
                            <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                              {originalVersions.length - 1} edit{originalVersions.length > 2 ? 's' : ''}
                            </span>
                          )}
                          {originalResizedVersions.filter(r => r.status === 'completed').length > 0 && (
                            <span className="text-xs text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              {originalResizedVersions.filter(r => r.status === 'completed').length + 1} sizes
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50">
                          {uploadedImage.filename}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {uploadedImage.aspectRatio.includes('(')
                            ? uploadedImage.aspectRatio
                            : `${uploadedImage.aspectRatio} • ${uploadedImage.width}×${uploadedImage.height}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Divider - only show when there are variations */}
              {variations.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="text-xs text-white/30 uppercase tracking-wide">Suggested</span>
                  <div className="flex-1 border-t border-white/10"></div>
                </div>
              )}

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
                {canSaveToHistory ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveToHistory}
                    className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Save to History
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-white/40">
                      Download your images to keep them. History feature coming soon!
                    </p>
                  </div>
                )}
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

      {/* Plan Selection Modal - Hidden for BYOK-only mode */}

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
