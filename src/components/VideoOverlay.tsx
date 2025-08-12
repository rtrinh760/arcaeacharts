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
      // Basic body scroll lock
      document.body.style.overflow = 'hidden';
      
      // Set initial locked state
      setIsLocked(true);
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Simple button handlers with no complex event handling
  const handleUnlock = () => {
    console.log('Unlock clicked - current state:', isLocked);
    setIsLocked(false);
  };

  const handleLock = () => {
    console.log('Lock clicked - current state:', isLocked);
    setIsLocked(true);
  };

  const handleClose = () => {
    console.log('Close clicked');
    onClose();
  };

  console.log('Rendering VideoOverlay - isLocked:', isLocked);

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
          style={{
            pointerEvents: isLocked ? 'none' : 'auto'
          }}
        />
        
        {/* Overlay when locked */}
        {isLocked && (
          <div 
            className="absolute inset-0 bg-transparent cursor-not-allowed"
            title="Video is locked"
          />
        )}
      </div>
      
      {/* Simple control buttons */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <Button
          onClick={isLocked ? handleUnlock : handleLock}
          variant="secondary"
          size="sm"
          className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
        >
          {isLocked ? '🔒 Unlock' : '🔓 Lock'}
        </Button>
        
        <Button
          onClick={handleClose}
          variant="secondary"
          size="sm"
          className="bg-red-600/70 hover:bg-red-700/90 text-white border border-red-400/20"
        >
          ✕ Close
        </Button>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-md text-sm">
        <div className="flex items-center gap-2">
          <span>{isLocked ? '🔒' : '🔓'}</span>
          <span>Video is {isLocked ? 'locked' : 'unlocked'}</span>
        </div>
      </div>
    </div>
  );
}; 