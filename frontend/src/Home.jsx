import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import NavigationBar from './components/NavigationBar';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const navigate = useNavigate();

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

  const fetchPosts = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.id;

    try {
      const response = await axios.get('http://localhost:5000/api/home/posts', {
        params: {
          search: searchQuery,
          tags: selectedTags.join(','),
          userId, // ส่ง userId ไปยัง backend
        },
      });

      setPosts(response.data); // ตั้งค่า posts พร้อมข้อมูล isLiked และ likeCount
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setIsLoading(false);
    }
  }, [searchQuery, selectedTags]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        setIsSearching(true);
      }
      fetchPosts();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTags, fetchPosts]);

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  // Filter tags by term
  const term1Tags = tags.filter(tag => parseInt(tag.id) >= 1 && parseInt(tag.id) <= 6);
  const term2Tags = tags.filter(tag => parseInt(tag.id) >= 7 && parseInt(tag.id) <= 12);

  // Skeleton loading component
  const PostSkeleton = () => (
    <div className="post skeleton">
      <div className="skeleton-img"></div>
      <div className="skeleton-text"></div>
    </div>
  );

  // Add handleLike function
  const handleLike = async (postId) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !storedUser.id) {
      alert('Please log in to like posts.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/home/posts/${postId}/like`, {
        userId: storedUser.id, // ตรวจสอบว่าค่านี้ถูกส่งไป
      });

      // อัปเดตสถานะการกดไลค์และจำนวนไลค์ในโพสต์ที่เกี่ยวข้อง
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, isLiked: response.data.isLiked, likeCount: response.data.likeCount }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like the post.');
    }
  };

  return (
    <div className="home">
      <NavigationBar 
        user={user}
        setUser={setUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        isSearching={isSearching}
        showFilter={showFilter}
        toggleFilter={toggleFilter}
      />

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
              <button onClick={() => setSelectedTags([])}>Clear All</button>
              <button onClick={() => setShowFilter(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="posts">
        {isLoading ? (
          Array(8)
            .fill(null)
            .map((_, index) => <PostSkeleton key={index} />)
        ) : posts.length > 0 ? (
          posts.map((post) => (
              <div key={post.id} className="post" onClick={() => navigate(`/posts/${post.id}`)}>
                <div className="post-image">
                  <img src={post.fileUrls[0] || 'placeholder.png'} alt="Post" />
                </div>
                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag.name}</span>
                    ))}
                  </div>
                  <p className="post-description">{post.description}</p>
                  <div className="post-footer">
                    <button
                      className={`like-button ${post.isLiked ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation(); // ✅ ป้องกันไม่ให้คลิกไลค์ไปกระทบ layer บนสุด
                        handleLike(post.id);
                      }}
                    >
                      <i className={`fa-${post.isLiked ? 'solid' : 'regular'} fa-heart`}></i>
                      <span>{post.likeCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="no-results">
            <h3>No posts found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;