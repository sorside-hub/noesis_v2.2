import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { ArrowRightLeft, Sparkles, Loader2, RefreshCw, AlertCircle, Activity, Layers, FileText } from 'lucide-react';
import { VaultHeader } from '../../vault/components/VaultHeader';
import { getNotes } from '../../vault/services/noteService';
import { NoteItem } from '../../vault/pages/VaultPage';
import { themeService } from '../services/themeService';
import { Theme } from '../types/theme';
import { connectionService } from '../services/connectionService';
import { Connection } from '../types/connection';
import { ConnectionCard } from '../components/ConnectionCard';

interface ConnectionsPageProps {
  onBack?: () => void;
  onSelectConnection?: (connectionId: string) => void;
}

let savedConnectionListScrollTop = 0;

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  onBack,
  onSelectConnection,
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isRestoringScrollRef = useRef<boolean>(true);

  useLayoutEffect(() => {
    if (loading) return;
    if (containerRef.current) {
      isRestoringScrollRef.current = true;
      containerRef.current.scrollTop = savedConnectionListScrollTop;
      const raf = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = savedConnectionListScrollTop;
        }
        const timer = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = savedConnectionListScrollTop;
          }
          isRestoringScrollRef.current = false;
        }, 50);
        return () => clearTimeout(timer);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [loading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loading || isRestoringScrollRef.current) return;
    savedConnectionListScrollTop = e.currentTarget.scrollTop;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedNotes, fetchedThemes, fetchedConnections] = await Promise.all([
        getNotes().catch(() => []),
        themeService.getSavedThemes().catch(() => []),
        connectionService.getSavedConnections().catch(() => []),
      ]);

      setNotes(fetchedNotes);
      setThemes(fetchedThemes);
      setConnections(fetchedConnections);
    } catch (err: any) {
      console.error('Error loading connections data:', err);
      setError('Gagal memuat data Connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateConnections = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);

    try {
      const fetchedNotes = await getNotes().catch(() => []);
      const fetchedThemes = await themeService.getSavedThemes().catch(() => []);

      if (fetchedNotes.length === 0 && fetchedThemes.length === 0) {
        setError('Diperlukan setidaknya beberapa catatan atau tema untuk menemukan keterkaitan semantik.');
        setAnalyzing(false);
        return;
      }

      const generated = await connectionService.generateConnections(fetchedNotes, fetchedThemes);
      setConnections(generated);
      if (generated.length === 0) {
        setError('Belum ditemukan keterkaitan semantik yang cukup kuat antar catatan atau tema saat ini.');
      }
    } catch (err: any) {
      console.error('Error generating connections:', err);
      setError(err.message || 'Gagal menghasilkan Connections.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCardClick = (connectionId: string) => {
    if (onSelectConnection) {
      onSelectConnection(connectionId);
    } else {
      console.log('Navigate to Connection Detail for ID:', connectionId);
    }
  };

  // Overview Summary calculations
  const totalConnections = connections.length;
  const bridgeCount = connections.filter((c) => c.connectionType === 'theme_bridge').length;
  const evidenceCount = connections.filter((c) => c.connectionType === 'theme_evidence').length;

  const connectedThemeIds = new Set<string>();
  const connectedNoteIds = new Set<string>();

  connections.forEach((c) => {
    if (c.sourceType === 'theme') c.sourceIds.forEach((id) => connectedThemeIds.add(id));
    else if (c.sourceType === 'note') c.sourceIds.forEach((id) => connectedNoteIds.add(id));

    if (c.targetType === 'theme') c.targetIds.forEach((id) => connectedThemeIds.add(id));
    else if (c.targetType === 'note') c.targetIds.forEach((id) => connectedNoteIds.add(id));
  });

  const totalConnectedThemes = connectedThemeIds.size;
  const totalConnectedNotes = connectedNoteIds.size;

  const avgStrength = totalConnections > 0
    ? Math.round((connections.reduce((sum, c) => sum + (c.strength || 0), 0) / totalConnections) * 100)
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none animate-fadeIn">
      {/* Header */}
      <VaultHeader onBack={onBack} />

      {/* Main Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col max-w-lg mx-auto w-full pb-24 space-y-5"
      >
        {/* Header: Icon + Title + Line */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-noesis-border">
          <ArrowRightLeft className="w-5 h-5 text-noesis-text" />
          <h1 className="text-xl font-bold text-noesis-text tracking-tight select-text">
            Connections
          </h1>
        </div>

        {/* SECTION 1: Intro UI */}
        <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-noesis-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-noesis-text" />
              <span>Analisis Keterkaitan Semantik</span>
            </h2>
            <p className="text-xs text-noesis-muted mt-1 leading-relaxed select-text">
              Temukan hubungan terkuat antar catatan berdasarkan keterkaitan alami tanpa membuat asumsi.
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
                  {connections.length > 0 ? 'Aktif' : 'Menunggu Analisis'}
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

          {/* Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleGenerateConnections}
              disabled={analyzing || loading || notes.length < 2}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-noesis-accent hover:bg-noesis-accent-hover active:scale-[0.98] text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sedang Menganalisis...</span>
                </>
              ) : (
                <>
                  {connections.length > 0 ? <RefreshCw className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                  <span>{connections.length > 0 ? 'Analisis Ulang Keterkaitan' : 'Jalankan Connection Engine'}</span>
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

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-noesis-text mb-3" />
            <p className="text-xs text-noesis-muted">Memuat data Connections...</p>
          </div>
        ) : connections.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-noesis-surface border border-noesis-border flex items-center justify-center mb-3 text-noesis-text">
              <ArrowRightLeft className="w-6 h-6 text-noesis-muted" />
            </div>
            <p className="text-xs text-noesis-muted">Belum ada Connections yang terbentuk.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overview Summary Section */}
            <div className="p-4 rounded-2xl bg-noesis-surface border border-noesis-border flex flex-col gap-3 shadow-sm mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-noesis-muted uppercase tracking-wider">
                  Ringkasan Keterkaitan
                </span>
                <span className="text-xs font-bold text-noesis-text flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-noesis-muted" />
                  Rerata Strength: {avgStrength}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-noesis-bg border border-noesis-border flex flex-col">
                  <span className="text-[10px] text-noesis-muted font-medium">Total Koneksi</span>
                  <span className="text-base font-bold text-noesis-text mt-0.5">{totalConnections}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-noesis-bg border border-noesis-border flex flex-col">
                  <span className="text-[10px] text-noesis-muted font-medium flex items-center gap-1">
                    <Layers className="w-3 h-3 text-noesis-muted" /> Bridge
                  </span>
                  <span className="text-base font-bold text-noesis-text mt-0.5">{bridgeCount}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-noesis-bg border border-noesis-border flex flex-col">
                  <span className="text-[10px] text-noesis-muted font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3 text-noesis-muted" /> Evidence
                  </span>
                  <span className="text-base font-bold text-noesis-text mt-0.5">{evidenceCount}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-noesis-bg border border-noesis-border flex flex-col">
                  <span className="text-[10px] text-noesis-muted font-medium">Terhubung</span>
                  <span className="text-xs font-semibold text-noesis-muted mt-1">
                    {totalConnectedThemes} Tema • {totalConnectedNotes} Catatan
                  </span>
                </div>
              </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between text-xs text-noesis-muted px-1 pt-1">
              <span className="font-medium text-noesis-muted">Daftar Keterkaitan ({connections.length})</span>
              <button
                onClick={handleGenerateConnections}
                disabled={analyzing}
                className="hover:text-noesis-text text-noesis-muted transition flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
                <span>Pembaruan</span>
              </button>
            </div>

            {/* Connection Cards */}
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

