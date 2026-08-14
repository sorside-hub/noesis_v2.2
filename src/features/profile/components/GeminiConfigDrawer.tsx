import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  RotateCcw,
  Info,
  Sliders,
  Cpu,
  Sparkles,
  Lock
} from 'lucide-react';

import { apiFetch } from '../../../shared/utils/apiClient';

interface GeminiConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export interface GeminiApiKeysConfig {
  pair1Primary: string;
  pair1Backup: string;
  pair2Primary: string;
  pair2Backup: string;
}

const STORAGE_KEY = 'noesis_gemini_custom_keys';

export const getStoredGeminiKeys = (): GeminiApiKeysConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error reading saved gemini keys:', err);
  }
  return {
    pair1Primary: '',
    pair1Backup: '',
    pair2Primary: '',
    pair2Backup: '',
  };
};

export const saveGeminiKeys = (keys: GeminiApiKeysConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.error('Error saving gemini keys:', err);
  }
};

export const GeminiConfigDrawer: React.FC<GeminiConfigDrawerProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [keys, setKeys] = useState<GeminiApiKeysConfig>({
    pair1Primary: '',
    pair1Backup: '',
    pair2Primary: '',
    pair2Backup: '',
  });

  const [showVisibility, setShowVisibility] = useState<{ [key: string]: boolean }>({
    pair1Primary: false,
    pair1Backup: false,
    pair2Primary: false,
    pair2Backup: false,
  });

  const [hasServerEnv, setHasServerEnv] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGeminiKeys();
      setKeys(stored);

      // Check if server env has keys configured via status API
      apiFetch('/api/ai-status')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.gemini) {
            // If server pair1 or pair2 is connected, server env is set
            const isServerConfigured =
              data.gemini.pair1?.primary === true ||
              data.gemini.pair1?.backup === true ||
              data.gemini.pair2?.primary === true ||
              data.gemini.pair2?.backup === true;
            setHasServerEnv(isServerConfigured);
          }
        })
        .catch(() => setHasServerEnv(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleVisibility = (field: keyof GeminiApiKeysConfig) => {
    setShowVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (field: keyof GeminiApiKeysConfig, value: string) => {
    setKeys((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    saveGeminiKeys(keys);
    setShowSuccessToast(true);
    if (onSaved) onSaved();

    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    const emptyKeys = {
      pair1Primary: '',
      pair1Backup: '',
      pair2Primary: '',
      pair2Backup: '',
    };
    setKeys(emptyKeys);
    saveGeminiKeys(emptyKeys);
    if (onSaved) onSaved();
  };

  const hasAnyKeyInputted =
    keys.pair1Primary.trim() !== '' ||
    keys.pair1Backup.trim() !== '' ||
    keys.pair2Primary.trim() !== '' ||
    keys.pair2Backup.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-noesis-bg border-l border-noesis-border flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250 text-noesis-text">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-noesis-border bg-noesis-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-noesis-text tracking-tight">
                Pengaturan API Key Gemini
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Form Pairs */}
          <div className="space-y-4">
            {/* PAIR 1 */}
            <div className="space-y-3 p-3.5 rounded-xl bg-noesis-surface border border-noesis-border">
              <div className="flex items-center justify-between pb-1 border-b border-noesis-border">
                <h3 className="text-xs font-semibold text-noesis-text flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-noesis-muted" />
                  Pair 1 - Primary & Backup
                </h3>
              </div>

              {/* Pair 1 Primary */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-noesis-muted">
                  Primary Key (Pair 1)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showVisibility.pair1Primary ? 'text' : 'password'}
                    value={keys.pair1Primary}
                    onChange={(e) => handleInputChange('pair1Primary', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-noesis-bg border border-noesis-border focus:border-noesis-accent rounded-lg px-3 py-2 pr-9 text-xs text-noesis-text placeholder-noesis-muted/60 outline-hidden transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('pair1Primary')}
                    className="absolute right-2.5 text-noesis-muted hover:text-noesis-text transition-colors cursor-pointer"
                  >
                    {showVisibility.pair1Primary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pair 1 Backup */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-noesis-muted">
                  Backup Key (Pair 1)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showVisibility.pair1Backup ? 'text' : 'password'}
                    value={keys.pair1Backup}
                    onChange={(e) => handleInputChange('pair1Backup', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-noesis-bg border border-noesis-border focus:border-noesis-accent rounded-lg px-3 py-2 pr-9 text-xs text-noesis-text placeholder-noesis-muted/60 outline-hidden transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('pair1Backup')}
                    className="absolute right-2.5 text-noesis-muted hover:text-noesis-text transition-colors cursor-pointer"
                  >
                    {showVisibility.pair1Backup ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* PAIR 2 */}
            <div className="space-y-3 p-3.5 rounded-xl bg-noesis-surface border border-noesis-border">
              <div className="flex items-center justify-between pb-1 border-b border-noesis-border">
                <h3 className="text-xs font-semibold text-noesis-text flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-noesis-muted" />
                  Pair 2 - Primary & Backup
                </h3>
              </div>

              {/* Pair 2 Primary */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-noesis-muted">
                  Primary Key (Pair 2)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showVisibility.pair2Primary ? 'text' : 'password'}
                    value={keys.pair2Primary}
                    onChange={(e) => handleInputChange('pair2Primary', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-noesis-bg border border-noesis-border focus:border-noesis-accent rounded-lg px-3 py-2 pr-9 text-xs text-noesis-text placeholder-noesis-muted/60 outline-hidden transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('pair2Primary')}
                    className="absolute right-2.5 text-noesis-muted hover:text-noesis-text transition-colors cursor-pointer"
                  >
                    {showVisibility.pair2Primary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pair 2 Backup */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-noesis-muted">
                  Backup Key (Pair 2)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showVisibility.pair2Backup ? 'text' : 'password'}
                    value={keys.pair2Backup}
                    onChange={(e) => handleInputChange('pair2Backup', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-noesis-bg border border-noesis-border focus:border-noesis-accent rounded-lg px-3 py-2 pr-9 text-xs text-noesis-text placeholder-noesis-muted/60 outline-hidden transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('pair2Backup')}
                    className="absolute right-2.5 text-noesis-muted hover:text-noesis-text transition-colors cursor-pointer"
                  >
                    {showVisibility.pair2Backup ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-noesis-surface border border-noesis-border text-[11px] text-noesis-muted">
              <Lock className="w-3.5 h-3.5 text-noesis-muted shrink-0 mt-0.5" />
              <span>
                Kunci API yang Anda masukkan disimpan secara aman di peramban lokal (localStorage) Anda dan tidak akan diunggah ke server lain.
              </span>
            </div>
          </div>
        </div>

        {/* Success Toast Banner */}
        {showSuccessToast && (
          <div className="px-4 py-2 bg-emerald-500/20 border-t border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Konfigurasi API Key Berhasil Disimpan!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-noesis-border bg-noesis-surface flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasAnyKeyInputted}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-noesis-surface-hover hover:bg-noesis-surface border border-noesis-border text-xs text-noesis-muted hover:text-noesis-text transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Hapus semua input API Key lokal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-noesis-surface-hover hover:bg-noesis-surface border border-noesis-border text-xs font-semibold text-noesis-text transition-all cursor-pointer active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-noesis-accent hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
