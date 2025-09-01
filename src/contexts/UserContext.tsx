'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserContextType {
  displayName: string | null;
  updateDisplayName: (newName: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      setDisplayName(profileData?.display_name || user.email || null);
    } else {
      setDisplayName(null);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const updateDisplayName = (newName: string) => {
    setDisplayName(newName);
  };

  return (
    <UserContext.Provider value={{ displayName, updateDisplayName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
