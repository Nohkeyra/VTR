import { create } from 'zustand';
import { Preset } from '../types/presets';
import { ImageModel } from '../services/modelRegistry';
import { ColorPalette } from '../lib/colorPalettes';
import { PerformanceMetric } from '../types/performance';
import { safeLocalStorage } from '../utils/storageUtils';
import { LogEntry } from '../hooks/useLogs';
import { HistoryItem } from '../hooks/useHistory';

export type Tab = 'vectorize' | 'logo design' | 'typography';

export interface AppState {
  // UI State
  activeTab: Tab;
  userInput: string;
  selectedPreset: Preset | null;
  uploadedImage: string | null;
  uploadedMimeType: string | null;
  selectedModel: ImageModel;
  selectedAspectRatio: string;
  selectedLogoType: string;
  selectedLogoLayout: string;
  selectedPalette: ColorPalette | null;
  isDarkMode: boolean;
  showSettings: boolean;
  showCamera: boolean;
  showHistory: boolean;
  showDebug: boolean;
  isHoldingCompare: boolean;
  showColorPalette: boolean;
  showPromptWarning: boolean;
  showDevConsole: boolean;

  // Generation State
  isGenerating: boolean;
  isGeneratingRef: { current: boolean };
  generationProgress: number;
  resultImage: string | string[] | null;
  imageBrightness: number;
  error: string | null;
  lastFinalPrompt: string;
  isAnalyzing: boolean;
  isVisualFidelity: boolean;
  isSimplifiedMode: boolean;
  pendingPromptLength: number;

  // User Preferences
  clientSideMode: boolean;
  favoritePresets: Set<string>;
  usedPresets: Set<string>;

  // Telemetry & Metrics
  metrics: PerformanceMetric[];
  generationCount: number;

  // Logs Hook Logic
  logs: LogEntry[];

  // History Hook Logic
  history: HistoryItem[];

  // Gemini Keys Hook Logic
  geminiKeys: string[];
  activeKeyIndex: number;
}

export interface AppActions {
  // UI Setters
  setActiveTab: (tab: Tab) => void;
  setUserInput: (input: string) => void;
  setSelectedPreset: (preset: Preset | null) => void;
  setUploadedImage: (image: string | null) => void;
  setUploadedMimeType: (mimeType: string | null) => void;
  setSelectedModel: (model: ImageModel) => void;
  setSelectedAspectRatio: (ratio: string) => void;
  setSelectedLogoType: (type: string) => void;
  setSelectedLogoLayout: (layout: string) => void;
  setSelectedPalette: (palette: ColorPalette | null) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowCamera: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
  setShowDebug: (show: boolean) => void;
  setIsHoldingCompare: (holding: boolean) => void;
  setShowColorPalette: (show: boolean) => void;
  setShowPromptWarning: (show: boolean) => void;
  setShowDevConsole: (show: boolean) => void;

