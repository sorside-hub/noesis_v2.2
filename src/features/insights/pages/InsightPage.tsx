import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
  Compass,
  Brain,
  Layers,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';
import { ThinkingPatternPage } from './ThinkingPatternPage';
import { ThemesPage } from './ThemesPage';
import { ConnectionsPage } from './ConnectionsPage';
import { ConnectionDetailPage } from './ConnectionDetailPage';
import { TimelinePage } from './TimelinePage';
import { ReflectionPage } from './ReflectionPage';
import { getNotes } from '../../vault/services/noteService';
import { useNavigation } from '../../../core/navigation';
import { VaultHeader } from '../../vault/components/VaultHeader';
import { getSavedThinkingPatterns } from '../services/thinkingPatternService';
import { themeService } from '../services/themeService';
import { connectionService } from '../services/connectionService';
import { ThinkingPattern } from '../types/thinkingPattern';
import { Theme } from '../types/theme';
import { Connection } from '../types/connection';
import { reflectionService } from '../services/reflectionService';
import { Reflection } from '../types/reflection';

let savedInsightPageScrollTop = 0;

export const InsightPage: React.FC = () => {
  const { currentLocation, navigate, goBack } = useNavigation();
  const insightSubView = currentLocation.insightViewState || 'home';

  const [noteCount, setNoteCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [patterns, setPatterns] = useState<ThinkingPattern[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (insightSubView === 'home' && containerRef.current) {
      containerRef.current.scrollTop = savedInsightPageScrollTop;
      const timer = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = savedInsightPageScrollTop;
        }
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [insightSubView]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    savedInsightPageScrollTop = e.currentTarget.scrollTop;
  };

  const fetchNoteCount = async () => {
    try {
      const notes = await getNotes();
      setNoteCount(notes ? notes.length : 0);
    } catch (err) {
      console.error('Gagal mengambil data catatan untuk Insight:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const [savedPatterns, savedThemes, savedConnections, savedReflections] = await Promise.all([
        getSavedThinkingPatterns().catch(() => []),
        themeService.getSavedThemes().catch(() => []),
        connectionService.getSavedConnections().catch(() => []),
        reflectionService.getSavedReflections().catch(() => []),
      ]);
      setPatterns(savedPatterns || []);
      setThemes(savedThemes || []);
      setConnections(savedConnections || []);
      setReflections(savedReflections || []);
    } catch (err) {
      console.error('Gagal mengambil data ringkasan Insight:', err);
    }
  };

  useEffect(() => {
    fetchNoteCount();
    fetchSummaryData();
  }, []);

  // Calculations for summary cards
  const topPattern = patterns.length > 0
    ? [...patterns].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
    : null;

  const topTheme = themes.length > 0
    ? [...themes].sort((a, b) => b.strength - a.strength)[0]
    : null;

  const avgConnectionStrength = connections.length > 0
    ? Math.round((connections.reduce((acc, c) => acc + c.strength, 0) / connections.length) * 100)
    : 0;

  const themeBridgeCount = connections.filter((c) => c.connectionType === 'theme_bridge').length;
  const themeEvidenceCount = connections.filter((c) => c.connectionType === 'theme_evidence').length;

  const latestReflection = reflections.length > 0
    ? [...reflections].sort((a, b) => b.createdAt - a.createdAt)[0]
    : null;

  // Render dedicated full pages when selected
  if (insightSubView === 'pattern' || insightSubView === 'patternDetail') {
    return <ThinkingPatternPage onBack={goBack} />;
  }

  if (insightSubView === 'themes') {
    return <ThemesPage onBack={goBack} />;
  }

  if (insightSubView === 'connections') {
    return (
      <ConnectionsPage
        onBack={goBack}
        onSelectConnection={(id) =>
          navigate({
            tab: 'insight',
            insightViewState: 'connectionDetail',
            connectionId: id,
          })
        }
      />
    );
  }

  if (insightSubView === 'connectionDetail') {
    return (
      <ConnectionDetailPage
        connectionId={currentLocation.connectionId}
        onBack={goBack}
      />
    );
  }

  if (insightSubView === 'timeline') {
    return <TimelinePage onBack={goBack} />;
  }

  if (insightSubView === 'reflection') {
    return <ReflectionPage onBack={goBack} />;
  }

  // Insight Home: Category Selection Page & Overview Dashboard
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Self-contained Header with only Back button */}
      <VaultHeader onBack={() => navigate({ tab: 'chat' })} />

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5 bg-noesis-bg text-noesis-text pb-12 animate-in fade-in duration-200"
      >
        {/* Top Banner Header */}
        <div className="bg-noesis-surface border border-noesis-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text shadow-xs">
              <Compass className="w-5 h-5 text-noesis-text" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-noesis-text tracking-tight select-text">Insight</h1>
              <p className="text-xs text-noesis-muted">Ruang Penjelajahan Makna & Pola Pengetahuan</p>
            </div>
          </div>

          {/* Core Principle Display */}
          <div className="p-3 bg-noesis-bg border border-noesis-border rounded-xl text-xs space-y-1">
            <p className="font-semibold text-noesis-text flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-noesis-text shadow-xs" />
              Prinsip Utama Noesis:
            </p>
            <p className="text-[11px] text-noesis-muted italic leading-relaxed pl-3">
              &quot;Vault menyimpan pengetahuan. Insight membantu menemukan makna dari pengetahuan tersebut.&quot;
            </p>
          </div>

          {/* Vault Note Counter Context */}
          <div className="flex items-center justify-end text-xs text-noesis-muted pt-0.5">
            <span className="font-medium text-noesis-muted">
              {loading ? 'Memuat Vault...' : <><strong className="text-noesis-text font-semibold">{noteCount}</strong> Catatan Terhubung</>}
            </span>
          </div>
        </div>

        {/* Insight Overview Summary Modules */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-noesis-muted uppercase tracking-wider px-1">
            Eksplorasi Insight
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {/* 1. Thinking Pattern Card */}
            <button
              type="button"
              onClick={() => navigate({ tab: 'insight', insightViewState: 'pattern' })}
              className="w-full bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text shrink-0 transition-all shadow-xs">
                  <Brain className="w-5 h-5 text-noesis-text" />
                </div>
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-noesis-text transition-colors">
                    Thinking Pattern
                  </h3>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-noesis-accent/10 text-noesis-accent border border-noesis-accent/20 shrink-0">
                    Pola Pemikiran
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-noesis-muted group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* 2. Themes Card */}
            <button
              type="button"
              onClick={() => navigate({ tab: 'insight', insightViewState: 'themes' })}
              className="w-full bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text shrink-0 transition-all shadow-xs">
                  <Layers className="w-5 h-5 text-noesis-text" />
                </div>
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-noesis-text transition-colors">
                    Themes
                  </h3>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-noesis-accent/10 text-noesis-accent border border-noesis-accent/20 shrink-0">
                    Klaster Topik
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-noesis-muted group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* 3. Connections Card */}
            <button
              type="button"
              onClick={() => navigate({ tab: 'insight', insightViewState: 'connections' })}
              className="w-full bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text shrink-0 transition-all shadow-xs">
                  <ArrowRightLeft className="w-5 h-5 text-noesis-text" />
                </div>
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-noesis-text transition-colors">
                    Connections
                  </h3>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-noesis-accent/10 text-noesis-accent border border-noesis-accent/20 shrink-0">
                    Hubungan Ide
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-noesis-muted group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* 4. Reflection Card */}
            <button
              type="button"
              onClick={() => navigate({ tab: 'insight', insightViewState: 'reflection' })}
              className="w-full bg-noesis-surface hover:bg-noesis-surface-hover border border-noesis-border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-noesis-surface-hover border border-noesis-border flex items-center justify-center text-noesis-text shrink-0 transition-all shadow-xs">
                  <Compass className="w-5 h-5 text-noesis-text" />
                </div>
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-noesis-text transition-colors">
                    Reflection
                  </h3>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-noesis-accent/10 text-noesis-accent border border-noesis-accent/20 shrink-0">
                    Sintesis Refleksi
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-noesis-muted group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

