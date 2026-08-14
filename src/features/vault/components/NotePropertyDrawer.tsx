import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Loader2,
  Wand2,
  Clock,
} from 'lucide-react';
import { CategoryId, NoteItem } from '../pages/VaultPage';
import { useAutoDetect } from '../../ai-tools/autodetect/useAutoDetect';
import { useAutoCorrect } from '../../ai-tools/autocorrect/useAutoCorrect';
import { AutoCorrectModal } from '../../ai-tools/autocorrect/AutoCorrectModal';
import { AutoDetectPreviewModal } from '../../ai-tools/autodetect/AutoDetectPreviewModal';
import { AutoDetectResult } from '../../ai-tools/autodetect/autoDetectService';
import { NoteLinksSection } from './NoteLinksSection';
import { RelatedNotesSection } from './RelatedNotesSection';
import { InsightContextSection } from './InsightContextSection';
import { formatDateToDMY } from '../../../shared/utils/dateUtils';

interface NotePropertyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type?: string;
  onTypeChange?: (type: string) => void;
  category: CategoryId;
  onCategoryChange: (cat: CategoryId) => void;
  createdDate?: string;
  updatedDate?: string;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  noteContent?: string;
  noteTitle?: string;
  currentNoteId?: string;
  allNotes?: NoteItem[];
  onSelectNoteByTitle?: (title: string) => void;
  onSelectTag?: (tag: string) => void;
  onTitleChange?: (title: string) => void;
  onAutoDetectResult?: (result: { title: string; category: CategoryId; type?: string; tags: string[]; summary?: string; confidence?: number }) => void;
  onAutoCorrectApply?: (newContent: string) => void;
  hideRelatedNotes?: boolean;
  isEditorMode?: boolean;
}

const CATEGORIES_OPTIONS: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'world', label: 'World', emoji: '🌍' },
  { id: 'self', label: 'Self', emoji: '🪞' },
  { id: 'ideas', label: 'Ideas', emoji: '💡' },
];

