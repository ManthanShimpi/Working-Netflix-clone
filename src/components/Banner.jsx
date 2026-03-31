import React, { useState, useEffect } from 'react';
import api, { requests, fetchLogo } from '../services/api';
import '../index.css';

const IMG_BASE = 'https://image.tmdb.org/t/p/original';

function Banner({ onMovieSelect, onPlay, lang }) {
  const [movie, setMovie] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(localStorage.getItem("netflix_muted") !== "false");

  useEffect(() => {
    api.get(requests.fetchTrending, { params: lang ? { language: lang } : {} }).then(res => {
      const results = res.data.results || [];
      const picked = results.filter(m => m.backdrop_path)[Math.floor(Math.random() * 5)];
      
      setMovie(picked);
      setLogoUrl(null);
      setTrailerKey(null);
      setShowTrailer(false);

      if (picked) {
        const mediaType = picked.media_type || (picked.first_air_date ? 'tv' : 'movie');
        fetchLogo(mediaType, picked.id).then(setLogoUrl);

        api.get(`/${mediaType}/${picked.id}/videos`).then(vRes => {
          const vList = vRes.data.results || [];
          const trailer = vList.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vList[0];
          if (trailer?.key) {
            setTrailerKey(trailer.key);
            setTimeout(() => setShowTrailer(true), 1200);
          }
        }).catch(() => setShowTrailer(false));
      }
    });
  }, [lang]);

  if (!movie) return <div className="banner banner--skeleton" />;

  const title = movie.title || movie.name || movie.original_name;

  return (
    <header className="banner">
      {/* Background */}
      <div className="banner-media-container">
        {showTrailer && trailerKey ? (
          <div className="banner-trailer-wrap">
            <iframe
              className="banner-trailer-frame"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&disablekb=1&fs=0&cc_load_policy=0&playsinline=1&enablejsapi=1`}
              allow="autoplay; fullscreen"
              title="Banner Trailer"
              frameBorder="0"
              tabIndex="-1"
            />
          </div>
        ) : (
          <div
            className="banner-backdrop"
            style={{ backgroundImage: `url(${IMG_BASE}${movie.backdrop_path})` }}
          />
        )}
      </div>

      <div className="banner--fadeBottom" />

      {/* Content */}
      <div className="banner__contents">
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="banner__logo" />
        ) : (
          <h1 className="banner__title">{title}</h1>
        )}
        
        <p className="banner__description">
          {movie.overview?.length > 180 ? movie.overview.substring(0, 177) + '…' : movie.overview}
        </p>
        <div className="banner__buttons">
          <button className="banner__button banner__button--play" onClick={() => onPlay(movie)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
            Play
          </button>
          <button className="banner__button banner__button--info" onClick={() => onMovieSelect(movie)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            More Info
          </button>
        </div>
      </div>

      {/* Mute toggle */}
      {showTrailer && trailerKey && (
        <button
          className="banner-mute-btn"
          onClick={() => { const s = !isMuted; setIsMuted(s); localStorage.setItem("netflix_muted", s); }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          }
        </button>
      )}
    </header>
  );
}

export default Banner;
