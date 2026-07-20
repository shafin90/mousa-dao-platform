import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTourGuide } from "../context/TourGuideContext";

interface TourRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const TOOLTIP_WIDTH = 320;
const GAP = 14;
const ESTIMATED_HEIGHT = 280;
const MARGIN = 12;

interface Pos {
  left: number;
  top: number;
}

function tooltipPosition(rect: TourRect | null): Pos {
  if (!rect) {
    return {
      left: Math.max(MARGIN, (window.innerWidth - TOOLTIP_WIDTH) / 2),
      top: Math.max(MARGIN, (window.innerHeight - ESTIMATED_HEIGHT) / 2),
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const preferBelow = rect.top + rect.height + GAP + ESTIMATED_HEIGHT < vh;
  const preferAbove = rect.top - GAP - ESTIMATED_HEIGHT > 0;

  let top: number;
  if (preferBelow) {
    top = rect.top + rect.height + GAP;
  } else if (preferAbove) {
    top = rect.top - GAP - ESTIMATED_HEIGHT;
  } else {
    top = Math.max(MARGIN, (vh - ESTIMATED_HEIGHT) / 2);
  }

  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  if (left < MARGIN) left = MARGIN;
  if (left + TOOLTIP_WIDTH > vw - MARGIN) left = vw - MARGIN - TOOLTIP_WIDTH;

  return { left, top };
}

export const TourTooltip: React.FC = () => {
  const { t } = useTranslation();
  const { isActive, currentStep, steps, stepRect, totalSteps, next, prev, stop } =
    useTourGuide();

  const step = steps[currentStep];

  if (!isActive || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = `${currentStep + 1} / ${totalSteps}`;
  const pos = tooltipPosition(stepRect);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed z-50"
        style={{ left: pos.left, top: pos.top }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[320px]">
          <Card className="shadow-xl border-border/60 overflow-hidden">
            <div className="p-5 space-y-4 break-words">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {progress}
                  </div>
                  <h3 className="text-base font-bold leading-snug">
                    {t(step.titleKey)}
                  </h3>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); stop(); }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0 transition-colors"
                  aria-label={t("common.close")}
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(step.contentKey)}
              </p>

              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); stop(); }}>
                  {t("tour.skip")}
                </Button>
                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); prev(); }}>
                      {t("tour.back")}
                    </Button>
                  )}
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); next(); }}>
                    {isLast ? t("tour.done") : t("tour.next")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
