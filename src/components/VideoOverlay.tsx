import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import ReactPlayer from "react-player";

interface VideoOverlayProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

export const VideoOverlay = ({
  videoId,
  isOpen,
  onClose,
}: VideoOverlayProps) => {
  const playerRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSlider, setShowSlider] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        );
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
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";

      // Prevent touch events and gestures only outside of buttons
      const preventTouch = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        // Allow touches on buttons and elements with data-allow-click
        if (target.closest("button") || target.closest("[data-allow-click]")) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      };

      const preventGestures = (e: Event) => {
        const target = e.target as HTMLElement;
        // Allow gestures on buttons and elements with data-allow-click
        if (target.closest("button") || target.closest("[data-allow-click]")) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      };

      const preventMouse = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Allow clicks on buttons and elements with data-allow-click
        if (target.closest("button") || target.closest("[data-allow-click]")) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      };

      // Add event listeners
      document.addEventListener("touchstart", preventTouch, { passive: false });
      document.addEventListener("touchmove", preventTouch, { passive: false });
      document.addEventListener("touchend", preventTouch, { passive: false });
      document.addEventListener("touchcancel", preventTouch, {
        passive: false,
      });
      document.addEventListener("gesturestart", preventGestures, {
        passive: false,
      });
      document.addEventListener("gesturechange", preventGestures, {
        passive: false,
      });
      document.addEventListener("gestureend", preventGestures, {
        passive: false,
      });
      document.addEventListener("click", preventMouse, { passive: false });
      document.addEventListener("mousedown", preventMouse, { passive: false });
      document.addEventListener("mouseup", preventMouse, { passive: false });

      return () => {
        // Restore scroll and body styles
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.height = "";

        // Remove event listeners
        document.removeEventListener("touchstart", preventTouch);
        document.removeEventListener("touchmove", preventTouch);
        document.removeEventListener("touchend", preventTouch);
        document.removeEventListener("touchcancel", preventTouch);
        document.removeEventListener("gesturestart", preventGestures);
        document.removeEventListener("gesturechange", preventGestures);
        document.removeEventListener("gestureend", preventGestures);
        document.removeEventListener("click", preventMouse);
        document.removeEventListener("mousedown", preventMouse);
        document.removeEventListener("mouseup", preventMouse);
      };
    }
  }, [isOpen]);

  // Video time and duration tracking using interval
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        if (typeof playerRef.current.currentTime === "number") {
          setCurrentTime(playerRef.current.currentTime);
        }
        if (typeof playerRef.current.duration === "number" && !isNaN(playerRef.current.duration)) {
          setDuration(playerRef.current.duration);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleRewind = () => {
    const seekTime = 10 * playbackRate;
    const newTime = Math.max(0, currentTime - seekTime);
    setCurrentTime(newTime);

    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
  };

  const handleForward = () => {
    const seekTime = 10 * playbackRate;
    const newTime = currentTime + seekTime;
    setCurrentTime(newTime);

    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
  };

  const handleSpeedDecrease25 = () => {
    const newRate = Math.max(0.25, playbackRate - 0.25);
    setPlaybackRate(newRate);
  };

  const handleSpeedDecrease05 = () => {
    const newRate = Math.max(0.25, playbackRate - 0.05);
    setPlaybackRate(newRate);
  };

  const handleSpeedIncrease05 = () => {
    const newRate = Math.min(2, playbackRate + 0.05);
    setPlaybackRate(newRate);
  };

  const handleSpeedIncrease25 = () => {
    const newRate = Math.min(2, playbackRate + 0.25);
    setPlaybackRate(newRate);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    setCurrentTime(0);
    setPlaybackRate(1);
    setIsPlaying(false);
    onClose();
  };

  const handleProgress = (
    state: ProgressState | React.SyntheticEvent<HTMLVideoElement>
  ) => {
    if ("playedSeconds" in state) {
      setCurrentTime(state.playedSeconds);
    }
  };



  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
  };

  const toggleSlider = () => {
    setShowSlider((prev) => !prev);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black ${
        isMobile ? "transform rotate-90 origin-center" : ""
      }`}
      style={
        isMobile
          ? {
              width: "100vh",
              height: "100vw",
              left: "calc((100vw - 100vh) / 2)",
              top: "calc((100vh - 100vw) / 2)",
            }
          : {}
      }
    >
      {/* Video player */}
      <div className="relative w-full h-full">
        <ReactPlayer
          ref={playerRef}
          src={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={isPlaying}
          playbackRate={playbackRate}
          controls={false}
          onProgress={handleProgress}
          style={{ pointerEvents: "none" }}
        />

        {/* Transparent overlay to block all interactions with video only */}
        <div
          className="absolute inset-0 bg-transparent z-10"
          style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            pointerEvents: "auto",
          }}
          onTouchStart={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
        />
      </div>

      {/* Close button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleClose}
          variant="secondary"
          size="sm"
          className={`bg-red-600/70 hover:bg-red-700/90 text-white border border-red-400/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          ✕
        </Button>
      </div>

      {/* Playback controls - top left */}
      <div
        className={`absolute top-4 left-4 flex z-50 ${
          isMobile ? "gap-1 items-center" : "gap-2"
        }`}
      >
        <Button
          onClick={handleRewind}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          -{(10 * playbackRate).toFixed(1)}s
        </Button>

        {/* Time display - read-only */}
        <Button
          variant="secondary"
          size="sm"
          className={`bg-black/70 text-white border border-white/20 pointer-events-none ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          {formatTime(currentTime)}
        </Button>

        <Button
          onClick={handleForward}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          +{(10 * playbackRate).toFixed(1)}s
        </Button>

        <Button
          onClick={handlePlayPause}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : "px-4"
          }`}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Button
          onClick={toggleSlider}
          variant="secondary"
          size="sm"
          className={`bg-blue-600/70 hover:bg-blue-700/90 text-white border border-blue-400/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          {showSlider ? "Untoggle Slider" : "Toggle Slider"}
        </Button>
      </div>

      {/* Speed controls - top right */}
      <div
        className={`absolute top-4 right-16 flex z-50 ${
          isMobile ? "gap-1 items-center" : "gap-2"
        }`}
      >
        <Button
          onClick={handleSpeedDecrease25}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          -0.25
        </Button>

        <Button
          onClick={handleSpeedDecrease05}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          -0.05
        </Button>

        {/* Speed display - non-interactive */}
        <Button
          variant="secondary"
          size="sm"
          className={`bg-black/70 text-white border border-white/20 pointer-events-none ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : "px-4"
          }`}
        >
          {playbackRate.toFixed(2)}x
        </Button>

        <Button
          onClick={handleSpeedIncrease05}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          +0.05
        </Button>

        <Button
          onClick={handleSpeedIncrease25}
          variant="secondary"
          size="sm"
          className={`bg-black/70 hover:bg-black/90 text-white border border-white/20 ${
            isMobile ? "text-xs px-2 py-1 min-h-0 h-6" : ""
          }`}
        >
          +0.25
        </Button>
      </div>

      {/* Time slider - bottom center */}
      {showSlider && (
        <div className="absolute bottom-6 left-8 right-8 z-50">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-mono bg-black/50 px-2 py-1 rounded">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 bg-black/30 p-2 rounded-lg backdrop-blur-sm">
              <Slider
                value={[currentTime]}
                onValueChange={handleSliderChange}
                min={0}
                max={duration || 100}
                step={1}
                aria-label="Video timeline"
                className="w-full"
              />
            </div>
            <span className="text-white text-sm font-mono bg-black/50 px-2 py-1 rounded">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
