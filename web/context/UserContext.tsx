import React, { createContext, useState, ReactNode, useEffect } from 'react';

type User = {
  name?: string;
  interests?: string[];
};

type UserContextValue = {
  user: User;
  setUser: (u: Partial<User>) => void;
  clearUser: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('wai_user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wai_user', JSON.stringify(user || {}));
      } catch {
        // ignore
      }
    }
  }, [user]);

  const setUser = (u: Partial<User>) => setUserState(prev => ({ ...prev, ...u }));
  const clearUser = () => {
    setUserState({});
    if (typeof window !== 'undefined') localStorage.removeItem('wai_user');
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};
