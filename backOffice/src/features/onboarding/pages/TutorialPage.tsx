import { useEffect } from "react";
import { useTourGuide } from "../context/TourGuideContext";

const TutorialPage: React.FC = () => {
  const { start } = useTourGuide();

  useEffect(() => {
    const timer = setTimeout(() => start(), 400);
    return () => clearTimeout(timer);
  }, [start]);

  return null;
};

export default TutorialPage;
