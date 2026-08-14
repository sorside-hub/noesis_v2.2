import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Tag,
  Hash,
  ArrowLeft,
  Search,
  StickyNote,
  Clock,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { NoteItem, CategoryId } from './VaultPage';
import { useNotes } from '../hooks/useNotes';
import { formatDateToDMY } from '../../../shared/utils/dateUtils';
import { VaultHeader } from '../components/VaultHeader';

interface TagPageProps {
  initialTag?: string | null;
  notes?: NoteItem[];
  onBack: () => void;
  onSelectNote: (note: NoteItem) => void;
  onSelectTag?: (tag: string) => void;
  toastMessage?: string | null;
}

// Module-level persistent state across page mounts and tab switches
let savedTagExplorerScrollTop = 0;
let savedTagDetailScrollTop = 0;
let savedSearchTagQuery = '';
let savedSearchNoteQuery = '';

const CATEGORY_MAP: Record<CategoryId, { label: string; emoji: string; bgColor: string }> = {
  world: { label: 'World', emoji: '🌍', bgColor: 'bg-noesis-surface text-noesis-text border-noesis-border' },
  self: { label: 'Self', emoji: '🪞', bgColor: 'bg-noesis-surface text-noesis-text border-noesis-border' },
  ideas: { label: 'Ideas', emoji: '💡', bgColor: 'bg-noesis-surface text-noesis-text border-noesis-border' },
  all: { label: 'Lainnya', emoji: '📁', bgColor: 'bg-noesis-surface text-noesis-text border-noesis-border' },
};

