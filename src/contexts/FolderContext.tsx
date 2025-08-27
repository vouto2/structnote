'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

interface FolderContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    console.log('FolderContext: triggerRefresh called');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <FolderContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </FolderContext.Provider>
  );
};

export const useFolder = () => {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error('useFolder must be used within a FolderProvider');
  }
  return context;
};
