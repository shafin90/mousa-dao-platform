import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";

interface ErrorContextType {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const useErrorModal = (): ErrorContextType => {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useErrorModal must be used within ErrorProvider");
  return ctx;
};

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleClose = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setError(typeof detail === "string" ? detail : "An unexpected error occurred");
    };
    window.addEventListener("app:error", handler);
    return () => window.removeEventListener("app:error", handler);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-md rounded-xl border border-destructive/20 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 p-1 rounded-md hover:bg-secondary hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle size={28} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold">Error</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <button
                  onClick={handleClose}
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ErrorContext.Provider>
  );
};
