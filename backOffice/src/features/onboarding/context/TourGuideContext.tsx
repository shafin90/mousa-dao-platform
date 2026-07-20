import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { tourSteps, type TourStep } from "../steps/tourSteps";

interface TourRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TourGuideState {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  stepRect: TourRect | null;
  totalSteps: number;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
}

const TourGuideContext = createContext<TourGuideState | null>(null);

const STORAGE_KEY = "tour_completed";

function hasTourCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markTourCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {}
}

function getTargetRect(selector?: string): TourRect | null {
  if (!selector) return null;
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  } catch {
    return null;
  }
}

const PADDING = 12;

export function paddedRect(rect: TourRect | null): TourRect | null {
  if (!rect) return null;
  return {
    left: rect.left - PADDING,
    top: rect.top - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };
}

export const TourGuideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepRect, setStepRect] = useState<TourRect | null>(null);
  const rafRef = useRef<number>(0);
  const navigate = useNavigate();

  const updateRect = useCallback((selector?: string, retries = 15) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!selector) {
        setStepRect(null);
        return;
      }
      const el = document.querySelector(selector);
      if (!el && retries > 0) {
        setTimeout(() => updateRect(selector, retries - 1), 300);
        return;
      }
      setStepRect(paddedRect(el ? el.getBoundingClientRect() : null));
    });
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setStepRect(null);
    markTourCompleted();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const step = tourSteps[index];
      if (!step) return;
      if (step.beforeStep) {
        step.beforeStep();
      }

      const needsNav = step.page && window.location.pathname !== step.page;

      setCurrentStep(index);

      if (needsNav && step.page) {
        setStepRect(null);
        navigate(step.page);
        setTimeout(() => updateRect(step.target), 1200);
      } else {
        updateRect(step.target);
      }

      if (step.target && !needsNav) {
        try {
          const el = document.querySelector(step.target);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
      }
    },
    [navigate, updateRect]
  );

  const next = useCallback(() => {
    const nextIndex = currentStep + 1;
    if (nextIndex >= tourSteps.length) {
      stop();
      return;
    }
    goTo(nextIndex);
  }, [currentStep, goTo, stop]);

  const prev = useCallback(() => {
    const prevIndex = currentStep - 1;
    if (prevIndex < 0) return;
    goTo(prevIndex);
  }, [currentStep, goTo]);

  useEffect(() => {
    if (!isActive) return;
    goTo(currentStep);

    const handleResize = () => {
      const step = tourSteps[currentStep];
      if (step) updateRect(step.target);
    };
    const handleScroll = () => {
      const step = tourSteps[currentStep];
      if (step) updateRect(step.target);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentStep, goTo, updateRect]);

  const value = useMemo(
    () => ({
      isActive,
      currentStep,
      steps: tourSteps,
      stepRect,
      totalSteps: tourSteps.length,
      start,
      stop,
      next,
      prev,
    }),
    [isActive, currentStep, stepRect, start, stop, next, prev]
  );

  return <TourGuideContext.Provider value={value}>{children}</TourGuideContext.Provider>;
};

export function useTourGuide() {
  const ctx = useContext(TourGuideContext);
  if (!ctx) throw new Error("useTourGuide must be used within TourGuideProvider");
  return ctx;
}

export { hasTourCompleted, markTourCompleted };
