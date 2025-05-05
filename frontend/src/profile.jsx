import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    tags: '',
    description: '',
    fileUrls: [],
  });
  const [loading, setLoading] = useState(true);

  // Check logged in user first
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;

      try {
        // Fetch user profile
        const userResponse = await axios.get(`http://localhost:5000/api/user/profile/${userId}`);
        setUser(userResponse.data);

        // Fetch user posts
        const postsResponse = await axios.get(`http://localhost:5000/api/user/posts/${userId}`);
        setPosts(postsResponse.data);

        // Fetch saved posts
        const savedResponse = await axios.get(`http://localhost:5000/api/user/saved-posts/${userId}`);
        setSavedPosts(savedResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
        if (error.response?.status === 404) {
          navigate('/');
        }
      }
    };

    fetchProfileData();
  }, [userId, navigate]);

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

  // Handle Add Post
  const handleAddPost = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/home/posts', {
        ...newPost,
        authorId: user.id,
      });
      setPosts([...posts, response.data]); // Add new post to the list
      setShowAddPostForm(false); // Close the form
      setNewPost({ title: '', tags: '', description: '', fileUrls: [] }); // Reset form
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

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
      const response = await axios.post(`http://localhost:5000/api/user/upload-profile-image/${userId}`, formData, {
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
      await axios.delete(`http://localhost:5000/api/user/delete-account/${userId}`);
      alert('Account deleted successfully.');
      localStorage.removeItem('user'); // ลบข้อมูลผู้ใช้ใน localStorage
      navigate('/'); // เปลี่ยนเส้นทางไปยังหน้าแรก
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account.');
    }
  };

  return (
    <div className="profile">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="logo" onClick={() => navigate('/')}>
          Sheetwhere
        </span>
        <div className="right-buttons">
          <button onClick={() => navigate(`/profile/${userId}`)}>Profile</button>
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
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }} // ซ่อน input
            onChange={handleProfileImageUpload} // เรียกฟังก์ชันอัปโหลดเมื่อเลือกไฟล์
            id="profile-image-upload"
          />
        </div>
        <h2>{user?.name || 'Name'}</h2>
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

      {/* Add Post Form */}
      {showAddPostForm && (
        <div className="add-post-form">
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
      )}

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
            <Link to={`/posts/${post.id}`} key={post.id} className="post">
              <img src={post.fileUrls[0] || 'placeholder.png'} alt="Post" />
              <p>{post.title}</p>
            </Link>
          ))}
        {activeTab === 'saved' &&
          savedPosts.map((post) => (
            <Link to={`/posts/${post.id}`} key={post.id} className="post">
              <img src={post.fileUrls[0] || 'placeholder.png'} alt="Post" />
              <p>{post.title}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}

export default Profile;