interface TourRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TourOverlayProps {
  rect: TourRect;
  onBackdropClick: () => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({ rect, onBackdropClick }) => {
  return (
    <div className="fixed inset-0 z-40 overflow-hidden" onClick={onBackdropClick}>
      <div
        className="absolute bg-black/55"
        style={{ top: 0, left: 0, right: 0, height: rect.top }}
      />
      <div
        className="absolute bg-black/55"
        style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }}
      />
      <div
        className="absolute bg-black/55"
        style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }}
      />
      <div
        className="absolute bg-black/55"
        style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }}
      />
    </div>
  );
};
