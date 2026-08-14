import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Layers, Sparkles, Loader2, RefreshCw, AlertCircle, FileText, Activity } from 'lucide-react';
import { VaultHeader } from '../../vault/components/VaultHeader';
import { getNotes } from '../../vault/services/noteService';
import { NoteItem } from '../../vault/pages/VaultPage';
import { Theme } from '../types/theme';
import { themeService } from '../services/themeService';
import { ThemeCard } from '../components/ThemeCard';
import { ThemeDetailPage } from './ThemeDetailPage';
import { useNavigation } from '../../../core/navigation';

interface ThemesPageProps {
  onBack?: () => void;
  onSelectTheme?: (theme: Theme) => void;
}

let savedThemeListScrollTop = 0;

export const ThemesPage: React.FC<ThemesPageProps> = ({ onBack, onSelectTheme }) => {
  const { currentLocation, navigate, goBack } = useNavigation();
  const selectedThemeId = currentLocation.themeId || null;

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const isRestoringScrollRef = useRef<boolean>(true);

  useLayoutEffect(() => {
    if (loading) return;
    if (!selectedThemeId && listContainerRef.current) {
      isRestoringScrollRef.current = true;
      listContainerRef.current.scrollTop = savedThemeListScrollTop;
      const raf = requestAnimationFrame(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTop = savedThemeListScrollTop;
        }
        const timer = setTimeout(() => {
          if (listContainerRef.current) {
            listContainerRef.current.scrollTop = savedThemeListScrollTop;
          }
          isRestoringScrollRef.current = false;
        }, 50);
        return () => clearTimeout(timer);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [selectedThemeId, loading]);

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loading || isRestoringScrollRef.current) return;
    savedThemeListScrollTop = e.currentTarget.scrollTop;
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedNotes, savedThemes] = await Promise.all([
          getNotes(),
          themeService.getSavedThemes(),
        ]);

        if (!isMounted) return;

        setNotes(fetchedNotes || []);
        setThemes(savedThemes || []);
      } catch (err: any) {
        console.error('Gagal memuat data awal Themes:', err);
        if (isMounted) {
          setError('Gagal memuat data catatan atau tema dari penyimpanan lokal.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateThemes = async () => {
    if (notes.length < 2) {
      setError('Diperlukan minimal 2 catatan di Vault untuk menganalisis dan membentuk Themes.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const generated = await themeService.generateThemes(notes);
      setThemes(generated);
    } catch (err: any) {
      console.error('Gagal membuat Themes:', err);
      setError(err?.message || 'Terjadi kesalahan saat membuat Themes.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleThemeClick = (theme: Theme) => {
    if (onSelectTheme) {
      onSelectTheme(theme);
    } else {
      navigate({
        tab: 'insight',
        insightViewState: 'themes',
        themeId: theme.id,
      });
    }
  };

  // Render Theme Detail Page when themeId is present in navigation location
  if (selectedThemeId) {
    return (
      <ThemeDetailPage
        themeId={selectedThemeId}
        onBack={goBack}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none animate-fadeIn">
      {/* Self-contained Header */}
      <VaultHeader onBack={onBack} />

      {/* Scrollable Container */}
      <div
        ref={listContainerRef}
        onScroll={handleListScroll}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col max-w-lg mx-auto w-full pb-24 space-y-5"
      >
        {/* Header: Icon + Title + Line */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-noesis-border">
          <Layers className="w-5 h-5 text-noesis-text" />
          <h1 className="text-xl font-bold text-noesis-text tracking-tight select-text">
            Themes Overview
          </h1>
        </div>

        {/* SECTION 1: Intro UI */}
        <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-noesis-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-noesis-text" />
              <span>Ekstraksi Topik Utama</span>
            </h2>
            <p className="text-xs text-noesis-muted mt-1 leading-relaxed select-text">
              Daftar topik utama yang berkembang secara alami dari klaster semantik catatan di Vault Anda.
            </p>
          </div>

          {/* Metadata info */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-noesis-bg border border-noesis-border flex items-center gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-noesis-muted shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-noesis-muted">Catatan Dianalisis</p>
                <p className="font-semibold text-noesis-text truncate">
                  {loading ? '...' : `${notes.length} Notes`}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-noesis-bg border border-noesis-border flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-noesis-muted shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-noesis-muted">Status Engine</p>
                <p className="font-semibold text-noesis-text text-[11px] truncate">
                  {themes.length > 0 ? 'Aktif' : 'Menunggu Analisis'}
                </p>
              </div>
            </div>
          </div>

          {/* Error State Inline */}
          {error && (
            <div className="p-3 rounded-xl bg-noesis-bg border border-noesis-border text-xs text-noesis-muted space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-noesis-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-noesis-text" />
                <span>Gagal Melakukan Analisis</span>
              </div>
              <p className="text-[10px] text-noesis-muted leading-relaxed select-text">{error}</p>
            </div>
          )}

          {/* Action Button: Analyze Pattern */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleGenerateThemes}
              disabled={analyzing || loading || notes.length < 2}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-noesis-accent hover:bg-noesis-accent-hover active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menganalisis Klaster Semantik...</span>
                </>
              ) : (
                <>
                  {themes.length > 0 ? <RefreshCw className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                  <span>{themes.length > 0 ? 'Analisis Ulang Themes' : 'Jalankan Generator Themes'}</span>
                </>
              )}
            </button>
            {notes.length < 2 && (
              <p className="text-[11px] text-noesis-muted text-center mt-3">
                Membutuhkan minimal 2 catatan di Vault. Saat ini terdapat {notes.length} catatan.
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-noesis-text mb-3" />
            <p className="text-sm font-medium text-noesis-text">Memuat data Themes...</p>
            <p className="text-xs text-noesis-muted mt-1">Mengambil data dari IndexedDB lokal</p>
          </div>
        ) : themes.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-noesis-surface border border-noesis-border flex items-center justify-center mb-3 text-noesis-text">
              <Layers className="w-6 h-6 text-noesis-muted" />
            </div>
            <p className="text-xs text-noesis-muted">Belum ada Themes yang terbentuk.</p>
          </div>
        ) : (
          /* Theme Card List */
          <div className="space-y-3.5">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                onClick={handleThemeClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