export const NotePropertyDrawer: React.FC<NotePropertyDrawerProps> = ({
  isOpen,
  onClose,
  type = 'unknown',
  onTypeChange,
  category,
  onCategoryChange,
  createdDate = 'Hari ini',
  updatedDate,
  tags = [],
  onTagsChange,
  noteContent = '',
  noteTitle = '',
  currentNoteId,
  allNotes = [],
  onSelectNoteByTitle,
  onSelectTag,
  onTitleChange,
  onAutoDetectResult,
  onAutoCorrectApply,
  hideRelatedNotes = false,
  isEditorMode = false,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto Detect Preview Modal state
  const [isAutoDetectPreviewOpen, setIsAutoDetectPreviewOpen] = useState(false);
  const [autoDetectPreviewData, setAutoDetectPreviewData] = useState<AutoDetectResult | null>(null);

  // Auto Correct Modal state
  const [isAutoCorrectModalOpen, setIsAutoCorrectModalOpen] = useState(false);
  const [autoCorrectData, setAutoCorrectData] = useState<{ original: string; corrected: string }>({
    original: '',
    corrected: '',
  });

  const { runAutoDetect, isLoading: isAutoDetectLoading, error: autoDetectError } = useAutoDetect();
  const { runAutoCorrect, isLoading: isAutoCorrectLoading, error: autoCorrectError } = useAutoCorrect();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [expandedSections, setExpandedSections] = useState(() => {
    return {
      metadata: localStorage.getItem('noesis_drawer_expanded_metadata') !== 'false',
      aiTools: localStorage.getItem('noesis_drawer_expanded_aiTools') !== 'false',
      waktu: localStorage.getItem('noesis_drawer_expanded_waktu') !== 'false',
    };
  });

  const toggleSection = (section: 'metadata' | 'aiTools' | 'waktu') => {
    setExpandedSections((prev) => {
      const newVal = !prev[section];
      localStorage.setItem(`noesis_drawer_expanded_${section}`, String(newVal));
      return { ...prev, [section]: newVal };
    });
  };

  // Scroll Restoration
  useEffect(() => {
    if (isOpen && currentNoteId && scrollContainerRef.current) {
      const savedScroll = localStorage.getItem(`noesis_drawer_scroll_${currentNoteId}`);
      if (savedScroll !== null) {
        const timeoutId = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      } else {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, currentNoteId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (currentNoteId) {
      const scrollTop = e.currentTarget.scrollTop;
      localStorage.setItem(`noesis_drawer_scroll_${currentNoteId}`, String(scrollTop));
    }
  };

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed];
      if (onTagsChange) onTagsChange(updated);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    if (onTagsChange) onTagsChange(updated);
  };

  const handleAutoDetectClick = async () => {
    setLocalError(null);
    if (!noteContent || !noteContent.trim()) {
      setLocalError('Isi catatan masih kosong. Tulis catatan terlebih dahulu.');
      return;
    }

    const result = await runAutoDetect(noteContent, noteTitle);
    if (result) {
      setAutoDetectPreviewData(result);
      setIsAutoDetectPreviewOpen(true);
    }
  };

  const handleApplyAutoDetect = (result: AutoDetectResult) => {
    if (onAutoDetectResult) {
      onAutoDetectResult(result);
    } else {
      if (result.title && onTitleChange) onTitleChange(result.title);
      if (result.category) onCategoryChange(result.category);
      if (result.type && onTypeChange) onTypeChange(result.type);
      if (result.tags && onTagsChange) onTagsChange(result.tags);
    }
    setIsAutoDetectPreviewOpen(false);
  };

  const handleAutoCorrectClick = async () => {
    setLocalError(null);
    if (!noteContent || !noteContent.trim()) {
      setLocalError('Isi catatan masih kosong. Tulis catatan terlebih dahulu.');
      return;
    }

    const result = await runAutoCorrect(noteContent);
    if (result) {
      setAutoCorrectData({
        original: noteContent,
        corrected: result.correctedText,
      });
      setIsAutoCorrectModalOpen(true);
    }
  };

  const handleApplyAutoCorrect = (newContent: string) => {
    if (onAutoCorrectApply) {
      onAutoCorrectApply(newContent);
    }
  };

  const activeError = localError || autoDetectError || autoCorrectError;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="relative w-5/6 max-w-xs h-full bg-noesis-bg border-l border-noesis-border flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header Drawer */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-noesis-border bg-noesis-surface/50 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-noesis-muted" />
            <span className="font-semibold text-sm text-noesis-text">
              Properti Catatan
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface transition-colors cursor-pointer"
            aria-label="Tutup Properti Catatan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Metadata Sections */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-6 text-xs scroll-smooth"
        >
          {/* Metadata Dasar Section */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('metadata')}
              className="w-full flex items-center justify-between group py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-noesis-muted" />
                <span className="text-[11px] font-semibold text-noesis-muted uppercase tracking-wider group-hover:text-noesis-text transition-colors">
                  Metadata Dasar
                </span>
              </div>
              <div className="text-noesis-muted group-hover:text-noesis-text transition-colors">
                {expandedSections.metadata ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {expandedSections.metadata && (
              <div className="space-y-4 pt-1 animate-fade-in pl-1">
                {/* 1. Type Text Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-noesis-muted uppercase tracking-wider block">
                    Type
                  </label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => onTypeChange && onTypeChange(e.target.value)}
                    placeholder="Misal: journal, reflection, concept, idea..."
                    className="w-full bg-noesis-surface border border-noesis-border text-noesis-text text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-noesis-text transition-colors placeholder:text-noesis-muted/60"
                  />
                </div>

                {/* 2. Kategori Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-noesis-muted uppercase tracking-wider block">
                    Kategori
                  </label>
                  <div className="relative">
                    <select
                      value={category === 'all' ? 'self' : category}
                      onChange={(e) => onCategoryChange(e.target.value as CategoryId)}
                      className="w-full appearance-none bg-noesis-surface border border-noesis-border text-noesis-text text-xs font-medium rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-noesis-text cursor-pointer transition-colors"
                    >
                      {CATEGORIES_OPTIONS.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-noesis-surface text-noesis-text">
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-noesis-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Tag / Penanda */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-noesis-muted uppercase tracking-wider block">
                      Tag / Penanda
                    </label>
                    {!isAddingTag && (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="text-[10px] text-noesis-text hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Tag</span>
                      </button>
                    )}
                  </div>

                  <div className="p-3 bg-noesis-surface border border-noesis-border rounded-xl space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {tags && tags.length > 0 ? (
                        tags.map((tag, idx) => {
                          const cleanTag = tag.replace(/^#/, '');
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-noesis-bg hover:bg-noesis-surface-hover border border-noesis-border text-noesis-muted hover:text-noesis-text text-[10px] font-medium rounded-lg group transition-all"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectTag) {
                                    onClose();
                                    onSelectTag(cleanTag);
                                  }
                                }}
                                className="cursor-pointer hover:underline"
                              >
                                #{cleanTag}
                              </button>
                              {onTagsChange && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTag(tag);
                                  }}
                                  className="text-noesis-muted hover:text-noesis-text transition-colors cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-noesis-muted italic">
                          Belum ada tag
                        </span>
                      )}
                    </div>

                    {isAddingTag && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-noesis-border">
                        <input
                          type="text"
                          placeholder="Nama tag..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                            if (e.key === 'Escape') {
                              setIsAddingTag(false);
                              setNewTagInput('');
                            }
                          }}
                          autoFocus
                          className="flex-1 bg-noesis-bg border border-noesis-border text-noesis-text text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-noesis-text"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-2 py-1 bg-noesis-accent text-white text-[10px] font-medium rounded-lg hover:opacity-90 cursor-pointer"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingTag(false);
                            setNewTagInput('');
                          }}
                          className="p-1 text-noesis-muted hover:text-noesis-text cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Tools Section */}
          <div className="pt-3 border-t border-noesis-border space-y-2.5">
            <button
              type="button"
              onClick={() => toggleSection('aiTools')}
              className="w-full flex items-center justify-between group py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-noesis-muted" />
                <span className="text-[11px] font-semibold text-noesis-muted uppercase tracking-wider group-hover:text-noesis-text transition-colors">
                  Otomatisasi AI
                </span>
              </div>
              <div className="text-noesis-muted group-hover:text-noesis-text transition-colors">
                {expandedSections.aiTools ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {expandedSections.aiTools && (
              <div className="space-y-2.5 pt-1 animate-fade-in pl-1">
                {/* Tombol AI Auto-Detect & Auto-Correct dalam 1 baris */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDetectClick}
                    disabled={isAutoDetectLoading || isAutoCorrectLoading}
                    className="py-2 px-2.5 bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border hover:border-noesis-text text-noesis-text text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isAutoDetectLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-noesis-muted animate-spin shrink-0" />
                        <span className="text-noesis-muted truncate text-[11px]">Proses...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-noesis-muted group-hover:scale-110 group-hover:rotate-12 transition-transform shrink-0" />
                        <span className="text-noesis-muted group-hover:text-noesis-text transition-colors truncate text-[11px]">auto-detect</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoCorrectClick}
                    disabled={isAutoDetectLoading || isAutoCorrectLoading}
                    className="py-2 px-2.5 bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border hover:border-noesis-text text-noesis-text text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isAutoCorrectLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-noesis-muted animate-spin shrink-0" />
                        <span className="text-noesis-muted truncate text-[11px]">Proses...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-noesis-muted group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-noesis-muted group-hover:text-noesis-text transition-colors truncate text-[11px]">auto-correct</span>
                      </>
                    )}
                  </button>
                </div>

                {activeError && (
                  <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg leading-relaxed animate-fade-in">
                    {activeError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Links Relationship Section (Outgoing Links & Backlinks) */}
          {!isEditorMode && (
            <NoteLinksSection
              currentNoteId={currentNoteId}
              noteTitle={noteTitle}
              noteContent={noteContent}
              allNotes={allNotes}
              onSelectNoteByTitle={onSelectNoteByTitle}
            />
          )}

          {/* Automatic Related Notes Section (RAG) - Only in Detail Mode */}
          {!isEditorMode && !hideRelatedNotes && (
            <RelatedNotesSection
              currentNoteId={currentNoteId}
              noteTitle={noteTitle}
              noteContent={noteContent}
              allNotes={allNotes}
              onSelectNoteByTitle={onSelectNoteByTitle}
            />
          )}

          {/* Insight Context Section (Themes, Thinking Patterns, Connections) */}
          {!isEditorMode && (
            <InsightContextSection
              currentNoteId={currentNoteId}
              onCloseDrawer={onClose}
            />
          )}

          {/* Waktu Metadata */}
          <div className="pt-3 border-t border-noesis-border space-y-1.5">
            <button
              type="button"
              onClick={() => toggleSection('waktu')}
              className="w-full flex items-center justify-between group py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-noesis-muted shrink-0" />
                <span className="text-[11px] font-semibold text-noesis-muted uppercase tracking-wider group-hover:text-noesis-text transition-colors">
                  Waktu & Riwayat
                </span>
              </div>
              <div className="text-noesis-muted group-hover:text-noesis-text transition-colors">
                {expandedSections.waktu ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {expandedSections.waktu && (
              <div className="p-3 bg-noesis-surface border border-noesis-border rounded-xl space-y-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-noesis-muted">Dibuat:</span>
                  <span className="text-noesis-text font-medium text-[11px]">{formatDateToDMY(createdDate)}</span>
                </div>
                {updatedDate && (
                  <div className="flex items-center justify-between border-t border-noesis-border pt-2">
                    <span className="text-noesis-muted">Diperbarui:</span>
                    <span className="text-noesis-text font-medium text-[11px]">{formatDateToDMY(updatedDate)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-noesis-border bg-noesis-surface/50 flex items-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-noesis-accent hover:bg-noesis-accent-hover active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-noesis-accent/20 transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Auto Detect Preview Modal */}
      <AutoDetectPreviewModal
        isOpen={isAutoDetectPreviewOpen}
        onClose={() => setIsAutoDetectPreviewOpen(false)}
        onEdit={() => setIsAutoDetectPreviewOpen(false)}
        onApply={handleApplyAutoDetect}
        result={autoDetectPreviewData}
      />

      {/* Auto Correct Comparison Modal */}
      <AutoCorrectModal
        isOpen={isAutoCorrectModalOpen}
        onClose={() => setIsAutoCorrectModalOpen(false)}
        originalText={autoCorrectData.original}
        correctedText={autoCorrectData.corrected}
        onApply={handleApplyAutoCorrect}
      />
    </div>
  );
};
