import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trash2, RotateCcw, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import { NoteItem } from './VaultPage';
import { CATEGORIES } from './CategoryPage';
import { formatDateToDMY } from '../../../shared/utils/dateUtils';
import { VaultHeader } from '../components/VaultHeader';

interface TrashPageProps {
  trashNotes: NoteItem[];
  onBack: () => void;
  onOpenNote: (note: NoteItem) => void;
  onRestoreNote: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onEmptyTrash: () => void;
  toastMessage?: string | null;
}

export const TrashPage: React.FC<TrashPageProps> = ({
  trashNotes,
  onBack,
  onOpenNote,
  onRestoreNote,
  onDeletePermanently,
  onEmptyTrash,
  toastMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trashNotes;
    return trashNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [trashNotes, searchQuery]);

  const noteToDelete = useMemo(() => {
    if (!deleteTargetId) return null;
    return trashNotes.find((n) => n.id === deleteTargetId) || null;
  }, [deleteTargetId, trashNotes]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-noesis-bg">
      {/* Self-contained Vault Header */}
      <VaultHeader onBack={onBack} />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col max-w-lg mx-auto w-full pb-20">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-noesis-surface text-noesis-text border border-noesis-border px-4 py-2 rounded-full text-xs shadow-xl animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Header Title & Empty Trash Button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-noesis-muted" />
              <h1 className="text-xl font-bold text-noesis-text tracking-tight">Sampah</h1>
            </div>
            <p className="text-[11px] text-noesis-muted mt-0.5">
              {trashNotes.length} catatan berada di sampah
            </p>
          </div>

          {trashNotes.length > 0 && (
            <button
              onClick={() => setShowEmptyConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Sampah</span>
            </button>
          )}
        </div>

        {/* Search Input inside Trash */}
        {trashNotes.length > 0 && (
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-noesis-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam sampah..."
              className="w-full pl-9 pr-4 py-2 bg-noesis-surface border border-noesis-border focus:border-noesis-accent rounded-xl text-xs text-noesis-text placeholder:text-noesis-muted outline-none transition-colors"
            />
          </div>
        )}

        {/* List of Trashed Notes */}
        {filteredNotes.length > 0 ? (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const categoryObj = CATEGORIES.find((c) => c.id === note.category);
              return (
                <div
                  key={note.id}
                  onClick={() => onOpenNote(note)}
                  className="p-4 bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border hover:border-noesis-border rounded-2xl flex flex-col gap-2.5 shadow-sm transition-colors cursor-pointer group"
                >
                  {/* Top row: Title & Category */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-noesis-text group-hover:text-noesis-text transition-colors truncate flex-1">
                      {note.title.trim() || 'Catatan Tanpa Judul'}
                    </h3>
                    {categoryObj && (
                      <span className="text-[10px] font-medium text-noesis-muted bg-noesis-surface-hover px-2 py-0.5 rounded-full border border-noesis-border shrink-0 flex items-center gap-1">
                        <span>{categoryObj.emoji}</span>
                        <span>{categoryObj.title}</span>
                      </span>
                    )}
                  </div>

                  {/* Content snippet */}
                  <p className="text-xs text-noesis-muted line-clamp-2 leading-relaxed">
                    {note.content.trim() || 'Catatan kosong...'}
                  </p>

                  {/* Footer info & Action buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-noesis-border flex-wrap gap-2">
                    <div className="text-[10px] text-noesis-muted">
                      {note.deletedAt ? (
                        <span>Dihapus: {formatDateToDMY(note.deletedAt)}</span>
                      ) : (
                        <span>Dibuat: {formatDateToDMY(note.createdAt)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreNote(note.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-noesis-surface hover:bg-noesis-surface-hover text-noesis-text border border-noesis-border rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Pulihkan</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(note.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-8 flex flex-col items-center justify-center text-center my-6">
            <div className="w-12 h-12 rounded-2xl bg-noesis-bg border border-noesis-border flex items-center justify-center text-noesis-muted mb-3">
              <Trash2 className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h4 className="text-xs font-semibold text-noesis-text mb-1">
              {searchQuery.trim() ? 'Tidak Ada Hasil' : 'Sampah Kosong'}
            </h4>
            <p className="text-[11px] text-noesis-muted max-w-xs leading-relaxed">
              {searchQuery.trim()
                ? `Tidak ditemukan catatan di sampah yang cocok dengan "${searchQuery}".`
                : 'Catatan yang Anda hapus akan dipindahkan ke folder Sampah ini sehingga dapat dipulihkan kapan saja.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-noesis-text font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Kosongkan Seluruh Sampah?</span>
            </div>
            <p className="text-xs text-noesis-muted leading-relaxed">
              Tindakan ini akan menghapus secara permanen <strong className="text-noesis-text">{trashNotes.length} catatan</strong> yang ada di sampah beserta seluruh data vektor terkait. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="flex-1 py-2 bg-noesis-surface-hover hover:bg-noesis-surface text-noesis-text text-xs font-medium rounded-xl transition-colors cursor-pointer border border-noesis-border"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onEmptyTrash();
                  setShowEmptyConfirm(false);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Single Note Delete Permanently */}
      {deleteTargetId && noteToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-noesis-text font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Hapus Permanen Catatan?</span>
            </div>
            <p className="text-xs text-noesis-muted leading-relaxed">
              Catatan <strong className="text-noesis-text">"{noteToDelete.title || 'Catatan Tanpa Judul'}"</strong> akan dihapus selamanya dari penyimpanan lokal Anda.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 bg-noesis-surface-hover hover:bg-noesis-surface text-noesis-text text-xs font-medium rounded-xl transition-colors cursor-pointer border border-noesis-border"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeletePermanently(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
