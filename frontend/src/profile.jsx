import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const { id } = useParams(); // Get the user ID from the URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [tags, setTags] = useState([]); // State for tags
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'saved'
  const [showAddPostForm, setShowAddPostForm] = useState(false); // Toggle Add Post form
  const [showDropdown, setShowDropdown] = useState(false); 
  const [newPost, setNewPost] = useState({
    title: '',
    tags: '',
    description: '',
    fileUrls: [],
  });
  const [stats, setStats] = useState({
    posts: 0,
    likes: 0
  });

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

  // Fetch saved posts
useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/user/saved-posts/${id}`);
        setSavedPosts(response.data);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      }
    };

  fetchSavedPosts();
}, [id]);

  // Fetch tags from backend
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
  const handleAddPost = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('http://localhost:5000/api/home/posts', {
          ...newPost,
          authorId: user.id,
        });

        // เพิ่มโพสต์ใหม่ใน state
        setPosts([...posts, response.data]);

        // Fetch จำนวนโพสต์และไลค์ใหม่
        fetchUserStats();

        // ปิดฟอร์มและรีเซ็ตค่า
        setShowAddPostForm(false);
        setNewPost({ title: '', tags: '', description: '', fileUrls: [] });
        alert('Post added successfully!');
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post.');
      }
    };
  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/user/stats/${id}`);
        setStats({
          posts: response.data.posts,
          likes: response.data.likes,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [id]);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/user/stats/${id}`);
      setStats({
        posts: response.data.posts,
        likes: response.data.likes,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Handle Add Post
  

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  
    for (let i = 0; i < files.length; i++) {
      if (!allowedTypes.includes(files[i].type)) {
        alert('Only image files (jpg, jpeg, png) are allowed.');
        return;
      }
    }
  
    const formData = new FormData();
  
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]); // Append each file to FormData
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/home/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewPost({ ...newPost, fileUrls: response.data.fileUrls }); // Save file URLs
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      alert('Only image files (jpg, jpeg, png) are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`http://localhost:5000/api/user/upload-profile-image/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser({ ...user, image: response.data.imageUrl }); // Update profile image in state
      alert('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/user/delete-account/${id}`);
      alert('Account deleted successfully.');
      localStorage.removeItem('user'); // ลบข้อมูลผู้ใช้ใน localStorage
      navigate('/'); // เปลี่ยนเส้นทางไปยังหน้าแรก
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account.');
    }
  };

  const handleProfileClick = () => {
    document.getElementById('profile-image-upload').click();
  };

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
        <div className="profile-picture" onClick={handleProfileClick}>
          <img src={user?.image || 'placeholder-profile.png'} alt="Profile" />
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleProfileImageUpload}
            id="profile-image-upload"
          />
        </div>
        
        <div className="profile-info">
          <h2>{user?.name || 'Name'}</h2>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.posts}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.likes}</span>
            <span className="stat-label">Likes</span>
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={() => setShowAddPostForm(!showAddPostForm)}>+</button>
          <div className="dropdown">
            <button onClick={() => setShowDropdown(!showDropdown)}>⚙</button>
            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={() => document.getElementById('profile-image-upload').click()}>
                  Change Profile
                </button>
                <button onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Post Modal */}
      {showAddPostForm && (
        <div className="modal-overlay">
          <div className="add-post-form">
            <button className="close-button" onClick={() => setShowAddPostForm(false)}>×</button>
            <h2>Create New Post</h2>
            <form onSubmit={handleAddPost}>
              <input
                type="text"
                placeholder="Title"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
              />
              <select
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                required
              >
                <option value="">Select Tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                value={newPost.description}
                onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                required
              />
              <input type="file" multiple onChange={handleImageUpload} required />
              <button type="submit">Post</button>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          <i className="fa-solid fa-images"></i>
          <span>My Posts</span>
        </button>
        <button
          className={activeTab === 'saved' ? 'active' : ''}
          onClick={() => setActiveTab('saved')}
        >
          <i className="fa-solid fa-bookmark"></i>
          <span>Saved</span>
        </button>
      </div>

      {/* Content Section */}
      <div className="content">
        {activeTab === 'posts' &&
          posts.map((post) => (
            <Link to={`/posts/${post.id}`} key={post.id} className="post">
              <div className="post-image">
                <img src={post.fileUrls[0] || 'placeholder.png'} alt="Post" />
              </div>
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <div className="post-tags">
                  {post.tags && post.tags.length > 0 && post.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag.name}</span>
                  ))}
                </div>
                <p className="post-description">{post.description}</p>
              </div>
            </Link>
          ))}
        {activeTab === 'saved' &&
          savedPosts.map((post) => (
            <Link to={`/posts/${post.id}`} key={post.id} className="post">
              <div className="post-image">
                <img src={post.fileUrls?.[0] || 'placeholder.png'} alt="Post" />
              </div>
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <div className="post-tags">
                  {post.tags && post.tags.length > 0 && post.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag.name}</span>
                  ))}
                </div>
                <p className="post-description">{post.description}</p>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}

export default Profile;