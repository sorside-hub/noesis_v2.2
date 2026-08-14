import React from 'react';
import { Menu, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../../core/theme/themeContext';

interface HeaderProps {
  activeThreadTitle?: string;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onNewChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenSettings,
}) => {
  const { theme } = useTheme();
  
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 bg-noesis-bg/90 backdrop-blur-md border-b border-noesis-border select-none shrink-0">
      {/* Kiri: Icon Menu untuk Chat History Drawer */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenHistory}
          title="Riwayat Chat"
          className="p-2 rounded-xl text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface transition-colors active:scale-95 flex items-center gap-1.5"
        >
          <Menu className="w-5 h-5 text-noesis-text" />
        </button>
      </div>

      {/* Tengah: Logo Panjang */}
      <div className="flex items-center justify-center pointer-events-none">
        {theme === 'dark' ? (
          <img
            src="/logo-dark-panjang.webp"
            alt="Logo"
            className="h-7 w-auto object-contain"
          />
        ) : (
          <img
            src="/logo-light-panjang.webp"
            alt="Logo"
            className="h-7 w-auto object-contain"
          />
        )}
      </div>

      {/* Kanan: Icon Settings untuk Chat Settings Drawer */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          title="Chat Settings"
          className="p-2 rounded-xl text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface transition-colors active:scale-95"
        >
          <SlidersHorizontal className="w-5 h-5 text-noesis-text" />
        </button>
      </div>
    </header>
  );
};
