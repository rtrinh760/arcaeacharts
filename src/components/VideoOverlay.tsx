import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VideoOverlayProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoOverlay = ({ videoId, isOpen, onClose }: VideoOverlayProps) => {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Lock the body scroll when overlay is open
      document.body.style.overflow = 'hidden';
      setIsLocked(true);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const handleLock = () => {
    setIsLocked(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video iframe */}
      <div className="relative w-full h-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title="Chart View Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
        
        {/* Invisible overlay to block video interaction when locked */}
        {isLocked && (
          <div 
            className="absolute inset-0 bg-transparent cursor-not-allowed"
            title="Video is locked - click unlock button to interact"
          />
        )}
      </div>
      
      {/* Control buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isLocked ? (
          // When locked: Show only unlock button
          <Button
            onClick={handleUnlock}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
          >
            🔒 Unlock to Interact
          </Button>
        ) : (
          // When unlocked: Show both lock and close buttons
          <>
            <Button
              onClick={handleLock}
              variant="secondary"
              size="sm"
              className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
            >
              🔒 Lock
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
              className="bg-red-600/70 hover:bg-red-700/90 text-white border border-red-400/20"
            >
              ✕ Close
            </Button>
          </>
        )}
      </div>

      {/* Instructions overlay (only when locked) */}
      {isLocked && (
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Video is locked - unlock to interact with controls</span>
          </div>
        </div>
      )}
    </div>
  );
}; 