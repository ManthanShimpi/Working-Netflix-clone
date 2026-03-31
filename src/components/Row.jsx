import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import HoverCard from './HoverCard';
import Poster from './Poster';
import '../index.css';

function Row({ 
  title, 
  fetchUrl, 
  movies: initialMovies, 
  isLargeRow = false, 
  onMovieSelect, 
  onPlay, 
  lang, 
  isInList, 
  onToggleList,
  className = "",
  showProgress = false, onRemoveContinue }) {
  const [movies, setMovies] = useState(initialMovies || []);
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [hoveredRef, setHoveredRef] = useState(null);
  const hoverTimer = useRef(null);

  useEffect(() => {
    if (initialMovies) {
      setMovies(initialMovies);
      return;
    }
    
    async function fetchData() {
      try {
        const url = fetchUrl;
        const request = await api.get(url, { params: lang ? { language: lang } : {} });
        setMovies(request.data.results || []);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
    }
    fetchData();
  }, [fetchUrl, lang, initialMovies]);

  const handleMouseEnter = (movie, ref) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHoveredMovie(movie);
      setHoveredRef({ current: ref });
    }, 450);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
  };

  return (
    <div className={`row ${className}`}>
      <h2 className="row__title">
        {title}
        <span className="row__title-arrow">Explore All &rsaquo;</span>
      </h2>
      <div className="row__posters">
        {movies.map(movie => (
          <div
            key={movie.id}
            onMouseEnter={e => handleMouseEnter(movie, e.currentTarget)}
            onMouseLeave={handleMouseLeave}
          >
            <Poster 
              movie={movie} 
              isLargeRow={isLargeRow} 
              onSelect={onMovieSelect} 
              onPlay={onPlay} 
              showProgress={showProgress} onRemoveContinue={onRemoveContinue} 
            />
          </div>
        ))}
      </div>

      {hoveredMovie && (
        <HoverCard
          movie={hoveredMovie}
          anchorRef={hoveredRef}
          onClose={() => { setHoveredMovie(null); setHoveredRef(null); }}
          onSelect={m => { setHoveredMovie(null); onMovieSelect(m); }}
          onPlay={m => { setHoveredMovie(null); onPlay(m); }}
          isInList={isInList && isInList(hoveredMovie)}
          onToggleList={onToggleList} onRemoveContinue={onRemoveContinue}
        />
      )}
    </div>
  );
}

export default Row;
