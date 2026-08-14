import React from 'react';
import { Sparkles, Check, X, Edit3, AlertTriangle, Tag, Folder, AlignLeft, BarChart2, FileText } from 'lucide-react';
import { CategoryId } from '../../vault/pages/VaultPage';
import { AutoDetectResult } from './autoDetectService';

interface AutoDetectPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onApply: (result: AutoDetectResult) => void;
  result: AutoDetectResult | null;
}

const CATEGORY_LABELS: Record<CategoryId, { label: string; emoji: string; color: string }> = {
  world: { label: 'World', emoji: '🌍', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  self: { label: 'Self', emoji: '🪞', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  ideas: { label: 'Ideas', emoji: '💡', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  all: { label: 'Lainnya', emoji: '📁', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

export const AutoDetectPreviewModal: React.FC<AutoDetectPreviewModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onApply,
  result,
}) => {
  if (!isOpen || !result) return null;

  const rawConfidence = result.confidence ?? 0.8;
  const confidencePercent = Math.round(rawConfidence * 100);
  const isLowConfidence = rawConfidence < 0.6;

  const categoryInfo = CATEGORY_LABELS[result.category] || CATEGORY_LABELS.self;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-noesis-surface border border-noesis-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-noesis-border bg-noesis-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-noesis-surface-hover border border-noesis-border rounded-xl text-noesis-text">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-noesis-text flex items-center gap-1.5">
                  ✨ Noesis Analysis
                </h3>
              </div>
              <p className="text-[11px] text-noesis-muted mt-0.5">
                Preview hasil deteksi metadata otomatis untuk catatanmu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface-hover rounded-lg transition-all cursor-pointer"
            title="Batal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Low Confidence Warning */}
        {isLowConfidence && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>AI kurang yakin dengan klasifikasi ini. Silakan review sebelum menerapkan.</span>
          </div>
        )}

        {/* Content Details */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-noesis-text">
          {/* Title Section */}
          <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-noesis-muted mb-1 flex items-center gap-1.5">
              <span>Title</span>
            </div>
            <p className="text-sm font-semibold text-noesis-text leading-snug">
              {result.title || '(Tanpa Judul)'}
            </p>
          </div>

          {/* Category & Confidence Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-noesis-muted mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-noesis-muted" />
                <span>Category</span>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${categoryInfo.color}`}>
                  <span>{categoryInfo.emoji}</span>
                  <span>{categoryInfo.label}</span>
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-noesis-muted mb-1.5 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-noesis-muted" />
                <span>Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${isLowConfidence ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {confidencePercent}%
                </span>
                <div className="flex-1 bg-noesis-surface-hover h-1.5 rounded-full overflow-hidden border border-noesis-border">
                  <div
                    className={`h-full rounded-full ${isLowConfidence ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, confidencePercent))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Type Section */}
          <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-noesis-muted mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-noesis-muted" />
              <span>Type</span>
            </div>
            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-noesis-surface text-noesis-text border border-noesis-border">
              {result.type || 'unknown'}
            </span>
          </div>

          {/* Tags Section */}
          <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-noesis-muted mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-noesis-muted" />
              <span>Tags</span>
            </div>
            {result.tags && result.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-noesis-surface text-noesis-muted border border-noesis-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-noesis-muted italic text-[11px]">Tidak ada tag</span>
            )}
          </div>

          {/* Summary Section */}
          <div className="bg-noesis-bg border border-noesis-border rounded-xl p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-noesis-muted mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-noesis-muted" />
              <span>Summary</span>
            </div>
            <p className="text-xs text-noesis-text leading-relaxed">
              {result.summary || 'Tidak ada ringkasan.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-noesis-surface border-t border-noesis-border flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface-hover transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-noesis-surface-hover hover:bg-noesis-surface text-noesis-text border border-noesis-border transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(result);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-noesis-text hover:opacity-90 text-noesis-bg shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
