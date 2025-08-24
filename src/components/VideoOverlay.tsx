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
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [timeInput, setTimeInput] = useState('0:00');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [speedInput, setSpeedInput] = useState('1.00');
  const [isEditingSpeed, setIsEditingSpeed] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      setIsMobile(isMobileDevice);
      
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

  // Speed input functions
  const parseSpeedInput = (input: string) => {
    const speed = parseFloat(input);
    if (isNaN(speed)) return 1;
    return Math.max(0.25, Math.min(2, speed)); // Clamp between 0.25 and 2
  };

  const handleSpeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeedInput(e.target.value);
  };

  const handleSpeedInputSubmit = () => {
    const newRate = parseSpeedInput(speedInput);
    setPlaybackRate(newRate);
    setHasUserInteracted(true);
    setIsEditingSpeed(false);
    
    // Use postMessage to change playback rate
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"setPlaybackRate","args":[${newRate}]}`,
        'https://www.youtube.com'
      );
    }
  };

  const handleSpeedInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSpeedInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingSpeed(false);
      setSpeedInput(playbackRate.toFixed(2));
    }
  };

  const handleSpeedDisplayClick = () => {
    setIsEditingSpeed(true);
    setSpeedInput(playbackRate.toFixed(2));
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
    // Reset time and playback speed when closing
    setCurrentTime(0);
    setPlaybackRate(1);
    setIsEditingTime(false);
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
    <div className={`fixed inset-0 z-50 bg-black ${isMobile ? 'transform rotate-90 origin-center' : ''}`} style={isMobile ? { width: '100vh', height: '100vw', left: 'calc((100vw - 100vh) / 2)', top: 'calc((100vh - 100vw) / 2)' } : {}}>
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
      </div>

      {/* Close button - minimal */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleClose}
          variant="secondary"
          size="sm"
          className={`bg-red-600/70 hover:bg-red-700/90 text-white border border-red-400/20 ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : ''}`}
        >
          ✕
        </Button>
      </div>

      {/* Rewind/Play/Forward buttons - top left */}
      {(
        <div className={`absolute top-4 left-4 flex z-50 ${isMobile ? 'gap-1 items-center' : 'gap-2'}`}>
          <Button
            onClick={handleRewind}
            variant="secondary"
            size="sm"
            className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : ''}`}
          >
            -{(10 * playbackRate).toFixed(1)}s
          </Button>
          
          {/* Time display/input */}
          {isEditingTime ? (
            <input
              type="text"
              value={timeInput}
              onChange={handleTimeInputChange}
              onKeyDown={handleTimeInputKeyDown}
              onBlur={handleTimeInputSubmit}
              className={`bg-black/70 text-white border border-white/20 rounded text-center ${isMobile ? 'px-2 py-1 text-xs w-12 h-6' : 'px-3 py-1 text-sm w-16'}`}
              placeholder="0:00"
              autoFocus
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 cursor-pointer ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : ''}`}
              onClick={handleTimeDisplayClick}
            >
              {formatTime(currentTime)}
            </Button>
          )}
          
          <Button
            onClick={handleForward}
            variant="secondary"
            size="sm"
            className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : ''}`}
          >
            +{(10 * playbackRate).toFixed(1)}s
          </Button>
          
          <Button
            onClick={handlePlayPause}
            variant="secondary"
            size="sm"
            className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : 'px-4'}`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      )}

      {/* Speed controls - top right */}
      {(
        <div className={`absolute top-4 right-16 flex z-50 ${isMobile ? 'gap-1 items-center' : 'gap-2'}`}>
          <Button
            onClick={handleSpeedDecrease}
            variant="secondary"
            size="sm"
            className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : ''}`}
          >
            -0.25
          </Button>
          
          {/* Speed display/input */}
          {isEditingSpeed ? (
            <input
              type="text"
              value={speedInput}
              onChange={handleSpeedInputChange}
              onKeyDown={handleSpeedInputKeyDown}
              onBlur={handleSpeedInputSubmit}
              className={`bg-black/70 text-white border border-white/20 rounded text-center ${isMobile ? 'px-2 py-1 text-xs w-12 h-6' : 'px-3 py-1 text-sm w-16'}`}
              placeholder="1.00"
              autoFocus
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 cursor-pointer ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : 'px-4'}`}
              onClick={handleSpeedDisplayClick}
            >
              {playbackRate.toFixed(2)}x
            </Button>
          )}
          
          <Button
            onClick={handleSpeedIncrease}
            variant="secondary"
            size="sm"
            className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${isMobile ? 'text-xs px-2 py-1 min-h-0 h-6' : ''}`}
          >
            +0.25
          </Button>
        </div>
      )}
    </div>
  );
}; 