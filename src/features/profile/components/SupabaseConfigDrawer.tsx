import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Lock
} from 'lucide-react';
import { syncEngine } from '../../../core/sync/syncEngine';
import { isSupabaseConfigured } from '../../../core/database/supabaseClient';

interface SupabaseConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigDrawer: React.FC<SupabaseConfigDrawerProps> = ({ isOpen, onClose }) => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [showAnonKey, setShowAnonKey] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Load saved config on mount or open
  useEffect(() => {
    if (isOpen) {
      try {
        const savedUrl = localStorage.getItem('noesis_supabase_url') || '';
        const savedKey = localStorage.getItem('noesis_supabase_anon_key') || '';
        setSupabaseUrl(savedUrl);
        setSupabaseAnonKey(savedKey);
        setIsConnected(isSupabaseConfigured());
      } catch (e) {
        console.error('Error reading Supabase keys:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const url = supabaseUrl.trim();
      const key = supabaseAnonKey.trim();
      localStorage.setItem('noesis_supabase_url', url);
      localStorage.setItem('noesis_supabase_anon_key', key);
      setIsConnected(isSupabaseConfigured());

      if (url && key) {
        // Trigger initial sync in the background
        setTimeout(() => {
          syncEngine.triggerSync({ forceFullSync: true }).then((res) => {
            console.log('[SupabaseConfigDrawer] Background sync triggered successfully:', res);
          }).catch((err) => {
            console.error('[SupabaseConfigDrawer] Background sync failed:', err);
          });
        }, 300);
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error('Failed to save Supabase config:', e);
    }
  };

  const handleReset = () => {
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    try {
      localStorage.removeItem('noesis_supabase_url');
      localStorage.removeItem('noesis_supabase_anon_key');
      setIsConnected(isSupabaseConfigured());
    } catch (e) {
      console.error('Failed to reset Supabase config:', e);
    }
  };

  const hasAnyInput = supabaseUrl.trim() !== '' || supabaseAnonKey.trim() !== '';

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
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-noesis-text tracking-tight">
                Konfigurasi Supabase
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Input Fields */}
          <div className="space-y-4 p-3.5 rounded-xl bg-noesis-surface border border-noesis-border">
            
            {/* Supabase URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-noesis-muted flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-noesis-muted" />
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-noesis-bg border border-noesis-border focus:border-noesis-accent rounded-lg px-3 py-2 text-xs text-noesis-text placeholder-noesis-muted/60 outline-hidden transition-colors font-mono"
              />
            </div>

            {/* Supabase Anon Key */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-noesis-muted flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-noesis-muted" />
                Supabase Anon / Public Key
              </label>
              <div className="relative flex items-center">
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full bg-noesis-bg border border-noesis-border focus:border-noesis-accent rounded-lg px-3 py-2 pr-9 text-xs text-noesis-text placeholder-noesis-muted/60 outline-hidden transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="absolute right-2.5 text-noesis-muted hover:text-noesis-text transition-colors cursor-pointer"
                >
                  {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-noesis-surface border border-noesis-border text-[11px] text-noesis-muted">
            <Lock className="w-3.5 h-3.5 text-noesis-muted shrink-0 mt-0.5" />
            <span>
              Data konfigurasi ini disimpan secara aman di penyimpanan lokal peramban Anda (localStorage) untuk menghubungkan Noesis ke database Supabase.
            </span>
          </div>

        </div>

        {/* Success Toast Banner */}
        {showToast && (
          <div className="px-4 py-2 bg-emerald-500/20 border-t border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Konfigurasi Supabase Berhasil Disimpan!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-noesis-border bg-noesis-surface flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasAnyInput}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-noesis-surface-hover hover:bg-noesis-surface border border-noesis-border text-xs text-noesis-muted hover:text-noesis-text transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Reset konfigurasi Supabase lokal"
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

