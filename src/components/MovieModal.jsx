import React, { useEffect, useState } from 'react';
import api, { fetchLogo } from '../services/api';
import '../index.css';

function MovieModal({ movie, onClose, onPlay, isInList, onToggleList }) {
  const [details, setDetails]           = useState(null);
  const [logoUrl, setLogoUrl]           = useState(null);
  const [recommendations, setRecs]      = useState([]);
  const [seasons, setSeasons]           = useState([]);
  const [episodes, setEpisodes]         = useState([]);
  const [activeSeason, setActiveSeason] = useState(1);
  const [isClosing, setIsClosing]       = useState(false);
  const [epLoading, setEpLoading]       = useState(false);
  const [trailerKey, setTrailerKey]       = useState(null);
  const [showTrailer, setShowTrailer]     = useState(false);
  const [isMuted, setIsMuted]             = useState(localStorage.getItem("netflix_muted") !== "false");
  const [epProgressMap, setEpProgressMap] = useState({});
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrollRef = React.useRef(null);

  const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (scrollRef.current) scrollRef.current.scrollTop = 0; // Reset scroll on open

    const scanEpProgress = () => {
      const pMap = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`vk_progress_tv_${movie.id}_`)) {
          const parts = key.split('_');
          const s = parts[4];
          const e = parts[5];
          if (s && e) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              pMap[`${s}_${e}`] = (data.currentTime / data.duration) * 100;
            } catch (e) {}
          }
        }
      }
      setEpProgressMap(pMap);
    };
    scanEpProgress();
    
    // 1. Fetch Basic Details, Credits & Trailers
    api.get(`/${mediaType}/${movie.id}?append_to_response=credits,recommendations,similar,videos`)
      .then(res => {
        setDetails(res.data);
        const recs = res.data.recommendations?.results || res.data.similar?.results || [];
        setRecs(recs.slice(0, 12));
        
        // Resolve Trailer
        const vList = res.data.videos?.results || [];
        const trailer = vList.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vList[0];
        if (trailer?.key) {
          setTrailerKey(trailer.key);
          setTimeout(() => setShowTrailer(true), 1200);
        }

        if (mediaType === 'tv') {
          const s = (res.data.seasons || []).filter(item => item.season_number > 0);
          setSeasons(s);
          if (s.length > 0) setActiveSeason(s[0].season_number);
        }
      })
      .catch(err => console.error('Modal data fetch error:', err));

    // 2. Fetch Official Logo
    fetchLogo(mediaType, movie.id).then(setLogoUrl);

    return () => { document.body.style.overflow = 'auto'; };
  }, [movie, mediaType]);

  // Fetch episodes when season changes
  useEffect(() => {
    if (mediaType !== 'tv' || !activeSeason) return;
    setEpLoading(true);
    api.get(`/tv/${movie.id}/season/${activeSeason}`)
      .then(res => {
        setEpisodes(res.data.episodes || []);
        setEpLoading(false);
      })
      .catch(() => setEpLoading(false));
  }, [movie.id, activeSeason, mediaType]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 280);
  };

  if (!movie) return null;

  const base_url = 'https://image.tmdb.org/t/p/original/';
  const d       = details || movie;
  const title   = d.title || d.name || d.original_name || '';
  const year    = (d.release_date || d.first_air_date || '').substring(0, 4);
  const overview = d.overview || '';
  const genres  = (d.genres || []).map(g => g.name).join(', ') || 'N/A';
  const cast    = details?.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '—';
  const runtime = d.runtime
    ? `${d.runtime}m`
    : d.number_of_seasons
    ? `${d.number_of_seasons} Season${d.number_of_seasons !== 1 ? 's' : ''}`
    : '';
  const rating  = d.vote_average ? d.vote_average.toFixed(1) : '';
  const inList  = isInList ? isInList(movie) : false;

  return (
    <div className="movie-modal-overlay" onClick={handleClose}>
      <div
        ref={scrollRef}
        className={`movie-modal-content${isClosing ? ' closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <button className="movie-modal-close" onClick={handleClose}>✕</button>

        {/* Hero Area */}
        <div className="movie-modal-hero">
          <div className="movie-modal-hero-mask" />
          
          {showTrailer && trailerKey ? (
            <div className="movie-modal-trailer-wrap">
              <iframe
                className="movie-modal-trailer-frame"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&disablekb=1&fs=0&cc_load_policy=0&playsinline=1`}
                allow="autoplay; fullscreen"
                title="Hero Trailer"
                frameBorder="0"
                tabIndex="-1"
              />
            </div>
          ) : (
            <img
              src={`${base_url}${d.backdrop_path || d.poster_path}`}
              alt={title}
              className="movie-modal-backdrop"
            />
          )}

          <div className="movie-modal-hero-content">
            {logoUrl ? (
              <img src={logoUrl} alt={title} className="movie-modal-logo" />
            ) : (
              <h1 className="movie-modal-title">{title}</h1>
            )}
            
            <div className="movie-modal-controls">
              <button className="movie-modal-play-btn" onClick={() => onPlay(movie)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </button>

              <button
                className={`movie-modal-round-btn${inList ? ' mm-in-list' : ''}`}
                title={inList ? 'Remove from My List' : 'Add to My List'}
                onClick={() => onToggleList && onToggleList(movie)}
              >
                {inList ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mute Toggle */}
          {showTrailer && (
            <button
              className="movie-modal-mute-btn"
              onClick={() => { const s = !isMuted; setIsMuted(s); localStorage.setItem("netflix_muted", s); }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              )}
            </button>
          )}
        </div>

        {/* Main Info */}
        <div className="movie-modal-info">
          <div className="movie-modal-info-left">
            <div className="movie-modal-metadata">
              {rating && <span className="movie-modal-match">★ {rating}</span>}
              {year   && <span className="movie-modal-year">{year}</span>}
              {runtime && <span className="movie-modal-year">{runtime}</span>}
              <span className="movie-modal-badge">HD</span>
            </div>
            <p className="movie-modal-overview">{overview}</p>
          </div>

          <div className="movie-modal-info-right">
            <p><span className="mm-label">Cast: </span>{cast}</p>
            <p><span className="mm-label">Genres: </span>{genres}</p>
          </div>
        </div>

        {/* Episodes Section (TV Only) */}
        {mediaType === 'tv' && seasons.length > 0 && (
          <div className="modal-section episodes-section">
            <div className="modal-section-header">
              <h2 className="modal-section-title">Episodes</h2>
              <div className="ss-season-dropdown-wrap">
                <div 
                  className="ss-season-custom-btn" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{seasons.find(s => s.season_number === activeSeason)?.name || `Season ${activeSeason}`}</span>
                  <svg className={`ss-chevron ${isDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="white" width="18" height="18">
                    <path d="M7 10l5 5 5-5H7z"/>
                  </svg>
                </div>
                
                {isDropdownOpen && (
                  <div className="ss-season-dropdown-list">
                    {seasons.map(s => (
                      <div 
                        key={s.id} 
                        className={`ss-season-item ${s.season_number === activeSeason ? 'active' : ''}`}
                        onClick={() => {
                          setActiveSeason(s.season_number);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {s.name || `Season ${s.season_number}`}
                        {s.episode_count && <span className="ss-ep-count">({s.episode_count} Episodes)</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="episodes-list">
              {epLoading ? (
                <div className="ss-ep-loading"><div className="nf-spinner" /></div>
              ) : (
                <>
                  {(showAllEpisodes ? episodes : episodes.slice(0, 10)).map(ep => {
                    const progress = epProgressMap[`${activeSeason}_${ep.episode_number}`];
                    return (
                      <div
                        key={ep.id}
                        className="ss-episode-row"
                        onClick={() => onPlay({...movie, season: activeSeason, episode: ep.episode_number})}
                      >
                        <div className="ss-ep-number">{ep.episode_number}</div>
                        <div className="ss-ep-thumb-wrap">
                          <div className="ss-ep-thumb">
                            {ep.still_path ? (
                              <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} />
                            ) : (
                              <div className="ss-ep-no-thumb" />
                            )}
                            <div className="ss-ep-play-overlay">
                              <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            {progress > 0 && (
                              <>
                                <div className="ss-ep-progress-bg" />
                                <div className="ss-ep-progress-bar" style={{ width: `${progress}%` }} />
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ss-ep-info">
                          <div className="ss-ep-title-row">
                            <span className="ss-ep-name">{ep.name}</span>
                            {ep.runtime && <span className="ss-ep-runtime">{ep.runtime}m</span>}
                          </div>
                          <p className="ss-ep-overview">{ep.overview}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {!showAllEpisodes && episodes.length > 10 && (
                    <div className="ss-ep-show-more-wrap">
                      <div className="ss-ep-divider" />
                      <button className="ss-ep-show-more-btn" onClick={() => setShowAllEpisodes(true)}>
                        <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* More Like This Grid */}
        {recommendations.length > 0 && (
          <div className="modal-section">
            <h2 className="modal-section-title">More Like This</h2>
            <div className="recommendations-grid">
              {recommendations.map(req => (
                <div 
                  key={req.id} 
                  className="rec-card"
                  onClick={() => {
                    onPlay(req); 
                  }}
                >
                  <div className="rec-card-img-wrap">
                    <img 
                      src={`https://image.tmdb.org/t/p/w300${req.backdrop_path || req.poster_path}`} 
                      alt={req.title || req.name} 
                    />
                    <div className="rec-card-play">
                      <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="rec-card-body">
                    <div className="rec-card-meta">
                      <div className="rec-card-meta-top">
                        <span className="rec-match">{(req.vote_average * 10).toFixed(0)}% Match</span>
                        <div className="rec-round-badge">HD</div>
                      </div>
                      <span className="rec-year">{(req.release_date || req.first_air_date || '').substring(0, 4)}</span>
                    </div>
                    <p className="rec-overview">{req.overview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-section about-section">
          <h2 className="modal-section-title">About <strong>{title}</strong></h2>
          <div className="about-grid">
            <p><span className="mm-label">Cast: </span>{cast}</p>
            <p><span className="mm-label">Genres: </span>{genres}</p>
            <p><span className="mm-label">Release Year: </span>{year}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MovieModal;
