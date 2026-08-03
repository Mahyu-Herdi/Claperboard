import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface DialogOptions {
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  severity?: 'info' | 'success' | 'warning' | 'error';
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  showAlert: (title: string, message: string, severity?: 'info' | 'success' | 'warning' | 'error') => Promise<void>;
  showConfirm: (title: string, message: string, severity?: 'info' | 'success' | 'warning' | 'error') => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const showAlert = (
    title: string, 
    message: string, 
    severity: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: 'alert',
        severity,
        resolve: () => {
          setDialog(null);
          resolve();
        }
      });
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    severity: 'info' | 'success' | 'warning' | 'error' = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: 'confirm',
        severity,
        resolve: (value: boolean) => {
          setDialog(null);
          resolve(value);
        }
      });
    });
  };

  const getIcon = (severity?: string, type?: string) => {
    if (type === 'confirm') {
      return <HelpCircle className="w-12 h-12 text-amber-500 animate-bounce" />;
    }
    switch (severity) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-emerald-500 animate-pulse" />;
      case 'error':
        return <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />;
      case 'warning':
        return <AlertCircle className="w-12 h-12 text-amber-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-12 h-12 text-blue-500 animate-pulse" />;
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in no-print">
          <div className="popup-card p-6 md:p-8 max-w-md w-full flex flex-col items-center text-center space-y-4 scale-100 hover:scale-[1.01] transition-transform">
            <div className="p-3 bg-white/40 rounded-full shadow-inner">
              {getIcon(dialog.severity, dialog.type)}
            </div>
            
            <div className="space-y-1 w-full">
              <h3 className="font-black text-xl uppercase tracking-tight text-black">
                {dialog.title}
              </h3>
              <p className="text-sm text-black/75 leading-relaxed whitespace-pre-line font-medium">
                {dialog.message}
              </p>
            </div>
            
            <div className="flex w-full gap-3 pt-2">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => dialog.resolve(false)}
                    className="clay-btn flex-1 py-3 text-xs font-black uppercase tracking-wider text-black/60 hover:text-black hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => dialog.resolve(true)}
                    className="clay-btn-dark bg-black text-white flex-1 py-3 text-xs font-black uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    Setuju
                  </button>
                </>
              ) : (
                <button
                  onClick={() => dialog.resolve(true)}
                  className="clay-btn-dark bg-black text-white w-full py-3 text-xs font-black uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
