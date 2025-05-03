import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

function Post() {
  const { id } = useParams(); // ดึง ID ของโพสต์จาก URL
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  
  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/home/posts/${id}`);
        console.log('Post data:', response.data);
        setPost(response.data);
        setComments(response.data.comments || []);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    const checkIfPostIsSaved = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) return;

      try {
        const response = await axios.get('http://localhost:5000/api/home/is-post-saved', {
          params: { userId: storedUser.id, postId: id },
        });
        setIsSaved(response.data.isSaved);
      } catch (error) {
        console.error('Error checking if post is saved:', error);
      }
    };

    checkIfPostIsSaved();
  }, [id]);

  // เพิ่มคอมเมนต์
  const handleAddComment = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      alert('Please log in to comment.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/home/posts/${id}/comments`, {
        content: comment,
        userId: storedUser.id,
        postId: id,
      });

      // เพิ่มข้อมูลผู้คอมเมนต์ลงในคอมเมนต์ใหม่
      const newComment = {
        ...response.data,
        author: {
          id: storedUser.id,
          name: storedUser.name, // ใช้ชื่อจาก localStorage
        },
      };

      setComments([...comments, newComment]); // อัปเดต state comments
      setComment(''); // ล้างช่องคอมเมนต์
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  // ลบคอมเมนต์
  const handleDeleteComment = async (commentId) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      alert('Please log in to delete comments.');
      return;
    }
  
    try {
      await axios.delete('http://localhost:5000/api/home/comments', {
        data: { commentId, userId: storedUser.id },
      });
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Handle saving a post
  const handleSavePost = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      alert('Please log in to save posts.');
      return;
    }

    try {
      if (isSaved) {
        // ยกเลิกการเซฟโพสต์
        await axios.post('http://localhost:5000/api/home/unsave-post', {
          userId: storedUser.id,
          postId: id,
        });
        setIsSaved(false);
        alert('Post unsaved successfully!');
      } else {
        // เซฟโพสต์
        await axios.post('http://localhost:5000/api/home/save-post', {
          userId: storedUser.id,
          postId: id,
        });
        setIsSaved(true);
        alert('Post saved successfully!');
      }
    } catch (error) {
      console.error('Error saving or unsaving post:', error);
      alert('Failed to save or unsave post.');
    }
  };

  if (!post) {
    console.log('Post is not loaded yet.');
    return <div>Loading...</div>;
  }

  return (
    <div className="post-detail">
      <button onClick={() => window.history.back()} className="back-button">←</button>
      <div className="post-images">
        {post.fileUrls.map((url, index) => (
          <img key={index} src={url} alt={`Post ${index}`} />
        ))}
      </div>
      <h1>{post.title}</h1>
      <p>{post.tags.map((tag) => `#${tag.name}`).join(' ')}</p>
      <p>{post.description}</p>
      <button onClick={handleSavePost} className="save-button">
        {isSaved ? 'Unsave post' : 'Save post'}
      </button>
      <div className="comments-section">
        <h2>Comments</h2>
        <div className="comments">
          {comments.map((c) => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const canDelete =
              storedUser &&
              (storedUser.id === c.authorId || // ผู้คอมเมนต์
               storedUser.id === post.authorId || // เจ้าของโพสต์
               storedUser.isAdmin); // แอดมิน

            return (
              <div key={c.id} className="comment">
                <p>
                  <strong>{c.author?.name || 'Unknown User'}:</strong> {c.content}
                </p>
                {canDelete && (
                  <button onClick={() => handleDeleteComment(c.id)}>Delete</button>
                )}
              </div>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Add a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleAddComment}>Add Comment</button>
      </div>
    </div>
  );
}

export default Post;