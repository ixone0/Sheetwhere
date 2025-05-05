import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BsFilter } from 'react-icons/bs';
import './NavigationBar.css';

function NavigationBar({ 
  user, 
  setUser, 
  searchQuery, 
  setSearchQuery, 
  selectedTags, 
  setSelectedTags,
  isSearching,
  showFilter,
  toggleFilter,
  showSearch = true
}) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="top-bar">
      <span className="logo" onClick={handleRefresh}>
        Sheetwhere
      </span>
      {showSearch && (
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                placeholder={isSearching ? 'Searching...' : 'Search by title or tags'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isSearching ? 'searching' : ''}
              />
              {selectedTags?.length > 0 && (
                <div className="selected-tags">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="selected-tag">
                      {tag}
                      <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <button className="filter-button" onClick={toggleFilter}>
                <BsFilter size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="user-controls">
        <button onClick={handleProfileClick}>
          {user ? 'Profile' : 'Login'}
        </button>
        {user && user.isAdmin && (
          <button onClick={() => navigate('/admin')}>Admin</button>
        )}
        {user && (
          <button
            onClick={() => {
              localStorage.removeItem('user');
              setUser(null);
              navigate('/login');
            }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default NavigationBar;