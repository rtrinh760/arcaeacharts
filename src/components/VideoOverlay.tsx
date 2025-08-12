import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface VideoOverlayProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoOverlay = ({ videoId, isOpen, onClose }: VideoOverlayProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      setIsMobile(isMobileDevice);
      setShowPlayOverlay(isMobileDevice);
      
      if (!isMobileDevice) {
        setIsPlaying(true);
      }
    };
    
    checkMobile();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Strong body lock for gesture prevention
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.touchAction = 'none';
      
      // Aggressive viewport control for iOS
      const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      const originalViewport = viewportMeta?.getAttribute('content') || '';
      
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
      
      // Prevent ALL gestures except on specific control areas
      const preventGestures = (e: TouchEvent) => {
        const target = e.target as Element;
        
        // Only allow touches on our specific control elements
        if (target?.closest('.video-controls') || target?.closest('.play-overlay')) {
          return;
        }
        
        // Block everything else
        e.preventDefault();
        e.stopPropagation();
      };
      
      const preventZoom = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      // More aggressive event prevention
      document.addEventListener('touchstart', preventGestures, { passive: false, capture: true });
      document.addEventListener('touchmove', preventGestures, { passive: false, capture: true });
      document.addEventListener('touchend', preventGestures, { passive: false, capture: true });
      document.addEventListener('gesturestart', preventZoom, { passive: false, capture: true });
      document.addEventListener('gesturechange', preventZoom, { passive: false, capture: true });
      document.addEventListener('gestureend', preventZoom, { passive: false, capture: true });
      
      return () => {
        // Restore everything
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.touchAction = '';
        
        if (viewportMeta && originalViewport) {
          viewportMeta.setAttribute('content', originalViewport);
        }
        
        // Remove all listeners
        document.removeEventListener('touchstart', preventGestures, { capture: true });
        document.removeEventListener('touchmove', preventGestures, { capture: true });
        document.removeEventListener('touchend', preventGestures, { capture: true });
        document.removeEventListener('gesturestart', preventZoom, { capture: true });
        document.removeEventListener('gesturechange', preventZoom, { capture: true });
        document.removeEventListener('gestureend', preventZoom, { capture: true });
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle initial play on mobile
  const handleInitialPlay = () => {
    console.log('Initial play clicked on mobile');
    setHasUserInteracted(true);
    setIsPlaying(true);
    setShowPlayOverlay(false);
    setIframeKey(prev => prev + 1);
  };

  // Video control functions
  const updateVideoTime = (newTime: number) => {
    const clampedTime = Math.max(0, newTime);
    setCurrentTime(clampedTime);
    setHasUserInteracted(true);
    setIframeKey(prev => prev + 1);
  };

  const handlePlayPause = () => {
    console.log('Play/Pause clicked - current state:', isPlaying, 'isMobile:', isMobile);
    
    if (isMobile && !hasUserInteracted) {
      handleInitialPlay();
      return;
    }
    
    setHasUserInteracted(true);
    setIsPlaying(prev => !prev);
    setIframeKey(prev => prev + 1);
  };

  const handleRewind = () => {
    console.log('Rewind to start');
    updateVideoTime(0);
  };

  const handleRewind10 = () => {
    console.log('Rewind 10 seconds from:', currentTime);
    updateVideoTime(currentTime - 10);
  };

  const handleForward10 = () => {
    console.log('Forward 10 seconds from:', currentTime);
    updateVideoTime(currentTime + 10);
  };

  const handleClose = () => {
    console.log('Close clicked');
    onClose();
  };

  // Open YouTube in app/new tab for mobile as fallback
  const handleOpenInYouTube = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(currentTime)}s`;
    window.open(youtubeUrl, '_blank');
  };

  // Build YouTube URL
  const getYouTubeUrl = () => {
    const baseUrl = `https://www.youtube.com/embed/${videoId}`;
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      controls: showPlayOverlay ? '0' : '1', // Hide controls during overlay
      start: Math.floor(currentTime).toString()
    });

    if (isPlaying && (!isMobile || hasUserInteracted)) {
      params.set('autoplay', '1');
    }

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}
    >
      {/* Video iframe */}
      <div className="relative w-full h-full">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={getYouTubeUrl()}
          title="Chart View Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          style={{
            pointerEvents: 'none', // Always block direct iframe interaction
            touchAction: 'none'
          }}
        />
        
        {/* Large play overlay for mobile */}
        {showPlayOverlay && (
          <div 
            className="play-overlay absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
            onClick={handleInitialPlay}
            style={{ 
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            <div className="text-center text-white">
              <div className="mb-4">
                <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <p className="text-lg font-medium">Tap to Play Video</p>
              <p className="text-sm opacity-75 mt-1">Chart Practice Mode</p>
            </div>
          </div>
        )}
        
        {/* Always show gesture blocking overlay */}
        <div 
          className="absolute inset-0 bg-transparent"
          style={{
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            pointerEvents: 'none' // Let clicks pass through to elements below
          }}
        />
      </div>
      
      {/* Video control buttons */}
      <div 
        className="video-controls absolute top-4 right-4 flex gap-2 z-50"
        style={{ 
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        {isMobile && (
          <Button
            onClick={handleOpenInYouTube}
            variant="secondary"
            size="sm"
            className="bg-blue-600/70 hover:bg-blue-700/90 text-white border border-blue-400/20"
            style={{ 
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            📱 Open in YouTube
          </Button>
        )}
        
        <Button
          onClick={handleClose}
          variant="secondary"
          size="sm"
          className="bg-red-600/70 hover:bg-red-700/90 text-white border border-red-400/20"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          ✕ Close
        </Button>
      </div>

      {/* Video control panel at bottom - hidden during initial play overlay */}
      {!showPlayOverlay && (
        <div 
          className="video-controls absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-50"
          style={{ 
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          <Button
            onClick={handleRewind}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
            style={{ 
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            ⏮️ Start
          </Button>
          
          <Button
            onClick={handleRewind10}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
            style={{ 
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            ⏪ -10s
          </Button>
          
          <Button
            onClick={handlePlayPause}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20 px-4"
            style={{ 
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </Button>
          
          <Button
            onClick={handleForward10}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
            style={{ 
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            ⏩ +10s
          </Button>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-md text-sm">
        <div className="flex items-center gap-2">
          <span>🎵</span>
          <span>Chart Practice Mode</span>
          {isMobile && <span className="text-xs opacity-75">(Mobile)</span>}
          <span className="text-xs opacity-75">(Gestures Blocked)</span>
        </div>
        {!showPlayOverlay && (
          <div className="text-xs opacity-75 mt-1">
            Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
    </div>
  );
}; 