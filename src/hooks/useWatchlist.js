import { useState, useEffect } from 'react';

const STORAGE_KEY = 'netflix_watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const isInList = (movie) => watchlist.some(m => m.id === movie.id);

  const toggleList = (movie) => {
    setWatchlist(prev =>
      prev.some(m => m.id === movie.id)
        ? prev.filter(m => m.id !== movie.id)
        : [...prev, { id: movie.id, title: movie.title || movie.name, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, overview: movie.overview, media_type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie') }]
    );
  };

  return { watchlist, isInList, toggleList };
}
