import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    console.log('Stored user:', storedUser); // Debugging line
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

  // Fetch posts based on search query and selected tag
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/home/posts', {
          params: {
            search: searchQuery,
            tag: selectedTag,
          },
        });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, [searchQuery, selectedTag]);

  // Handle Profile button click
  const handleProfileClick = () => {
    if (!user) {
      navigate('/login'); // Redirect to login if no user is logged in
    } else {
      navigate(`/profile/${user.id}`); // Redirect to profile page with user ID
    }
  };

  // Handle "Sheetwhere" click to refresh the page
  const handleRefresh = () => {
    window.location.reload(); // Refresh the page
  };

  return (
    <div className="home">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="logo" onClick={handleRefresh}>
          Sheetwhere
        </span>
        <input
          type="text"
          placeholder="Search by title or tags"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
        <button onClick={handleProfileClick}>Profile</button>
        {user && (
          <button
            onClick={() => {
              localStorage.removeItem('user'); // Logout
              setUser(null); // Clear user state
              navigate('/login'); // Redirect to login
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Posts Section */}
      <div className="posts">
        {posts.map((post) => (
          <div key={post.id} className="post">
            <img src={post.fileUrl || 'placeholder.png'} alt="Post" />
            <p>{post.title}fddhfh</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;