  // Generation Setters
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number | ((prev: number) => number)) => void;
  setResultImage: (image: string | string[] | null) => void;
  setImageBrightness: (brightness: number) => void;
  setError: (error: string | null) => void;
  setLastFinalPrompt: (prompt: string) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsVisualFidelity: (fidelity: boolean) => void;
  setIsSimplifiedMode: (simplified: boolean) => void;
  setPendingPromptLength: (length: number) => void;

  // Preferences Setters
  setClientSideMode: (clientSide: boolean) => void;
  toggleFavoritePreset: (presetName: string) => void;
  addUsedPreset: (presetName: string) => void;

  // Metrics Setters
  setMetrics: (metrics: PerformanceMetric[] | ((prev: PerformanceMetric[]) => PerformanceMetric[])) => void;
  setGenerationCount: (count: number | ((prev: number) => number)) => void;

  // Logs Actions
  addLog: (message: string, type?: LogEntry['type'], node?: string, status?: number | string) => void;
  clearLogs: () => void;

  // History Actions
  setHistory: (history: HistoryItem[]) => void;
  addToHistory: (image: string, prompt: string, presetName: string) => void;
  clearHistory: () => void;

  // Gemini Keys Actions
  setGeminiKeys: (keys: string[]) => void;
  setActiveKeyIndex: (index: number) => void;
  getActiveGeminiKey: () => string;
  switchToNextKey: () => boolean;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set, get) => {
  // Non-reactive reference for generation sync
  const isGeneratingRef = { current: false };

  return {
    // UI State
    activeTab: 'vectorize',
    userInput: '',
    selectedPreset: null,
    uploadedImage: null,
    uploadedMimeType: null,
    selectedModel: (safeLocalStorage.getItem('selectedModel') as ImageModel) || 'gemini',
    selectedAspectRatio: '1:1',
    selectedLogoType: '',
    selectedLogoLayout: '',
    selectedPalette: null,
    isDarkMode: true,
    showSettings: false,
    showCamera: false,
    showHistory: false,
    showDebug: false,
    isHoldingCompare: false,
    showColorPalette: false,
    showPromptWarning: false,
    showDevConsole: safeLocalStorage.getItem('showDevConsole') === 'true',

    // Generation State
    isGenerating: false,
    isGeneratingRef,
    generationProgress: 0,
    resultImage: null,
    imageBrightness: 0.5,
    error: null,
    lastFinalPrompt: '',
    isAnalyzing: false,
    isVisualFidelity: false,
    isSimplifiedMode: false,
    pendingPromptLength: 0,

    // User Preferences
    clientSideMode: safeLocalStorage.getItem('clientSideMode') === 'true',
    favoritePresets: (() => {
      try {
        const saved = safeLocalStorage.getItem('favoritePresets');
        if (!saved) return new Set<string>();
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
      } catch (e) {
        console.warn('Error reading favoritePresets from storage:', e);
        return new Set<string>();
      }
    })(),
    usedPresets: new Set<string>(),

    // Telemetry & Metrics
    metrics: [],
    generationCount: 0,

    // Logs Hook Logic
    logs: [],

    // History Hook Logic
    history: (() => {
      try {
        const saved = safeLocalStorage.getItem('genHistory');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Error reading genHistory from storage:', e);
        return [];
      }
    })(),

    // Gemini Keys Hook Logic
    geminiKeys: (() => {
      try {
        const saved = safeLocalStorage.getItem('geminiKeys');
        if (!saved) return [''];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [''];
      } catch (e) {
        console.warn('Error reading geminiKeys from storage:', e);
        return [''];
      }
    })(),
    activeKeyIndex: (() => {
      try {
        const saved = safeLocalStorage.getItem('activeKeyIndex');
        if (!saved) return 0;
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : parsed;
      } catch {
        return 0;
      }
    })(),

    // UI Setters
    setActiveTab: (activeTab) => set({ activeTab }),
    setUserInput: (userInput) => set({ userInput }),
    setSelectedPreset: (selectedPreset) => set({ selectedPreset }),
    setUploadedImage: (uploadedImage) => set({ uploadedImage }),
    setUploadedMimeType: (uploadedMimeType) => set({ uploadedMimeType }),
    setSelectedModel: (selectedModel) => {
      safeLocalStorage.setItem('selectedModel', selectedModel);
      set({ selectedModel });
    },
    setSelectedAspectRatio: (selectedAspectRatio) => set({ selectedAspectRatio }),
    setSelectedLogoType: (selectedLogoType) => set({ selectedLogoType }),
    setSelectedLogoLayout: (selectedLogoLayout) => set({ selectedLogoLayout }),
    setSelectedPalette: (selectedPalette) => set({ selectedPalette }),
    setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
    setShowSettings: (showSettings) => set({ showSettings }),
    setShowCamera: (showCamera) => set({ showCamera }),
    setShowHistory: (showHistory) => set({ showHistory }),
    setShowDebug: (showDebug) => set({ showDebug }),
    setIsHoldingCompare: (isHoldingCompare) => set({ isHoldingCompare }),
    setShowColorPalette: (showColorPalette) => set({ showColorPalette }),
    setShowPromptWarning: (showPromptWarning) => set({ showPromptWarning }),
    setShowDevConsole: (showDevConsole) => {
      safeLocalStorage.setItem('showDevConsole', showDevConsole ? 'true' : 'false');
      set({ showDevConsole });
    },

    // Generation Setters
    setIsGenerating: (isGenerating) => {
      isGeneratingRef.current = isGenerating;
      set({ isGenerating });
    },
    setGenerationProgress: (progress) => {
      set((state) => ({
        generationProgress: typeof progress === 'function' ? progress(state.generationProgress) : progress
      }));
    },
    setResultImage: (resultImage) => set({ resultImage }),
    setImageBrightness: (imageBrightness) => set({ imageBrightness }),
    setError: (error) => set({ error }),
    setLastFinalPrompt: (lastFinalPrompt) => set({ lastFinalPrompt }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    setIsVisualFidelity: (isVisualFidelity) => set({ isVisualFidelity }),
    setIsSimplifiedMode: (isSimplifiedMode) => set({ isSimplifiedMode }),
    setPendingPromptLength: (pendingPromptLength) => set({ pendingPromptLength }),

    // Preferences Setters
    setClientSideMode: (clientSideMode) => {
      safeLocalStorage.setItem('clientSideMode', clientSideMode ? 'true' : 'false');
      set({ clientSideMode });
    },
    toggleFavoritePreset: (presetName) => {
      set((state) => {
        const newFavs = new Set(state.favoritePresets);
        if (newFavs.has(presetName)) {
          newFavs.delete(presetName);
        } else {
          newFavs.add(presetName);
        }
        safeLocalStorage.setItem('favoritePresets', JSON.stringify(Array.from(newFavs)));
        return { favoritePresets: newFavs };
      });
    },
    addUsedPreset: (presetName) => {
      set((state) => {
        const newUsed = new Set(state.usedPresets);
        newUsed.add(presetName);
        return { usedPresets: newUsed };
      });
    },

    // Metrics Setters
    setMetrics: (metrics) => {
      set((state) => ({
        metrics: typeof metrics === 'function' ? metrics(state.metrics) : metrics
      }));
    },
    setGenerationCount: (count) => {
      set((state) => ({
        generationCount: typeof count === 'function' ? count(state.generationCount) : count
      }));
    },

    // Logs Actions
    addLog: (message, type = 'info', node, status) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        message,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        node,
        status
      };
      set((state) => ({ logs: [...state.logs.slice(-19), newLog] }));
    },
    clearLogs: () => {
      set(() => {
        const newLog: LogEntry = {
          id: Math.random().toString(36).substring(7),
          message: 'System logs cleared',
          type: 'success',
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        return { logs: [newLog] };
      });
    },

    // History Actions
    setHistory: (history) => {
      safeLocalStorage.setItem('genHistory', JSON.stringify(history));
      set({ history });
    },
    addToHistory: (image, prompt, presetName) => {
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        prompt,
        presetName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image
      };
      set((state) => {
        const newHistory = [newItem, ...state.history.slice(0, 19)];
        safeLocalStorage.setItem('genHistory', JSON.stringify(newHistory));
        return { history: newHistory };
      });
    },
    clearHistory: () => {
      safeLocalStorage.removeItem('genHistory');
      const { addLog } = get();
      set({ history: [] });
      addLog('Generation history cleared', 'info');
    },

    // Gemini Keys Actions
    setGeminiKeys: (geminiKeys) => {
      safeLocalStorage.setItem('geminiKeys', JSON.stringify(geminiKeys));
      set({ geminiKeys });
    },
    setActiveKeyIndex: (activeKeyIndex) => {
      safeLocalStorage.setItem('activeKeyIndex', activeKeyIndex.toString());
      set({ activeKeyIndex });
    },
    getActiveGeminiKey: () => {
      const { geminiKeys, activeKeyIndex } = get();
      const key = geminiKeys[activeKeyIndex];
      if (key && typeof key === 'string') {
        return key.trim();
      }
      return key || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';
    },
    switchToNextKey: () => {
      const { geminiKeys, activeKeyIndex, addLog } = get();
      if (geminiKeys.length <= 1) {
        return false;
      }
      const nextIndex = (activeKeyIndex + 1) % geminiKeys.length;
      if (nextIndex === 0 && !geminiKeys[0]) {
        return false;
      }
      safeLocalStorage.setItem('activeKeyIndex', nextIndex.toString());
      set({ activeKeyIndex: nextIndex });
      addLog(`Rate limit detected. Switching to Node_0${nextIndex + 1}...`, 'process');
      return true;
    }
  };
});
