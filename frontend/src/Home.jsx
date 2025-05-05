import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import { Link } from 'react-router-dom';
import { BsFilter } from 'react-icons/bs';  // เพิ่ม import filter icon

function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch tags from the backend
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/home/tags');
        setTags(response.data);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  // Fetch posts based on search query and selected tags
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // สร้าง query parameters
        const params = new URLSearchParams();
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        if (selectedTags.length > 0) {
          params.append('tags', selectedTags.join(','));
        }

        const response = await axios.get(`http://localhost:5000/api/home/posts?${params}`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, [searchQuery, selectedTags]);

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

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  // Filter tags by term
  const term1Tags = tags.filter(tag => parseInt(tag.id) >= 1 && parseInt(tag.id) <= 6);
  const term2Tags = tags.filter(tag => parseInt(tag.id) >= 7 && parseInt(tag.id) <= 12);

  return (
    <div className="home">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="logo" onClick={handleRefresh}>
          Sheetwhere
        </span>
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by title or tags"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="filter-button" onClick={toggleFilter}>
              <BsFilter size={20} />
            </button>
          </div>
          {selectedTags.length > 0 && (
            <div className="selected-tags">
              {selectedTags.map((tag) => (
                <span key={tag} className="selected-tag">
                  {tag}
                  <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
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

      {/* Filter Modal */}
      {showFilter && (
        <div className="filter-modal">
          <div className="filter-content">
            <div className="filter-header">
              <h2>Filter</h2>
              <button className="close-button" onClick={() => setShowFilter(false)}>×</button>
            </div>
            <div className="term-section">
              <h3>Term 1</h3>
              <div className="course-list">
                {term1Tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`course-item ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedTags.includes(tag.name)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag.name));
                      } else {
                        setSelectedTags([...selectedTags, tag.name]);
                      }
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="term-section">
              <h3>Term 2</h3>
              <div className="course-list">
                {term2Tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`course-item ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedTags.includes(tag.name)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag.name));
                      } else {
                        setSelectedTags([...selectedTags, tag.name]);
                      }
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="filter-actions">
              <button onClick={() => setShowFilter(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="posts">
        {posts.map((post) => (
          <Link to={`/posts/${post.id}`} key={post.id} className="post">
            <img src={post.fileUrls[0] || 'placeholder.png'} alt="Post" />
            <p>{post.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;