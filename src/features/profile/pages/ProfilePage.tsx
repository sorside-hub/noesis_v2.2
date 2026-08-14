import React, { useEffect, useState } from 'react';
import { Cpu, Zap, Info, CheckCircle2, XCircle, HelpCircle, Settings, Database, AlertCircle, Sun, Moon } from 'lucide-react';
import { useNavigation } from '../../../core/navigation';
import { useTheme } from '../../../core/theme/themeContext';
import { VaultHeader } from '../../vault/components/VaultHeader';
import { GeminiConfigDrawer } from '../components/GeminiConfigDrawer';
import { SupabaseConfigDrawer } from '../components/SupabaseConfigDrawer';
import { isSupabaseConfigured } from '../../../core/database/supabaseClient';

import { apiFetch } from '../../../shared/utils/apiClient';

interface AiServiceDetail {
  connected: boolean | null;
  model: string;
}

export const ProfilePage: React.FC = () => {
  const { navigate, openDrawer, closeDrawer, isDrawerOpen } = useNavigation();
  const { theme, setTheme } = useTheme();
  const isConfigOpen = isDrawerOpen('geminiConfig');
  const isSupabaseOpen = isDrawerOpen('supabaseConfig');
  const [aiServices, setAiServices] = useState<{
    gemini: {
      pair1: { primary: boolean | null; backup: boolean | null };
      pair2: { primary: boolean | null; backup: boolean | null };
      model: string;
    };
  }>({
    gemini: {
      pair1: { primary: null, backup: null },
      pair2: { primary: null, backup: null },
      model: 'gemini-3.6-flash',
    },
  });

  const [supabaseStatus, setSupabaseStatus] = useState<boolean>(false);

  useEffect(() => {
    try {
      setSupabaseStatus(isSupabaseConfigured());
    } catch (e) {
      console.error(e);
    }
  }, [isSupabaseOpen]);

  useEffect(() => {
    let isMounted = true;

    apiFetch('/api/ai-status')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP error');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data && data.gemini) {
          setAiServices({
            gemini: {
              pair1: {
                primary: data.gemini.pair1.primary,
                backup: data.gemini.pair1.backup,
              },
              pair2: {
                primary: data.gemini.pair2.primary,
                backup: data.gemini.pair2.backup,
              },
              model: data.gemini.model || 'gemini-3.6-flash',
            },
          });
        }
      })
      .catch((err) => console.error('Failed to fetch AI status:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const renderStatusBadge = (connected: boolean | null) => {
    if (connected === true) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          Connected
        </span>
      );
    }
    if (connected === false) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3 shrink-0" />
          Not Connected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-noesis-surface-hover text-noesis-muted border border-noesis-border">
        <HelpCircle className="w-3 h-3 shrink-0" />
        Unknown
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-noesis-bg text-noesis-text animate-in fade-in duration-200">
      {/* Self-contained Header with Back button only */}
      <VaultHeader onBack={() => navigate({ tab: 'chat' })} />

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-12 select-none">
        <div className="max-w-md mx-auto space-y-6">
        {/* 1. Noesis Identity Section */}
        <section className="text-center space-y-3">
          {theme === 'dark' ? (
            <img
              src="/logo-dark-kotak.webp"
              alt="Noesis Logo"
              className="w-14 h-14 mx-auto object-contain"
            />
          ) : (
            <img
              src="/logo-light-kotak.webp"
              alt="Noesis Logo"
              className="w-14 h-14 mx-auto object-contain"
            />
          )}

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-noesis-text tracking-tight">Noesis</h1>
            <p className="text-xs font-semibold text-noesis-muted uppercase tracking-wider">
              Personal Knowledge System
            </p>
          </div>

          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 text-center my-3 space-y-1">
            <p className="text-xs font-medium italic text-noesis-text leading-snug">
              &quot;Organize knowledge.&quot;
            </p>
            <p className="text-xs font-medium italic text-noesis-text leading-snug">
              &quot;Build understanding.&quot;
            </p>
            <p className="text-xs font-medium italic text-noesis-text leading-snug">
              &quot;Create insights.&quot;
            </p>
          </div>
        </section>

        {/* Appearance / Theme Section */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-noesis-muted uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Sun className="w-3.5 h-3.5 text-noesis-muted" />
            Tema Tampilan
          </h2>

          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-noesis-text">Mode Tema</h3>
              </div>

              <div className="flex items-center bg-noesis-bg p-1 rounded-xl border border-noesis-border">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-noesis-accent text-white shadow-xs'
                      : 'text-noesis-muted hover:text-noesis-text'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-noesis-accent text-white shadow-xs'
                      : 'text-noesis-muted hover:text-noesis-text'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. AI Services Status Section */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-noesis-muted uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Zap className="w-3.5 h-3.5 text-noesis-muted" />
            Status Layanan AI
          </h2>

          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 space-y-4 shadow-xs">
            {/* Gemini */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-noesis-text">Gemini AI Services</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openDrawer('geminiConfig')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-noesis-surface-hover hover:bg-noesis-surface border border-noesis-border text-noesis-text text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Konfigurasi API Key Gemini"
                >
                  <Settings className="w-3.5 h-3.5 text-noesis-muted" />
                  <span>Pengaturan</span>
                </button>
              </div>

              <div className="space-y-4 pl-9">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-noesis-muted uppercase">Pair 1</h4>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-noesis-muted">Primary Key:</span>
                    {renderStatusBadge(aiServices.gemini.pair1.primary)}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-noesis-muted">Backup Key:</span>
                    {renderStatusBadge(aiServices.gemini.pair1.backup)}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-noesis-border">
                  <h4 className="text-[10px] font-semibold text-noesis-muted uppercase">Pair 2</h4>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-noesis-muted">Primary Key:</span>
                    {renderStatusBadge(aiServices.gemini.pair2.primary)}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-noesis-muted">Backup Key:</span>
                    {renderStatusBadge(aiServices.gemini.pair2.backup)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supabase Database Section */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-noesis-muted uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Database className="w-3.5 h-3.5 text-noesis-muted" />
            Status Database & Cloud Sync
          </h2>

          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-noesis-text">Supabase Cloud</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openDrawer('supabaseConfig')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-noesis-surface-hover hover:bg-noesis-surface border border-noesis-border text-noesis-text text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Konfigurasi Supabase"
                >
                  <Settings className="w-3.5 h-3.5 text-noesis-muted" />
                  <span>Pengaturan</span>
                </button>
              </div>

              <div className="pl-9 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-noesis-muted text-[11px]">Status Koneksi:</span>
                  {supabaseStatus ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Not Connected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. About Noesis Section */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-noesis-muted uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Info className="w-3.5 h-3.5 text-noesis-muted" />
            Tentang Noesis
          </h2>

          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-noesis-border">
              <span className="text-noesis-muted">Name</span>
              <span className="font-semibold text-noesis-text">Noesis</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-noesis-border">
              <span className="text-noesis-muted">Category</span>
              <span className="font-medium text-noesis-text">Personal Knowledge System</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-noesis-muted">Version</span>
              <span className="font-mono text-[11px] text-noesis-text bg-noesis-surface-hover px-2 py-0.5 rounded-md border border-noesis-border">
                2.0.0
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>

    {/* Gemini Config Drawer */}
    <GeminiConfigDrawer
      isOpen={isConfigOpen}
      onClose={() => closeDrawer('geminiConfig')}
    />

    {/* Supabase Config Drawer */}
    <SupabaseConfigDrawer
      isOpen={isSupabaseOpen}
      onClose={() => closeDrawer('supabaseConfig')}
    />
    </div>
  );
};
