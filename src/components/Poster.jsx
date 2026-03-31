import React, { useState, useEffect } from 'react';
import { fetchLogo } from '../services/api';
import '../index.css';

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

function Poster({ movie, isLargeRow, onSelect, onPlay, showProgress, onRemoveContinue }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    fetchLogo(mediaType, movie.id).then(url => {
      setLogoUrl(url);
    });
  }, [movie.id, movie.media_type, movie.first_air_date]);

  const imgSrc = isLargeRow ? movie.poster_path : movie.backdrop_path;
  if (!imgSrc) return null;

  return (
    <div
      className={`row__poster-wrap ${isLargeRow ? 'row__poster-wrap--large' : ''} ${isLoaded ? 'loaded' : ''}`}
      onClick={() => onSelect(movie)}
    >
      <img
        className={`row__poster ${isLargeRow ? 'row__posterLarge' : ''}`}
        src={`${IMG_BASE}${imgSrc}`}
        alt={movie.title || movie.name}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {logoUrl && (
        <div className="row__poster-logo-wrap">
          <img src={logoUrl} alt="Logo" className="row__poster-logo" />
        </div>
      )}

      {!logoUrl && isLoaded && (
        <div className="row__poster-label">{movie.title || movie.name}</div>
      )}

      <div className="row__poster-quick-play" onClick={(e) => { e.stopPropagation(); onPlay(movie); }}>
        <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>

      {showProgress && movie.progress !== undefined && (
        <div className="row__poster-progress">
          <div 
            className="row__poster-progress-fill" 
            style={{ width: `${movie.progress}%` }} 
          />
        </div>
      )}

      {onRemoveContinue && (
        <div className="row__poster-remove" onClick={(e) => { e.stopPropagation(); onRemoveContinue(movie); }}>
          <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export default Poster;
