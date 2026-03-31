import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'bn', label: 'Bengali' },
  { code: 'kn', label: 'Kannada' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
];

function Navbar({ onSearch, selectedLang, onLangChange, activeView, onNavClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const { profile, logout, clearProfile } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <nav className={`navbar ${scrolled ? 'navbar--black' : ''}`}>
      <div className="navbar__left">
        <img className="nav__logo" src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" />
        <ul className="nav__links">
          <li className={activeView === 'home' ? 'active' : ''} onClick={() => onNavClick?.('home')}>Home</li>
          <li className={activeView === 'shows' ? 'active' : ''} onClick={() => onNavClick?.('shows')}>TV Shows</li>
          <li className={activeView === 'movies' ? 'active' : ''} onClick={() => onNavClick?.('movies')}>Movies</li>
          <li className={activeView === 'new' ? 'active' : ''} onClick={() => onNavClick?.('new')}>New &amp; Popular</li>
          <li className={activeView === 'mylist' ? 'active' : ''} onClick={() => onNavClick?.('mylist')}>My List</li>
        </ul>
      </div>

      <div className="navbar__right">
        {/* Search */}
        <div className={`nav-search-container ${searchOpen ? 'open' : ''}`}>
          {searchOpen && (
            <form onSubmit={handleSearchSubmit} className="nav-search-form">
              <input
                ref={searchInputRef}
                type="text"
                className="nav-search-input"
                placeholder="Titles, people, genres"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
              />
            </form>
          )}
          <button className="nav-icon-btn" onClick={() => setSearchOpen(s => !s)}>
            {searchOpen ? '✕' : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Language */}
        <div className="nav-lang-container" onMouseLeave={() => setLangOpen(false)}>
          <button className="nav-lang-btn" onMouseEnter={() => setLangOpen(true)}>
            🌐 {currentLang.label}
          </button>
          {langOpen && (
            <div className="nav-lang-dropdown">
              {LANGUAGES.map(lang => (
                <div
                  key={lang.code}
                  className={`nav-lang-item ${lang.code === selectedLang ? 'active' : ''}`}
                  onClick={() => { onLangChange?.(lang.code); setLangOpen(false); }}
                >
                  {lang.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Menu */}
        <div className="nav-account-container" onMouseEnter={() => setAccountMenuOpen(true)} onMouseLeave={() => setAccountMenuOpen(false)}>
          <div className="nav-profile-wrap">
            <img className="nav__avatar" src={profile?.avatar || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} alt="Avatar" />
            <svg className={`nav-profile-chevron ${accountMenuOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M7 10l5 5 5-5H7z"/></svg>
          </div>
          
          {accountMenuOpen && (
            <div className="nav-account-dropdown">
              <div className="nav-account-arrow" />
              <div className="nav-dropdown-profiles">
                <div className="nav-dropdown-item" onClick={clearProfile}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{marginRight: 10}}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
                  Manage Profiles
                </div>
              </div>
              <div className="nav-dropdown-divider" />
              <div className="nav-dropdown-item no-icon" onClick={logout}>
                Sign out of Netflix
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
