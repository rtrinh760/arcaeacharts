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
  const [iframeKey, setIframeKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [timeInput, setTimeInput] = useState('0:00');
  const [isEditingTime, setIsEditingTime] = useState(false);

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
      // Prevent scrolling and mobile gestures
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Listen for YouTube player time updates
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://www.youtube.com') return;
        
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'video-progress') {
            setCurrentTime(data.info?.currentTime || 0);
          }
        } catch {
          // Ignore invalid JSON
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Prevent touch events and gestures only outside of buttons
      const preventTouch = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        // Allow touches on buttons and elements with data-allow-click
        if (target.closest('button') || target.closest('[data-allow-click]')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      };
      
      const preventGestures = (e: Event) => {
        const target = e.target as HTMLElement;
        // Allow gestures on buttons and elements with data-allow-click
        if (target.closest('button') || target.closest('[data-allow-click]')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      };
      
      const preventMouse = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Allow clicks on buttons and elements with data-allow-click
        if (target.closest('button') || target.closest('[data-allow-click]')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      };
      
      // Add event listeners
      document.addEventListener('touchstart', preventTouch, { passive: false });
      document.addEventListener('touchmove', preventTouch, { passive: false });
      document.addEventListener('touchend', preventTouch, { passive: false });
      document.addEventListener('touchcancel', preventTouch, { passive: false });
      document.addEventListener('gesturestart', preventGestures, { passive: false });
      document.addEventListener('gesturechange', preventGestures, { passive: false });
      document.addEventListener('gestureend', preventGestures, { passive: false });
      document.addEventListener('click', preventMouse, { passive: false });
      document.addEventListener('mousedown', preventMouse, { passive: false });
      document.addEventListener('mouseup', preventMouse, { passive: false });
      
      return () => {
        // Restore scroll and body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        
        // Remove event listeners
        window.removeEventListener('message', handleMessage);
        document.removeEventListener('touchstart', preventTouch);
        document.removeEventListener('touchmove', preventTouch);
        document.removeEventListener('touchend', preventTouch);
        document.removeEventListener('touchcancel', preventTouch);
        document.removeEventListener('gesturestart', preventGestures);
        document.removeEventListener('gesturechange', preventGestures);
        document.removeEventListener('gestureend', preventGestures);
        document.removeEventListener('click', preventMouse);
        document.removeEventListener('mousedown', preventMouse);
        document.removeEventListener('mouseup', preventMouse);
      };
    }
  }, [isOpen]);

  // Request progress updates from YouTube player
  useEffect(() => {
    if (!isOpen) return;
    
    const requestProgressUpdates = () => {
      if (iframeRef.current) {
        // Request listening for progress events
        iframeRef.current.contentWindow?.postMessage(
          '{"event":"listening","id":"progress"}',
          'https://www.youtube.com'
        );
      }
    };
    
    // Delay to ensure iframe is loaded
    const timer = setTimeout(requestProgressUpdates, 1000);
    
    return () => clearTimeout(timer);
  }, [isOpen, iframeKey]);

  if (!isOpen) return null;

  // Handle initial play on mobile
  const handleInitialPlay = () => {
    setHasUserInteracted(true);
    setIsPlaying(true);
    setShowPlayOverlay(false);
    setIframeKey(prev => prev + 1);
  };

  // Video control functions
  const handlePlayPause = () => {
    if (isMobile && !hasUserInteracted) {
      handleInitialPlay();
      return;
    }
    setHasUserInteracted(true);
    setIsPlaying(prev => !prev);
    
    // Try to communicate with YouTube player via postMessage
    if (iframeRef.current) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"${command}","args":""}`,
        'https://www.youtube.com'
      );
      
      // If unpausing and speed is not 1x, apply the current playback rate
      if (!isPlaying && playbackRate !== 1) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(
            `{"event":"command","func":"setPlaybackRate","args":[${playbackRate}]}`,
            'https://www.youtube.com'
          );
        }, 500); // Half second delay to ensure play command is processed first
      }
    }
  };

  const handleRewind = () => {
    // Scale seek time based on playback rate (10s at 1x speed)
    const seekTime = 10 * playbackRate;
    const newTime = Math.max(0, currentTime - seekTime);
    setCurrentTime(newTime);
    setHasUserInteracted(true);
    
    // Use postMessage to seek video
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        'https://www.youtube.com'
      );
      
      // Reapply playback speed after seeking if not 1x
      if (playbackRate !== 1) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(
            `{"event":"command","func":"setPlaybackRate","args":[${playbackRate}]}`,
            'https://www.youtube.com'
          );
        }, 500); // Half second delay to ensure seek command is processed first
      }
    }
  };

  const handleForward = () => {
    // Scale seek time based on playback rate (10s at 1x speed)
    const seekTime = 10 * playbackRate;
    const newTime = currentTime + seekTime;
    setCurrentTime(newTime);
    setHasUserInteracted(true);
    
    // Use postMessage to seek video
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        'https://www.youtube.com'
      );
      
      // Reapply playback speed after seeking if not 1x
      if (playbackRate !== 1) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(
            `{"event":"command","func":"setPlaybackRate","args":[${playbackRate}]}`,
            'https://www.youtube.com'
          );
        }, 500); // Half second delay to ensure seek command is processed first
      }
    }
  };

  const handleSpeedDecrease = () => {
    const newRate = Math.max(0.25, playbackRate - 0.25);
    setPlaybackRate(newRate);
    setHasUserInteracted(true);
    
    // Use postMessage to change playback rate
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"setPlaybackRate","args":[${newRate}]}`,
        'https://www.youtube.com'
      );
    }
  };

  const handleSpeedReset = () => {
    setPlaybackRate(1);
    setHasUserInteracted(true);
    
    // Use postMessage to reset playback rate to 1x
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"setPlaybackRate","args":[1]}',
        'https://www.youtube.com'
      );
    }
  };

  const handleSpeedIncrease = () => {
    const newRate = Math.min(2, playbackRate + 0.25);
    setPlaybackRate(newRate);
    setHasUserInteracted(true);
    
    // Use postMessage to change playback rate
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"setPlaybackRate","args":[${newRate}]}`,
        'https://www.youtube.com'
      );
    }
  };

  // Time input functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (input: string) => {
    const parts = input.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return 0;
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
  };

  const handleTimeInputSubmit = () => {
    const newTime = parseTimeInput(timeInput);
    setCurrentTime(newTime);
    setHasUserInteracted(true);
    setIsEditingTime(false);
    
    // Use postMessage to seek video
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":[${newTime}, true]}`,
        'https://www.youtube.com'
      );
      
      // Reapply playback speed after seeking if not 1x
      if (playbackRate !== 1) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(
            `{"event":"command","func":"setPlaybackRate","args":[${playbackRate}]}`,
            'https://www.youtube.com'
          );
        }, 500);
      }
    }
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTime(false);
      setTimeInput(formatTime(currentTime));
    }
  };

  const handleTimeDisplayClick = () => {
    setIsEditingTime(true);
    setTimeInput(formatTime(currentTime));
  };

  // Close function for Escape key
  const handleClose = () => {
    onClose();
  };

  // Build YouTube URL
  const getYouTubeUrl = () => {
    const baseUrl = `https://www.youtube.com/embed/${videoId}`;
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      controls: '1', // Always show YouTube controls
      enablejsapi: '1', // Enable JavaScript API for postMessage
      origin: window.location.origin,
      start: Math.floor(currentTime).toString()
    });

    if (isPlaying && (!isMobile || hasUserInteracted)) {
      params.set('autoplay', '1');
    }

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
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
        />
        
        {/* Transparent overlay to block all interactions with video only */}
        {!showPlayOverlay && (
          <div 
            className="absolute inset-0 bg-transparent z-10"
            style={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              pointerEvents: 'auto'
            }}
            onTouchStart={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            onTouchEnd={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.preventDefault()}
          />
        )}
        
        {/* Large play overlay for mobile */}
        {showPlayOverlay && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
            onClick={handleInitialPlay}
            data-allow-click="true"
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
      </div>

      {/* Close button - minimal */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleClose}
          variant="secondary"
          size="sm"
          className="bg-red-600/70 hover:bg-red-700/90 text-white border border-red-400/20"
        >
          ✕
        </Button>
      </div>

      {/* Rewind/Play/Forward buttons - top left */}
      {!showPlayOverlay && (
        <div className="absolute top-4 left-4 flex gap-2 z-50">
          <Button
            onClick={handleRewind}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
          >
            -{(10 * playbackRate).toFixed(1)}s
          </Button>
          
          <Button
            onClick={handlePlayPause}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20 px-4"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            onClick={handleForward}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
          >
            +{(10 * playbackRate).toFixed(1)}s
          </Button>
          
          {/* Time display/input next to forward button */}
          {isEditingTime ? (
            <input
              type="text"
              value={timeInput}
              onChange={handleTimeInputChange}
              onKeyDown={handleTimeInputKeyDown}
              onBlur={handleTimeInputSubmit}
              className="bg-black/70 text-white border border-white/20 rounded px-3 py-1 text-sm w-16 text-center"
              placeholder="0:00"
              autoFocus
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/70 hover:bg-black/90 text-white border border-white/20 cursor-pointer"
              onClick={handleTimeDisplayClick}
            >
              {formatTime(currentTime)}
            </Button>
          )}
        </div>
      )}

      {/* Speed controls - top right */}
      {!showPlayOverlay && (
        <div className="absolute top-4 right-24 flex gap-2 z-50">
          <Button
            onClick={handleSpeedDecrease}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
          >
            Slow
          </Button>
          
          <Button
            onClick={handleSpeedReset}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20 px-4"
          >
            {playbackRate.toFixed(2)}x
          </Button>
          
          <Button
            onClick={handleSpeedIncrease}
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
          >
            Fast
          </Button>
        </div>
      )}
    </div>
  );
}; 