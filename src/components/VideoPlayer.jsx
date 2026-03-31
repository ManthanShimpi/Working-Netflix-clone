import React from 'react';
import '../index.css';

function VideoPlayer({ tmdbId, onClose }) {
  if (!tmdbId) return null;

  // Multi-server aggregator API
  const embedUrl = `https://vidsrc.to/embed/movie/${tmdbId}`;

  return (
    <div className="video-player-overlay">
      <button className="video-player-close" onClick={onClose}>
        ×
      </button>
      <iframe
        className="video-iframe"
        src={embedUrl}
        allowFullScreen
        title="Streaming Video Player"
      ></iframe>
    </div>
  );
}

export default VideoPlayer;
