import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '../utils/storageUtils';

export function useGeminiKeys(addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'process') => void) {
  const [geminiKeys, setGeminiKeys] = useState<string[]>(() => {
    const saved = safeLocalStorage.getItem('geminiKeys');
    return saved ? JSON.parse(saved) : [''];
  });
  const [activeKeyIndex, setActiveKeyIndex] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('activeKeyIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    safeLocalStorage.setItem('geminiKeys', JSON.stringify(geminiKeys));
  }, [geminiKeys]);

  useEffect(() => {
    safeLocalStorage.setItem('activeKeyIndex', activeKeyIndex.toString());
  }, [activeKeyIndex]);

  const getActiveGeminiKey = useCallback(() => {
    const key = geminiKeys[activeKeyIndex];
    if (key && typeof key === 'string') {
      return key.trim();
    }
    return key || process.env.GEMINI_API_KEY || import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  }, [geminiKeys, activeKeyIndex]);

  const switchToNextKey = useCallback(() => {
    if (geminiKeys.length <= 1) {
      return false;
    }
    const nextIndex = (activeKeyIndex + 1) % geminiKeys.length;
    if (nextIndex === 0 && !geminiKeys[0]) {
      return false;
    }
    setActiveKeyIndex(nextIndex);
    addLog(`Rate limit detected. Switching to Node_0${nextIndex + 1}...`, 'process');
    return true;
  }, [geminiKeys, activeKeyIndex, addLog]);

  return { geminiKeys, setGeminiKeys, activeKeyIndex, setActiveKeyIndex, getActiveGeminiKey, switchToNextKey };
}
