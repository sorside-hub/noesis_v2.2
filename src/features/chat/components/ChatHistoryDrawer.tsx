import React, { useState, useRef, useEffect } from 'react';
import { ChatThread } from '../../../shared/types';
import {
  X,
  Plus,
  MessageSquare,
  MoreVertical,
  Pin,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  onRenameThread: (threadId: string, newTitle: string) => void;
  onTogglePinThread: (threadId: string) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
  onTogglePinThread,
}) => {
  const [menuOpenThreadId, setMenuOpenThreadId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingThreadId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingThreadId]);

  if (!isOpen) return null;

  // Sort threads: Pinned threads first, then by last updated
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.lastUpdated - a.lastUpdated;
  });

  const handleStartRename = (thread: ChatThread) => {
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
    setMenuOpenThreadId(null);
  };

  const handleSaveRename = (threadId: string) => {
    if (editTitle.trim()) {
      onRenameThread(threadId, editTitle.trim());
    }
    setEditingThreadId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        onClick={() => {
          setMenuOpenThreadId(null);
          onClose();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel (Slide from Left) */}
      <div className="relative w-4/5 max-w-xs h-full bg-noesis-bg border-r border-noesis-border flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-noesis-border bg-noesis-surface/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-noesis-muted" />
            <span className="font-semibold text-sm text-noesis-text">
              Riwayat Chat
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-noesis-border">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-3 bg-noesis-accent hover:bg-noesis-accent-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-noesis-accent/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Obrolan Baru</span>
          </button>
        </div>

        {/* Thread List - Standard Clean Chatbot Style */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <MessageSquare className="w-8 h-8 text-noesis-muted/50 mb-2" />
              <p className="text-xs text-noesis-muted font-medium">Belum ada riwayat chat</p>
              <p className="text-[11px] text-noesis-muted/70 mt-1">
                Mulai obrolan baru untuk menyimpan riwayat percakapan Anda.
              </p>
            </div>
          ) : (
            sortedThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const isMenuOpen = menuOpenThreadId === thread.id;
            const isEditing = editingThreadId === thread.id;

            return (
              <div key={thread.id} className="relative">
                <div
                  onClick={() => {
                    if (!isEditing) {
                      onSelectThread(thread.id);
                      onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-noesis-surface border-noesis-border text-noesis-text'
                      : 'bg-transparent border-transparent text-noesis-muted hover:bg-noesis-surface/60 hover:text-noesis-text'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 pr-1">
                    {thread.pinned ? (
                      <Pin className="w-3.5 h-3.5 text-noesis-accent shrink-0 rotate-45" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    )}

                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(thread.id);
                            if (e.key === 'Escape') setEditingThreadId(null);
                          }}
                          className="w-full bg-noesis-bg border border-noesis-accent text-noesis-text text-xs px-2 py-1 rounded-md focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRename(thread.id)}
                          className="p-1 text-noesis-accent hover:bg-noesis-surface-hover rounded-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-medium truncate ${
                          isActive ? 'text-noesis-text' : 'text-noesis-muted group-hover:text-noesis-text'
                        }`}
                      >
                        {thread.title}
                      </span>
                    )}
                  </div>

                  {/* 3 Dots Vertikal Menu Button */}
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenThreadId(isMenuOpen ? null : thread.id);
                      }}
                      className="p-1 rounded-md text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface-hover transition-colors shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Popup Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    className="absolute right-2 top-10 z-30 w-36 bg-noesis-surface border border-noesis-border rounded-xl shadow-xl p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        onTogglePinThread(thread.id);
                        setMenuOpenThreadId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-noesis-text hover:bg-noesis-surface-hover transition-colors text-left"
                    >
                      <Pin className="w-3.5 h-3.5 text-noesis-muted" />
                      <span>{thread.pinned ? 'Unpin' : 'Pin'}</span>
                    </button>

                    <button
                      onClick={() => handleStartRename(thread)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-noesis-text hover:bg-noesis-surface-hover transition-colors text-left"
                    >
                      <Pencil className="w-3.5 h-3.5 text-noesis-muted" />
                      <span>Edit Judul</span>
                    </button>

                    <button
                      onClick={() => {
                        onDeleteThread(thread.id);
                        setMenuOpenThreadId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
};
