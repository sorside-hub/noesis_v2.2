import React from 'react';
import { ThinkingPattern } from '../types/thinkingPattern';
import { Layers, Hash, Activity, Clock, Repeat, ChevronRight } from 'lucide-react';
import { formatDateToDMY } from '../../../shared/utils/dateUtils';

interface ThinkingPatternCardProps {
  pattern: ThinkingPattern;
  onClick?: (pattern: ThinkingPattern) => void;
}

export const ThinkingPatternCard: React.FC<ThinkingPatternCardProps> = ({ pattern, onClick }) => {
  const formatTime = (ts: number) => {
    return formatDateToDMY(ts);
  };

  const getStrengthBadge = (strength: 'Strong' | 'Moderate' | 'Weak' | string) => {
    switch (strength) {
      case 'Strong':
      case 'Sangat Kuat':
      case 'Kuat':
        return {
          label: 'Kuat',
          bgColor: 'bg-noesis-surface-hover',
          borderColor: 'border-noesis-border',
          textColor: 'text-noesis-text font-semibold',
        };
      case 'Moderate':
      case 'Moderat':
      case 'Sedang':
        return {
          label: 'Moderat',
          bgColor: 'bg-noesis-surface',
          borderColor: 'border-noesis-border',
          textColor: 'text-noesis-muted font-medium',
        };
      default:
        return {
          label: 'Ringan',
          bgColor: 'bg-noesis-bg',
          borderColor: 'border-noesis-border',
          textColor: 'text-noesis-muted',
        };
    }
  };

  const badge = getStrengthBadge(pattern.evidenceStrength);

  return (
    <div
      onClick={() => onClick && onClick(pattern)}
      className="group relative bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 cursor-pointer flex flex-col space-y-3"
    >
      {/* Top Header: Title & Chevron */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-noesis-text leading-snug line-clamp-2">
          {pattern.title}
        </h3>
        <ChevronRight className="w-4 h-4 text-noesis-muted group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {/* Description Snippet */}
      {pattern.description && (
        <p className="text-xs text-noesis-muted line-clamp-2 leading-relaxed select-text">
          {pattern.description}
        </p>
      )}

      {/* Badges & Metrics Grid */}
      <div className="pt-2.5 border-t border-noesis-border flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Left side: Evidence & Topic Counts */}
        <div className="flex items-center gap-3 text-noesis-muted">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-noesis-muted" />
            <span className="text-noesis-text">{pattern.evidenceCount || (pattern.relatedNoteIds ? pattern.relatedNoteIds.length : 0)} Evidence</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Hash className="w-3.5 h-3.5 text-noesis-muted" />
            <span className="text-noesis-text">{pattern.relatedTopicCount || 0} Topik</span>
          </span>
        </div>

        {/* Strength Badge */}
        <div className={`px-2.5 py-0.5 rounded-full border text-[10px] flex items-center gap-1 shadow-xs ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}>
          <Activity className="w-3 h-3 opacity-80" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Footer Meta: Last detected & Occurrence Count */}
      <div className="flex items-center justify-between text-[10px] text-noesis-muted pt-1">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-noesis-muted" />
          <span>Terdeteksi: {formatTime(pattern.lastDetectedAt || pattern.createdAt)}</span>
        </span>
        <span className="flex items-center gap-1 bg-noesis-bg px-2 py-0.5 rounded-md border border-noesis-border text-noesis-muted">
          <Repeat className="w-3 h-3 text-noesis-muted" />
          <span className="font-medium">{pattern.occurrenceCount || 1}x Terdeteksi</span>
        </span>
      </div>
    </div>
  );
};
