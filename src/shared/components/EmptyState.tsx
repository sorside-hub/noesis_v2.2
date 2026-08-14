import React from 'react';
import { useTheme } from '../../core/theme/themeContext';

interface EmptyStateProps {
  onSelectPrompt?: (promptText: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = () => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-4 py-8 text-center select-none">
      {/* Logo Kotak */}
      <div className="flex flex-col items-center justify-center">
        {theme === 'dark' ? (
          <img
            src="/logo-dark-kotak.webp"
            alt="Logo"
            className="w-20 h-20 object-contain mb-3"
          />
        ) : (
          <img
            src="/logo-light-kotak.webp"
            alt="Logo"
            className="w-20 h-20 object-contain mb-3"
          />
        )}
        <p className="text-xs text-noesis-muted max-w-xs">
          Thinking with Vault
        </p>
      </div>
    </div>
  );
};

