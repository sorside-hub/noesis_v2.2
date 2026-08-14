import React from 'react';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  return (
    <div className="w-full h-screen bg-noesis-bg flex items-center justify-center sm:py-4">
      <div className="w-full h-full max-w-md bg-noesis-bg sm:rounded-3xl sm:border sm:border-noesis-border shadow-2xl overflow-hidden flex flex-col relative">
        {children}
      </div>
    </div>
  );
};
