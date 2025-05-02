import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const { id } = useParams(); // Get the user ID from the URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'saved'

  // Fetch user data based on the ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/user/profile/${id}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login'); // Redirect to login if user not found
      }
    };

    fetchUser();
  }, [id, navigate]);

  // Fetch user's posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/user/posts/${id}`);
          setPosts(response.data);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
      }
    };

    fetchPosts();
  }, [user, id]);

  // Fetch user's saved posts
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/user/saved/${id}`);
          setSavedPosts(response.data);
        } catch (error) {
          console.error('Error fetching saved posts:', error);
        }
      }
    };

    fetchSavedPosts();
  }, [user, id]);

  return (
    <div className="profile">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="logo" onClick={() => navigate('/')}>
          Sheetwhere
        </span>
        <div className="right-buttons">
          <button onClick={() => navigate(`/profile/${id}`)}>Profile</button>
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
      </div>

      {/* Profile Section */}
      <div className="profile-header">
        <div className="profile-picture">
          <img src={user?.image || 'placeholder-profile.png'} alt="Profile" />
        </div>
        <h2>{user?.name || 'Name'}</h2>
        <div className="profile-actions">
          <button>+</button>
          <button>⚙</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={activeTab === 'saved' ? 'active' : ''}
          onClick={() => setActiveTab('saved')}
        >
          Saved
        </button>
      </div>

      {/* Content Section */}
      <div className="content">
        {activeTab === 'posts' &&
          posts.map((post) => (
            <div key={post.id} className="post">
              <img src={post.fileUrl || 'placeholder.png'} alt="Post" />
              <p>{post.title}</p>
            </div>
          ))}
        {activeTab === 'saved' &&
          savedPosts.map((post) => (
            <div key={post.id} className="post">
              <img src={post.fileUrl || 'placeholder.png'} alt="Post" />
              <p>{post.title}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Profile;