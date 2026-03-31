import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import Row from './components/Row';
import MovieModal from './components/MovieModal';
import EmbedPlayer from './components/EmbedPlayer';
import Poster from './components/Poster';
import { useWatchlist } from './hooks/useWatchlist';
import api, { requests } from './services/api';
import './index.css';

const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

function App() {
  // ── View state ─────────────────────────────────────────────────────────
  const [view, setView]             = useState('home'); // 'home' | 'movies' | 'shows' | 'new' | 'mylist'
  const [selectedLang, setSelectedLang] = useState('en');

  // ── Modal / player state ────────────────────────────────────────────────
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [embedInfo, setEmbedInfo]         = useState(null);
  const { watchlist, isInList, toggleList } = useWatchlist();
  const [continueWatching, setContinueWatching] = useState([]);

  // ── Search state ────────────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState(null); // null = no search active

  // ── Continue Watching Logic ─────────────────────────────────────────────
  React.useEffect(() => {
    const scanProgress = async () => {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('vk_progress_')) {
          try {
            const parts = key.split('_'); // vk, progress, type, id, s, e
            const type = parts[2];
            const id   = parts[3];
            const data = JSON.parse(localStorage.getItem(key));
            
            // Check if item already in list (avoid duplicates for different episodes)
            if (!items.find(x => x.id === id)) {
              items.push({ id, type, ...data });
            }
          } catch (e) {}
        }
      }

      // Sort by recent timestamp
      items.sort((a,b) => b.ts - a.ts);

      // Fetch metadata for top 12 items
      const enriched = await Promise.all(items.slice(0, 12).map(async (item) => {
        try {
          const res = await api.get(`/${item.type}/${item.id}`);
          return { ...res.data, media_type: item.type, progress: (item.currentTime / item.duration) * 100 };
        } catch (e) { return null; }
      }));
      
      setContinueWatching(enriched.filter(Boolean));
    };

    scanProgress();
    // Refresh when view returns to home or player closes
  }, [view, embedInfo]);

  const handleRemoveContinue = (item) => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`vk_progress_${item.media_type}_${item.id}`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    setContinueWatching(prev => prev.filter(x => x.id !== item.id));
  };

  // ── Event handlers ──────────────────────────────────────────────────────
  const handleMovieSelect = (movie) => setSelectedMovie(movie);

  const handleSearch = async (query) => {
    setView('home');
    try {
      const res = await api.get(`/search/multi?query=${encodeURIComponent(query)}&language=${selectedLang}-IN`);
      setSearchResults({ query, results: res.data.results || [] });
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    setSearchResults(null);
  };

  const handleNavClick = (v) => {
    setView(v);
    setSearchResults(null);
    setSelectedMovie(null);
  };

  // Called when "Play" inside MovieModal is clicked
  const handlePlayMovie = (movie) => {
    setSelectedMovie(null);
    handleEmbedSelect(movie);
  };

  // Called to start Cineby playback flow
  const handleEmbedSelect = (movie) => {
    // If it's a specific episode from the modal selector, it will have .season / .episode
    if (movie.season && movie.episode) {
      setEmbedInfo({
        tmdbId:    movie.id,
        mediaType: 'tv',
        title:     movie.name || movie.original_name || '',
        season:    movie.season,
        episode:   movie.episode
      });
      return;
    }

    const isTV = !!(movie.first_air_date || movie.number_of_seasons);
    
    if (isTV) {
      setEmbedInfo({
        tmdbId:    movie.id,
        mediaType: 'tv',
        title:     movie.name || movie.original_name || '',
        season:    1,
        episode:   1,
      });
    } else {
      setEmbedInfo({
        tmdbId:    movie.id,
        mediaType: 'movie',
        title:     movie.title || movie.original_title || '',
      });
    }
  };

  const handleNextEpisode = () => {
    if (!embedInfo || embedInfo.mediaType !== 'tv') return;
    setEmbedInfo(prev => ({
      ...prev,
      episode: prev.episode + 1
    }));
  };

  // Row fetch URLs (clean)  
  const rowUrls = {
    originals: requests.fetchNetflixOriginals,
    trending:  requests.fetchTrending,
    topRated:  requests.fetchTopRated,
    action:    requests.fetchActionMovies,
    comedy:    requests.fetchComedyMovies,
    horror:    requests.fetchHorrorMovies,
    romance:   requests.fetchRomanceMovies,
    docs:      requests.fetchDocumentaries,
    movies:    '/discover/movie?sort_by=popularity.desc',
    shows:     '/discover/tv?sort_by=popularity.desc',
    new:       '/movie/upcoming',
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const renderContent = () => {
    // Search results page
    if (searchResults) {
      return (
        <div className="search-results-page">
          <h2>Results for <strong>"{searchResults.query}"</strong></h2>
          <div className="search-grid">
            {searchResults.results.length === 0 && <p style={{color:'#aaa'}}>No results found.</p>}
            {searchResults.results.map(m => (
              <Poster 
                key={m.id} 
                movie={m} 
                onSelect={handleMovieSelect} 
                onPlay={handlePlayMovie} 
              />
            ))}
          </div>
        </div>
      );
    }

    // Movies page
    if (view === 'movies') return (
      <div style={{paddingTop:80}}>
        <Row title="Popular Movies"   fetchUrl={rowUrls.movies}   onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Top Rated"        fetchUrl={rowUrls.topRated}  onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Action"           fetchUrl={rowUrls.action}    onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Comedy"           fetchUrl={rowUrls.comedy}    onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Horror"           fetchUrl={rowUrls.horror}    onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
      </div>
    );

    // TV Shows page
    if (view === 'shows') return (
      <div style={{paddingTop:80}}>
        <Row title="Popular TV Shows"   fetchUrl={rowUrls.shows}     onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Netflix Originals"  fetchUrl={rowUrls.originals}  onMovieSelect={handleMovieSelect} isLargeRow onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Romance"            fetchUrl={rowUrls.romance}    onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Documentaries"      fetchUrl={rowUrls.docs}       onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
      </div>
    );

    // New & Popular page
    if (view === 'new') return (
      <div style={{paddingTop:80}}>
        <Row title="New Releases"    fetchUrl={rowUrls.new}       onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Trending Now"    fetchUrl={rowUrls.trending}  onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
      </div>
    );

    // My List (show actual movies from watchlist)
    if (view === 'mylist') return (
      <div className="search-results-page">
        <h2 style={{fontSize:'1.5rem', marginBottom:20}}>My List</h2>
        {watchlist.length === 0 ? (
          <p style={{color:'#aaa'}}>Your list is empty. Add movies and shows to see them here!</p>
        ) : (
          <div className="search-grid">
            {watchlist.map(m => (
              <Poster 
                key={m.id} 
                movie={m} 
                onSelect={handleMovieSelect} 
                onPlay={handlePlayMovie} 
              />
            ))}
          </div>
        )}
      </div>
    );

    // Home
    return (
      <>
        <Banner onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} />

        {/* Home Row Sequence - Priority Overlap */}

        {watchlist.length > 0 ? (
          <Row 
            title="Your Next Watch" 
            movies={watchlist} 
            className="row-hero-overlap"
            onMovieSelect={handleMovieSelect} 
            onPlay={handlePlayMovie} 
            lang={selectedLang} 
            isInList={isInList} 
            onToggleList={toggleList} 
          />
        ) : continueWatching.length > 0 ? (
          <Row 
            title="Continue Watching for You" 
            movies={continueWatching} 
            className="row-hero-overlap"
            onMovieSelect={handleMovieSelect} 
            onPlay={handlePlayMovie} 
            lang={selectedLang} 
            showProgress
            onRemoveContinue={handleRemoveContinue}
          />
        ) : (
          <Row 
            title="NETFLIX ORIGINALS" 
            fetchUrl={rowUrls.originals} 
            isLargeRow 
            className="row-hero-overlap"
            onMovieSelect={handleMovieSelect} 
            onPlay={handlePlayMovie} 
            lang={selectedLang} 
            isInList={isInList} 
            onToggleList={toggleList} 
          />
        )}

        {/* Subsequent Rows (Standard Spacing) */}
        {watchlist.length > 0 && continueWatching.length > 0 && (
          <Row 
            title="Continue Watching for You" 
            movies={continueWatching} 
            onMovieSelect={handleMovieSelect} 
            onPlay={handlePlayMovie} 
            lang={selectedLang} 
            showProgress
            onRemoveContinue={handleRemoveContinue}
          />
        )}
        
        {/* We skip Originals if it was used as the overlap row above */}
        {(watchlist.length > 0 || continueWatching.length > 0) && (
          <Row title="NETFLIX ORIGINALS"  fetchUrl={rowUrls.originals} isLargeRow onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        )}
        <Row title="Trending Now"        fetchUrl={rowUrls.trending}  onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Top Rated"           fetchUrl={rowUrls.topRated}  onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Action &amp; Adventure" fetchUrl={rowUrls.action} onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Comedy"              fetchUrl={rowUrls.comedy}    onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Thrills &amp; Horror" fetchUrl={rowUrls.horror}   onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Romance"             fetchUrl={rowUrls.romance}   onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
        <Row title="Documentaries"       fetchUrl={rowUrls.docs}      onMovieSelect={handleMovieSelect} onPlay={handlePlayMovie} lang={selectedLang} isInList={isInList} onToggleList={toggleList} />
      </>
    );
  };

  return (
    <div className="app">
      <Navbar
        onSearch={handleSearch}
        selectedLang={selectedLang}
        onLangChange={handleLangChange}
        activeView={view}
        onNavClick={handleNavClick}
      />

      {renderContent()}

      {/* Movie Info Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={handlePlayMovie}
          isInList={isInList}
          onToggleList={toggleList}
        />
      )}

      {/* External Embed Player (Cineby/Vidking) */}
      {embedInfo && (
        <EmbedPlayer
          tmdbId={embedInfo.tmdbId}
          mediaType={embedInfo.mediaType}
          title={embedInfo.title}
          season={embedInfo.season}
          episode={embedInfo.episode}
          onClose={() => setEmbedInfo(null)}
          onNext={embedInfo.mediaType === 'tv' ? handleNextEpisode : null}
        />
      )}
    </div>
  );
}

export default App;
