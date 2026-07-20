import { useTourGuide } from "../context/TourGuideContext";
import { TourOverlay } from "./TourOverlay";
import { TourTooltip } from "./TourTooltip";

export const TourGuide: React.FC = () => {
  const { isActive, stepRect, stop } = useTourGuide();

  if (!isActive) return null;

  return (
    <>
      {stepRect && <TourOverlay rect={stepRect} onBackdropClick={stop} />}
      <TourTooltip />
    </>
  );
};
