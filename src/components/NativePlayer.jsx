import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import '../index.css';

function NativePlayer({ src, title, onClose, onNext, mediaType, season, episode }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  let hideTimer = null;

  const playerRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(err => console.error("Auto-play blocked:", err));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.oncanplay = () => {
        setIsLoading(false);
        video.play();
      };
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = (e.target.value / 100) * duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (seconds) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => setShowControls(false), 3500);
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    return `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      ref={playerRef}
      className="nf-native-player" 
      onMouseMove={handleMouseMove} 
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        className="nf-video-core"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        autoPlay
      />

      {/* --- Cinematic Loader (Netflix Style) --- */}
      {isLoading && (
        <div className="nf-player-loader">
          <div className="nf-netflix-pulse" />
        </div>
      )}

      {/* --- Floating Navigation (Netflix Style) --- */}
      <div className={`nf-player-back-wrap ${showControls ? "visible" : ""}`}>
        <button className="nf-player-back" onClick={onClose} title="Back to browsing">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
      </div>

      {/* Top Banner (Info only) */}
      <div className={`nf-player-overlay top ${showControls ? 'visible' : ''}`}>
        <div className="nf-player-info">
          <span className="nf-player-title">{title}</span>
          {mediaType === 'tv' && (
            <span className="nf-player-episode">S{season} E{episode}</span>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={`nf-player-overlay bottom native ${showControls ? 'visible' : ''}`}>
        
        {/* Progress Bar */}
        <div className="nf-progress-container">
          <input
            type="range"
            className="nf-seek-bar"
            min="0"
            max="100"
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSeek}
          />
          <div className="nf-time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="nf-player-controls">
          <div className="nf-player-controls-left">
            <button className="nf-control-btn" onClick={togglePlay}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button className="nf-control-btn" onClick={() => skip(-10)}>
              <svg viewBox="0 0 24 24" fill="white"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
            </button>
            <button className="nf-control-btn" onClick={() => skip(10)}>
              <svg viewBox="0 0 24 24" fill="white"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
            </button>
            <div className="nf-volume-group">
                <svg viewBox="0 0 24 24" fill="white" width="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={volume} 
                  onChange={(e) => {
                    const v = e.target.value;
                    setVolume(v);
                    videoRef.current.volume = v;
                  }}
                  className="nf-volume-slider"
                />
            </div>
          </div>

          <div className="nf-player-controls-right">
             {mediaType === 'tv' && onNext && (
              <button className="nf-player-next native" onClick={onNext}>
                <svg viewBox="0 0 24 24" fill="white"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                <span>Next Episode</span>
              </button>
            )}
            <button className="nf-control-btn" onClick={toggleFullScreen}>
              {isFullScreen ? (
                <svg viewBox="0 0 24 24" fill="white"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NativePlayer;
