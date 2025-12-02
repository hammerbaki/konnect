import React, { createContext, useContext, useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface MobileAction {
  icon?: LucideIcon;
  label?: string;
  onClick: () => void;
}

interface MobileActionContextType {
  action: MobileAction | null;
  setAction: (action: MobileAction | null) => void;
}

const MobileActionContext = createContext<MobileActionContextType | undefined>(undefined);

export function MobileActionProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<MobileAction | null>(null);

  return (
    <MobileActionContext.Provider value={{ action, setAction }}>
      {children}
    </MobileActionContext.Provider>
  );
}

export function useMobileAction() {
  const context = useContext(MobileActionContext);
  if (context === undefined) {
    throw new Error('useMobileAction must be used within a MobileActionProvider');
  }
  return context;
}