export const TagPage: React.FC<TagPageProps> = ({
  initialTag = null,
  notes: propNotes,
  onBack,
  onSelectNote,
  onSelectTag,
  toastMessage,
}) => {
  const { activeNotes: hookActiveNotes } = useNotes();
  const allNotes = useMemo(() => {
    const raw = propNotes !== undefined ? propNotes : hookActiveNotes;
    return raw.filter((n) => !n.deletedAt);
  }, [propNotes, hookActiveNotes]);

  const [activeTag, setActiveTag] = useState<string | null>(initialTag || null);
  const [searchTagQuery, setSearchTagQuery] = useState<string>(savedSearchTagQuery);
  const [searchNoteQuery, setSearchNoteQuery] = useState<string>(savedSearchNoteQuery);

  const tagExplorerContainerRef = useRef<HTMLDivElement | null>(null);
  const tagDetailContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveTag(initialTag);
    if (initialTag) {
      savedTagDetailScrollTop = 0;
    }
  }, [initialTag]);

  // Restore scroll positions when views change or mount
  useLayoutEffect(() => {
    if (!activeTag && tagExplorerContainerRef.current) {
      tagExplorerContainerRef.current.scrollTop = savedTagExplorerScrollTop;
      const timer = requestAnimationFrame(() => {
        if (tagExplorerContainerRef.current) {
          tagExplorerContainerRef.current.scrollTop = savedTagExplorerScrollTop;
        }
      });
      return () => cancelAnimationFrame(timer);
    } else if (activeTag && tagDetailContainerRef.current) {
      tagDetailContainerRef.current.scrollTop = savedTagDetailScrollTop;
      const timer = requestAnimationFrame(() => {
        if (tagDetailContainerRef.current) {
          tagDetailContainerRef.current.scrollTop = savedTagDetailScrollTop;
        }
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [activeTag]);

  const handleTagExplorerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    savedTagExplorerScrollTop = e.currentTarget.scrollTop;
  };

  const handleTagDetailScroll = (e: React.UIEvent<HTMLDivElement>) => {
    savedTagDetailScrollTop = e.currentTarget.scrollTop;
  };

  const handleSearchTagQueryChange = (val: string) => {
    savedSearchTagQuery = val;
    setSearchTagQuery(val);
  };

  const handleSearchNoteQueryChange = (val: string) => {
    savedSearchNoteQuery = val;
    setSearchNoteQuery(val);
  };

  // Extract all unique tags with count
  const allTags = useMemo(() => {
    const map: Record<string, { originalTag: string; count: number }> = {};

    allNotes.forEach((note) => {
      (note.tags || []).forEach((rawTag) => {
        const clean = rawTag.replace(/^#/, '').trim();
        if (clean) {
          const key = clean.toLowerCase();
          if (map[key]) {
            map[key].count += 1;
          } else {
            map[key] = { originalTag: clean, count: 1 };
          }
        }
      });
    });

    return Object.values(map).sort((a, b) => b.count - a.count || a.originalTag.localeCompare(b.originalTag));
  }, [allNotes]);

  // Filter tags in Tag Explorer search
  const filteredTags = useMemo(() => {
    const q = searchTagQuery.trim().toLowerCase().replace(/^#/, '');
    if (!q) return allTags;
    return allTags.filter((t) => t.originalTag.toLowerCase().includes(q));
  }, [allTags, searchTagQuery]);

  // Get notes for active selected tag
  const taggedNotes = useMemo(() => {
    if (!activeTag) return [];
    const target = activeTag.replace(/^#/, '').trim().toLowerCase();

    let list = allNotes.filter((note) =>
      (note.tags || []).some(
        (t) => t.replace(/^#/, '').trim().toLowerCase() === target
      )
    );

    if (searchNoteQuery.trim()) {
      const q = searchNoteQuery.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
    }

    // Sort pinned first, then newest
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idB - idA;
    });
  }, [allNotes, activeTag, searchNoteQuery]);

  const handleSelectTagInternal = (tag: string) => {
    setActiveTag(tag);
    if (onSelectTag) onSelectTag(tag);
  };

  const handleBack = () => {
    onBack();
  };

  // 1. Render Tag Detail View when a tag is selected
  if (activeTag) {
    const displayTagName = activeTag.replace(/^#/, '');

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden select-none animate-fadeIn">
        {/* Self-contained Header */}
        <VaultHeader onBack={handleBack} />

        {/* Scrollable Container */}
        <div
          ref={tagDetailContainerRef}
          onScroll={handleTagDetailScroll}
          className="flex-1 overflow-y-auto px-4 py-5 flex flex-col max-w-lg mx-auto w-full pb-20"
        >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-noesis-surface text-noesis-text border border-noesis-border px-4 py-2 rounded-full text-xs shadow-xl animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-noesis-text tracking-tight">
                #{displayTagName}
              </h1>
              <span className="text-[10px] font-semibold text-noesis-muted bg-noesis-surface px-2 py-0.5 rounded-full border border-noesis-border">
                {taggedNotes.length} catatan
              </span>
            </div>
            <p className="text-[11px] text-noesis-muted mt-0.5">
              Daftar catatan dengan tag #{displayTagName}
            </p>
          </div>
        </div>

        {/* Search Bar inside Tag Detail */}
        {taggedNotes.length > 3 && (
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-noesis-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchNoteQuery}
              onChange={(e) => handleSearchNoteQueryChange(e.target.value)}
              placeholder={`Cari catatan di #${displayTagName}...`}
              className="w-full bg-noesis-surface border border-noesis-border focus:border-noesis-accent text-noesis-text text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-noesis-muted/60"
            />
          </div>
        )}

        {/* Note List for Selected Tag */}
        {taggedNotes.length > 0 ? (
          <div className="space-y-3">
            {taggedNotes.map((note) => {
              const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.all;
              const updateTime = note.updatedAt ? `Diedit: ${formatDateToDMY(note.updatedAt)}` : `Dibuat: ${formatDateToDMY(note.createdAt)}`;

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="w-full text-left p-4 bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border hover:border-noesis-border rounded-2xl transition-all cursor-pointer group flex flex-col gap-2 shadow-sm relative"
                >
                  {/* Title & Category Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-noesis-text group-hover:text-noesis-text transition-colors truncate flex-1">
                      {note.title.trim() || 'Catatan Tanpa Judul'}
                    </h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${cat.bgColor}`}>
                      {cat.emoji} {cat.label}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <p className="text-xs text-noesis-muted line-clamp-2 leading-relaxed">
                    {note.content.trim() || 'Catatan kosong...'}
                  </p>

                  {/* Footer: Update Time & Tags */}
                  <div className="flex items-center justify-between pt-2 border-t border-noesis-border text-[10px] text-noesis-muted flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-noesis-muted" />
                      <span>{updateTime}</span>
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {note.tags.map((t, idx) => {
                          const cleanT = t.replace(/^#/, '');
                          const isCurrent = cleanT.toLowerCase() === displayTagName.toLowerCase();

                          return (
                            <span
                              key={idx}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                isCurrent
                                  ? 'bg-noesis-surface-hover text-noesis-accent border border-noesis-accent/40'
                                  : 'bg-noesis-bg text-noesis-muted border border-noesis-border'
                              }`}
                            >
                              #{cleanT}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-6 flex flex-col items-center justify-center text-center my-6">
            <div className="w-12 h-12 rounded-2xl bg-noesis-bg border border-noesis-border flex items-center justify-center text-noesis-muted mb-3">
              <Hash className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h4 className="text-xs font-semibold text-noesis-text mb-1">
              Tidak Ada Catatan
            </h4>
            <p className="text-[11px] text-noesis-muted max-w-xs leading-relaxed">
              Belum ada catatan yang menggunakan tag #{displayTagName}.
            </p>
          </div>
        )}
      </div>
      </div>
    );
  }

  // 2. Render Tag Explorer Overview (List of all unique tags)
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none animate-fadeIn">
      {/* Self-contained Header */}
      <VaultHeader onBack={handleBack} />

      {/* Scrollable Container */}
      <div
        ref={tagExplorerContainerRef}
        onScroll={handleTagExplorerScroll}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col max-w-lg mx-auto w-full pb-20"
      >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-noesis-surface text-noesis-text border border-noesis-border px-4 py-2 rounded-full text-xs shadow-xl animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-noesis-text tracking-tight">
              Tag Explorer
            </h1>
          </div>
          <p className="text-[11px] text-noesis-muted mt-0.5">
            Jelajahi ide & catatan berdasarkan tag dinamis
          </p>
        </div>
      </div>

      {/* Tag Search Bar */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 text-noesis-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTagQuery}
          onChange={(e) => handleSearchTagQueryChange(e.target.value)}
          placeholder="Cari tag di Vault..."
          className="w-full bg-noesis-surface border border-noesis-border focus:border-noesis-accent text-noesis-text text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-noesis-muted/60"
        />
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <span className="text-xs font-semibold text-noesis-muted uppercase tracking-wider">
          Semua Tag ({allTags.length})
        </span>
      </div>

      {/* List / Grid of Unique Tags */}
      {filteredTags.length > 0 ? (
        <div className="space-y-2.5">
          {filteredTags.map((item) => (
            <button
              key={item.originalTag}
              onClick={() => handleSelectTagInternal(item.originalTag)}
              className="flex items-center justify-between p-3.5 bg-noesis-surface hover:bg-noesis-surface-hover active:scale-[0.99] border border-noesis-border hover:border-noesis-border rounded-2xl transition-all cursor-pointer group shadow-sm text-left w-full"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-noesis-bg border border-noesis-border flex items-center justify-center text-noesis-muted shrink-0 group-hover:scale-105 transition-transform">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-noesis-text group-hover:text-noesis-text transition-colors truncate">
                    #{item.originalTag}
                  </h3>
                  <p className="text-[11px] text-noesis-muted">
                    {item.count} {item.count === 1 ? 'catatan' : 'catatan'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-noesis-muted group-hover:text-noesis-text group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-6 flex flex-col items-center justify-center text-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-noesis-bg border border-noesis-border flex items-center justify-center text-noesis-muted mb-3">
            <Tag className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h4 className="text-xs font-semibold text-noesis-text mb-1">
            {searchTagQuery.trim() ? 'Tag Tidak Ditemukan' : 'Belum Ada Tag'}
          </h4>
          <p className="text-[11px] text-noesis-muted max-w-xs leading-relaxed">
            {searchTagQuery.trim()
              ? `Tidak ditemukan tag yang cocok dengan "${searchTagQuery}".`
              : 'Gunakan #tag pada judul atau isi catatanmu untuk mengelompokkan topik secara otomatis.'}
          </p>
        </div>
      )}
    </div>
    </div>
  );
};
