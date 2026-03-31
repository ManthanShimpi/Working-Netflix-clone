import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TelegramPlayer from './TelegramPlayer';
import '../index.css';

function TelegramRow({ title }) {
  const [videos, setVideos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPlayingResult, setIsPlayingResult] = useState(false);

  const fetchTelegramVideos = async (query = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/telegram/videos${query ? `?q=${query}` : ''}`);
      if (res.data) {
        setVideos(res.data.videos || []);
        // Ignore pagination buttons
        const validResults = (res.data.searchResults || []).filter(r => 
          !r.text.includes('Next') && !r.text.includes('Page') && !r.text.match(/^\d+\/\d+$/)
        );
        setSearchResults(validResults);
      }
    } catch (error) {
      console.error("Failed to fetch Telegram videos:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchTelegramVideos();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;
    setIsSearching(true);
    fetchTelegramVideos(searchQuery);
  };

  const handleVideoClick = (video) => {
    setSelectedVideoId(video.id);
  };

  const handleSearchResultClick = async (result) => {
    try {
      setIsPlayingResult(true);
      const res = await axios.post('http://localhost:5000/api/telegram/click', {
        messageId: result.messageId,
        dataHex: result.data
      });
      if (res.data && res.data.videoMessageId) {
        setSelectedVideoId(res.data.videoMessageId);
      }
    } catch (error) {
      console.error("Failed to load video from result", error);
    } finally {
      setIsPlayingResult(false);
    }
  };

  return (
    <div className="row telegram-row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        <form className="telegram-search-form" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Search movie from bot..." 
            className="telegram-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="telegram-search-btn" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="telegram-loading">Loading videos...</div>
      ) : isPlayingResult ? (
        <div className="telegram-loading">Extracting video from bot, please wait...</div>
      ) : videos.length === 0 && searchResults.length === 0 ? (
        <div className="telegram-loading">No videos found.</div>
      ) : (
        <div className="row__posters telegram-posters">
          {searchResults.map((result, idx) => (
            <div 
              key={`res-${idx}`} 
              className="telegram-poster"
              onClick={() => handleSearchResultClick(result)}
            >
              <div className="telegram-poster-content">
                <h3>{result.text.split('•').slice(-1)[0].trim()}</h3>
                <p>{result.text.split('•')[0].trim()}</p>
                <p style={{marginTop: '8px', color: '#e50914'}}>▶ Select</p>
              </div>
            </div>
          ))}

          {videos.map((video) => (
            <div 
              key={video.id} 
              className="telegram-poster"
              onClick={() => handleVideoClick(video)}
            >
              <div className="telegram-poster-content">
                <h3>{video.fileName}</h3>
                <p>▶ Play Direct Video</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedVideoId && (
        <TelegramPlayer 
          messageId={selectedVideoId} 
          onClose={() => setSelectedVideoId(null)} 
        />
      )}
    </div>
  );
}

export default TelegramRow;
