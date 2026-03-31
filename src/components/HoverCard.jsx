import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import api, { fetchLogo } from '../services/api';
import '../index.css';

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

function HoverCard({ movie, anchorRef, onClose, onSelect, onPlay, isInList, onToggleList, onRemoveContinue }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [genres, setGenres] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const cardRef = useRef(null);
  const isMuted = localStorage.getItem("netflix_muted") !== "false";
  const trailerTimer = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    api.get(`/${mediaType}/${movie.id}/videos`).then(res => {
      const vList = res.data.results || [];
      const trailer = vList.find(v => v.type === "Trailer" && v.site === "YouTube") || vList[0];
      if (trailer?.key) setTrailerKey(trailer.key);
    }).catch(() => {});

    api.get(`/${mediaType}/${movie.id}`).then(res => {
      setGenres((res.data.genres || []).slice(0, 3).map(g => g.name));
    }).catch(() => {});

    fetchLogo(mediaType, movie.id).then(setLogoUrl);

    trailerTimer.current = setTimeout(() => setShowTrailer(true), 1000);
    return () => clearTimeout(trailerTimer.current);
  }, [movie]);

  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const cardW = 340;
    let left = rect.left + rect.width / 2 - cardW / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - cardW - 10));
    // Use fixed positioning relative to viewport to avoid scroll/container bugs
    const top = rect.top - 40; 
    setPos({ top, left });
  }, [anchorRef]);

  const title = movie.title || movie.name || '';
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const matchPct = movie.vote_average ? Math.round(movie.vote_average * 10) : null;

  return createPortal(
    <div
      ref={cardRef}
      className="hover-card"
      style={{ top: pos.top, left: pos.left, position: 'fixed' }}
      onMouseLeave={onClose}
    >
      <div className="hover-card-media" onClick={() => onSelect(movie)}>
        {showTrailer && trailerKey ? (
          <iframe
            className="hover-card-trailer"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&disablekb=1&fs=0&cc_load_policy=0&playsinline=1`}
            allow="autoplay"
            title="Trailer"
            frameBorder="0"
            tabIndex="-1"
          />
        ) : (
          <>
            <img
              src={`${IMG_BASE}${movie.backdrop_path || movie.poster_path}`}
              alt={title}
              className="hover-card-thumb"
            />
            {logoUrl && (
              <div className="hc-logo-wrap">
                <img src={logoUrl} alt="Logo" className="hc-logo" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="hover-card-body">
        <div className="hover-card-actions">
          <div className="hc-actions-left">
            <button className="hc-btn hc-play" onClick={() => onPlay(movie)} title="Play">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button
              className={`hc-btn hc-circle${isInList ? ' hc-active' : ''}`}
              onClick={() => onToggleList(movie)}
              title={isInList ? 'Remove from My List' : 'Add to My List'}
            >
              {isInList ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              )}
            </button>
            
            {onRemoveContinue && (
              <button 
                className="hc-btn hc-circle hc-remove-sync" 
                onClick={(e) => { e.stopPropagation(); onRemoveContinue(movie); onClose(); }} 
                title="Remove from Continue Watching"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                </svg>
              </button>
            )}

            <button className="hc-btn hc-circle" title="Like">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
            </button>
          </div>
          <div className="hc-actions-right">
            <button className="hc-btn hc-circle" onClick={() => onSelect(movie)} title="Episodes & Info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
            </button>
          </div>
        </div>

        <div className="hover-card-meta">
          {matchPct !== null && <span className="hc-match">{matchPct}% Match</span>}
          <span className="hc-year">{year}</span>
          <span className="hc-badge">HD</span>
        </div>

        <div className="hover-card-genres">
          {genres.length > 0 ? (
            genres.map((g, i) => (
              <span key={g} className="hc-genre-item">
                {g}{i < genres.length - 1 && <span className="hc-dot">·</span>}
              </span>
            ))
          ) : (
            <span className="hc-genre-item">Loading...</span>
          )}
        </div>
      </div>
    </div>
    , document.body
  );
}

export default HoverCard;
