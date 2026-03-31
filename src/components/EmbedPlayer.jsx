import React, { useState, useEffect, useRef } from 'react';
import '../index.css';

/**
 * VidKing Player – clean iframe embed with no ads / redirects.
 * Docs: https://www.vidking.net
 *
 * URL format:
 *   Movie : https://www.vidking.net/embed/movie/{tmdbId}?color=e50914&autoPlay=true
 *   TV    : https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true
 */

const VIDKING_COLOR = 'e50914'; // Netflix red

function buildVidKingUrl(tmdbId, mediaType, season, episode) {
  const base = 'https://www.vidking.net/embed';
  const params = new URLSearchParams({
    color: VIDKING_COLOR,
    autoPlay: 'true',
  });

  if (mediaType === 'tv') {
    params.set('nextEpisode', 'true');
    params.set('episodeSelector', 'true');
    return `${base}/tv/${tmdbId}/${season}/${episode}?${params.toString()}`;
  }

  return `${base}/movie/${tmdbId}?${params.toString()}`;
}

function EmbedPlayer({ tmdbId, mediaType, title, season = 1, episode = 1, onClose, onNext }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);

  const iframeUrl = buildVidKingUrl(tmdbId, mediaType, season, episode);

  // Reset loading state whenever the content changes
  useEffect(() => {
    setIsLoading(true);
  }, [tmdbId, season, episode]);

  // Listen for progress events from VidKing (postMessage API)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg?.type === 'PLAYER_EVENT') {
          const { event: evtName, currentTime, duration } = msg.data || {};
          // Auto-advance to next episode when current one ends
          if (evtName === 'ended' && mediaType === 'tv' && onNext) {
            onNext();
          }
          // Persist progress to localStorage for resume-later
          if (currentTime && duration) {
            const key = `vk_progress_${mediaType}_${tmdbId}_${season}_${episode}`;
            localStorage.setItem(key, JSON.stringify({ currentTime, duration, ts: Date.now() }));
          }
        }
      } catch (_) {
        // Non-JSON messages can be safely ignored
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, mediaType, season, episode, onNext]);

  // Auto-hide top bar after 3.5 s of no movement
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div
      className="netflix-player"
      style={{ background: '#000', cursor: showControls ? 'default' : 'none' }}
    >
      {/* ── Loading spinner – shown until iframe fires onLoad ── */}
      {isLoading && (
        <div className="nf-player-loader">
          <div className="nf-spinner" />
          <div className="nf-loader-text">
            <p>Loading VidKing Player…</p>
            <span>Establishing secure connection</span>
          </div>
        </div>
      )}

      {/* ── VidKing iframe ── */}
      <iframe
        key={iframeUrl}           /* force remount on URL change */
        src={iframeUrl}
        className="nf-embed-frame"
        onLoad={() => setIsLoading(false)}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        title={title}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
      />

      {/* ── Top control bar (back button) ── */}
      <div className={`nf-player-overlay top ${showControls ? 'visible' : ''}`}>
        <button className="nf-player-back" onClick={onClose} title="Back to browsing">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default EmbedPlayer;
