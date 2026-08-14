import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Compass, Eye, HelpCircle, Lightbulb, Sparkles, Loader2, RefreshCw, AlertCircle, Trash2, ChevronDown, ChevronUp, FileText, Brain, Layers, ArrowRightLeft, ExternalLink, Activity } from 'lucide-react';
import { VaultHeader } from '../../vault/components/VaultHeader';
import { getNotes } from '../../vault/services/noteService';
import { NoteItem } from '../../vault/pages/VaultPage';
import { Reflection } from '../types/reflection';
import { reflectionService } from '../services/reflectionService';
import { useNavigation } from '../../../core/navigation';
import { getSavedThinkingPatterns } from '../services/thinkingPatternService';
import { themeService } from '../services/themeService';
import { connectionService } from '../services/connectionService';
import { ThinkingPattern } from '../types/thinkingPattern';
import { Theme } from '../types/theme';
import { Connection } from '../types/connection';

interface ReflectionPageProps {
  onBack?: () => void;
}

let savedReflectionScrollTop = 0;

export const ReflectionPage: React.FC<ReflectionPageProps> = ({ onBack }) => {
  const { navigate } = useNavigation();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [patterns, setPatterns] = useState<ThinkingPattern[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReflectionId, setExpandedReflectionId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isRestoringScrollRef = useRef<boolean>(true);

  useLayoutEffect(() => {
    if (loading) return;
    if (containerRef.current) {
      isRestoringScrollRef.current = true;
      containerRef.current.scrollTop = savedReflectionScrollTop;
      const raf = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = savedReflectionScrollTop;
        }
        const timer = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = savedReflectionScrollTop;
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
    savedReflectionScrollTop = e.currentTarget.scrollTop;
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          fetchedNotes,
          savedReflections,
          fetchedThemes,
          fetchedConnections,
          fetchedPatterns
        ] = await Promise.all([
          getNotes(),
          reflectionService.getSavedReflections(),
          themeService.getSavedThemes().catch(() => []),
          connectionService.getSavedConnections().catch(() => []),
          getSavedThinkingPatterns().catch(() => []),
        ]);

        if (!isMounted) return;

        setNotes(fetchedNotes || []);
        setReflections(savedReflections || []);
        setThemes(fetchedThemes || []);
        setConnections(fetchedConnections || []);
        setPatterns(fetchedPatterns || []);
      } catch (err: any) {
        console.error('Gagal memuat data awal Reflection:', err);
        if (isMounted) {
          setError('Gagal memuat data catatan, refleksi, atau klaster pengetahuan.');
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

  const handleGenerateReflections = async () => {
    setGenerating(true);
    setError(null);
    try {
      const generated = await reflectionService.generateReflections(notes);
      setReflections(generated);
    } catch (err: any) {
      console.error('Gagal membuat refleksi:', err);
      setError(err?.message || 'Terjadi kesalahan saat membuat analisis refleksi.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReflectionId((prev) => (prev === id ? null : id));
  };

  const getNoteTitle = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    return note ? (note.title || 'Catatan Tanpa Judul') : 'Catatan';
  };

  const getTypeBadgeLabel = (type?: string) => {
    switch (type) {
      case 'creative_reflection':
        return 'Creative Connection';
      case 'pattern_reflection':
        return 'Cognitive Pattern';
      case 'growth_reflection':
        return 'Knowledge Growth';
      case 'tension_reflection':
        return 'Cognitive Tension';
      default:
        return 'Cognitive Pattern';
    }
  };

  const getTypeBadgeStyle = (type?: string) => {
    switch (type) {
      case 'creative_reflection':
        return 'bg-noesis-bg text-noesis-text border-noesis-border';
      case 'pattern_reflection':
        return 'bg-noesis-bg text-noesis-text border-noesis-border';
      case 'growth_reflection':
        return 'bg-noesis-bg text-noesis-text border-noesis-border';
      case 'tension_reflection':
        return 'bg-noesis-bg text-noesis-text border-noesis-border';
      default:
        return 'bg-noesis-bg text-noesis-text border-noesis-border';
    }
  };

  const renderRelatedKnowledge = (refl: Reflection) => {
    // 1. Related Patterns
    const relatedPatterns = patterns.filter(p => 
      p.relatedNoteIds && p.relatedNoteIds.some(noteId => refl.relatedNoteIds.includes(noteId))
    );

    // 2. Related Themes
    const relatedThemes = themes.filter(t => 
      refl.relatedThemeIds.includes(t.id)
    );

    // 3. Related Connections
    const relatedConns = connections.filter(c => 
      refl.relatedConnectionIds.includes(c.id)
    );

    const hasAnyRelation = relatedPatterns.length > 0 || relatedThemes.length > 0 || relatedConns.length > 0;

    if (!hasAnyRelation) return null;

    return (
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-noesis-muted uppercase tracking-wider">
          <ArrowRightLeft className="w-3.5 h-3.5 text-noesis-muted" />
          <span>Terhubung Dengan</span>
        </div>
        <div className="flex flex-col gap-1.5 bg-noesis-surface border border-noesis-border rounded-xl p-3">
          {relatedPatterns.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate({ tab: 'insight', insightViewState: 'pattern' })}
              className="flex items-center justify-between w-full p-2 rounded-lg bg-noesis-bg hover:bg-noesis-surface-hover border border-noesis-border text-left text-xs transition-all active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Brain className="w-3.5 h-3.5 text-noesis-muted shrink-0" />
                <span className="text-noesis-text font-medium truncate">{p.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-noesis-surface text-noesis-text border border-noesis-border">Pola</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-noesis-muted group-hover:text-noesis-text transition-colors -rotate-90 shrink-0" />
            </button>
          ))}

          {relatedThemes.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate({ tab: 'insight', insightViewState: 'themes' })}
              className="flex items-center justify-between w-full p-2 rounded-lg bg-noesis-bg hover:bg-noesis-surface-hover border border-noesis-border text-left text-xs transition-all active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-3.5 h-3.5 text-noesis-muted shrink-0" />
                <span className="text-noesis-text font-medium truncate">{t.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-noesis-surface text-noesis-text border border-noesis-border">Tema</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-noesis-muted group-hover:text-noesis-text transition-colors -rotate-90 shrink-0" />
            </button>
          ))}

          {relatedConns.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate({
                tab: 'insight',
                insightViewState: 'connectionDetail',
                connectionId: c.id,
              })}
              className="flex items-center justify-between w-full p-2 rounded-lg bg-noesis-bg hover:bg-noesis-surface-hover border border-noesis-border text-left text-xs transition-all active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ArrowRightLeft className="w-3.5 h-3.5 text-noesis-muted shrink-0" />
                <span className="text-noesis-text font-medium truncate">{c.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-noesis-surface text-noesis-text border border-noesis-border">Hubungan</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-noesis-muted group-hover:text-noesis-text transition-colors -rotate-90 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none animate-fadeIn bg-noesis-bg text-noesis-text">
      {/* Self-contained Header */}
      <VaultHeader onBack={onBack} />

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col max-w-lg mx-auto w-full pb-24 space-y-5"
      >
        {/* Header: Icon + Title + Line */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-noesis-border">
          <Compass className="w-5 h-5 text-noesis-text" />
          <h1 className="text-xl font-bold text-noesis-text tracking-tight select-text">
            Reflection Core
          </h1>
        </div>

        {/* SECTION 1: Intro UI */}
        <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-noesis-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-noesis-text" />
              <span>Analisis Refleksi Kognitif</span>
            </h2>
            <p className="text-xs text-noesis-muted mt-1 leading-relaxed select-text">
              Ruang refleksi kognitif untuk menghubungkan ide & pemikiran, menyajikan sudut pandang baru.
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
                  {reflections.length > 0 ? 'Aktif' : 'Menunggu Analisis'}
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
              onClick={handleGenerateReflections}
              disabled={generating || loading || notes.length < 2}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-noesis-accent hover:bg-noesis-accent-hover active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menganalisis Hubungan Pengetahuan...</span>
                </>
              ) : (
                <>
                  {reflections.length > 0 ? <RefreshCw className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                  <span>{reflections.length > 0 ? 'Analisis Refleksi Baru' : 'Jalankan Reflection Engine'}</span>
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

        {/* Main Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-noesis-text mb-3" />
            <p className="text-sm font-medium text-noesis-text">Mengakses Engine Refleksi...</p>
            <p className="text-xs text-noesis-muted mt-1">Menyelaraskan data IndexedDB lokal</p>
          </div>
        ) : reflections.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-noesis-surface border border-noesis-border flex items-center justify-center mb-3 text-noesis-text">
              <Compass className="w-6 h-6 text-noesis-muted" />
            </div>
            <p className="text-xs text-noesis-muted">Belum ada Refleksi yang terbentuk.</p>
          </div>
        ) : (
          /* Reflections list in accordion layout */
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-noesis-muted uppercase tracking-wider">
                Refleksi Tersimpan ({reflections.length})
              </span>
            </div>

            {reflections.map((refl) => {
              const isExpanded = expandedReflectionId === refl.id;
              return (
                <div key={refl.id} className="space-y-3 pt-1">
                  {/* Header click bar (Sticky) */}
                  <div
                    onClick={() => toggleExpand(refl.id)}
                    className="sticky top-0 z-10 bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border hover:border-noesis-border rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-200 shadow-md group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-noesis-surface border border-noesis-border flex items-center justify-center shrink-0 text-noesis-text transition-all">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-noesis-text truncate pr-2 group-hover:text-noesis-text transition-colors">
                          {refl.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getTypeBadgeStyle(refl.type)}`}>
                            {getTypeBadgeLabel(refl.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-noesis-muted">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-noesis-text" /> : <ChevronDown className="w-4 h-4 text-noesis-muted" />}
                      </div>
                    </div>
                  </div>

                  {/* Body expansion */}
                  {isExpanded && (
                    <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-5 shadow-xs space-y-5 animate-fadeIn">
                      
                      {/* Observasi Kognitif */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-noesis-muted uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5 text-noesis-muted" />
                          <span>Observasi Kognitif</span>
                        </div>
                        <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3.5 text-xs text-noesis-text leading-relaxed select-text shadow-sm">
                          {refl.observation}
                        </div>
                      </div>

                      {/* Dasar Pembentukan Refleksi */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-noesis-muted uppercase tracking-wider">
                          <Layers className="w-3.5 h-3.5 text-noesis-muted" />
                          <span>Dasar Pembentukan Refleksi</span>
                        </div>
                        <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3 text-xs text-noesis-text leading-relaxed space-y-2">
                          <p className="text-noesis-text font-semibold text-[11px]">Refleksi ini terbentuk dari hubungan beberapa catatan:</p>
                          <p className="text-noesis-muted italic pl-2 border-l-2 border-noesis-border leading-relaxed select-text">
                            {refl.formationBasis || 'Refleksi ini dibentuk berdasarkan klaster informasi dan hubungan semantis yang terdeteksi di Vault Anda.'}
                          </p>
                        </div>
                      </div>

                      {/* Pertanyaan Induktif */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-noesis-muted uppercase tracking-wider">
                          <HelpCircle className="w-3.5 h-3.5 text-noesis-muted" />
                          <span>Pertanyaan Induktif</span>
                        </div>
                        <div className="bg-noesis-bg border border-l-2 border-l-noesis-accent border-y-noesis-border border-r-noesis-border rounded-xl p-3 text-xs text-noesis-text font-semibold leading-relaxed select-text">
                          "{refl.question}"
                        </div>
                      </div>

                      {/* Terhubung Dengan */}
                      {renderRelatedKnowledge(refl)}

                      {/* Catatan Terkait */}
                      {refl.relatedNoteIds && refl.relatedNoteIds.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-noesis-muted uppercase tracking-wider">
                            <FileText className="w-3 h-3" />
                            <span>Catatan Terkait ({refl.relatedNoteIds.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {refl.relatedNoteIds.map((noteId) => (
                              <div
                                key={noteId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-noesis-bg border border-noesis-border text-[10px] text-noesis-muted"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-noesis-text shadow-xs" />
                                <span className="truncate max-w-[150px] font-medium text-noesis-text">{getNoteTitle(noteId)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[9px] text-noesis-muted pt-1 flex justify-between items-center">
                        <span>Refl-ID: {refl.id.split('_').slice(-2).join('_')}</span>
                        <span>Dibuat: {new Date(refl.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


