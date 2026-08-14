import React, { useState, useRef, useEffect } from 'react';
import { NavTab } from '../types';
import {
  MessageSquare,
  Archive,
  BarChart2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'vault', label: 'Vault', icon: Archive },
  { id: 'insight', label: 'Insight', icon: BarChart2 },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectTab = (tabId: NavTab) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div
      ref={navRef}
      className={`fixed right-0 top-[70%] -translate-y-1/2 z-50 select-none flex items-center transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-[52px]'
      }`}
    >
      {/* Trigger Button - Standalone shape */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Tutup Navigasi' : 'Buka Navigasi'}
        className="flex items-center justify-center w-8 py-6 mr-[-1px] z-20 bg-noesis-surface border-l border-y border-noesis-border rounded-l-2xl shadow-lg text-noesis-muted hover:text-noesis-text cursor-pointer transition-colors duration-150 shrink-0 active:scale-95 touch-manipulation"
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5 text-noesis-text" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-noesis-muted" />
        )}
      </button>

      {/* Vertical Dock Container - Separate shape */}
      <div className="flex flex-col items-center gap-1.5 w-[52px] shrink-0 z-10 bg-noesis-surface border-l border-y border-noesis-border rounded-l-3xl shadow-xl py-3 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={item.label}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 cursor-pointer active:scale-90 ${
                isActive
                  ? 'bg-noesis-surface-hover text-noesis-text shadow-sm'
                  : 'text-noesis-muted hover:text-noesis-text hover:bg-noesis-surface-hover/60'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] transition-transform duration-150 ${
                  isActive ? 'scale-105 text-noesis-text' : 'text-noesis-muted'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};


