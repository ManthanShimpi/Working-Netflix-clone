import React from 'react';
import '../index.css';

function TelegramPlayer({ messageId, onClose }) {
  if (!messageId) return null;

  const streamUrl = `http://localhost:5000/api/telegram/stream/${messageId}`;

  return (
    <div className="video-player-overlay telegram-player-overlay">
      <button className="video-player-close" onClick={onClose}>
        ×
      </button>
      <div className="telegram-video-container">
        <video 
          controls 
          autoPlay 
          className="telegram-video"
          src={streamUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}

export default TelegramPlayer;
