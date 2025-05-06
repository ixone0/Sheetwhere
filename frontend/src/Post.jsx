import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

function Post() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); // สำหรับเปิด/ปิด Lightbox
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // เก็บ index ของรูปภาพปัจจุบัน
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedImages, setEditedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1); // เก็บระดับการซูม

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.2, 3)); // ซูมเข้า (สูงสุด 3 เท่า)
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.2, 1)); // ซูมออก (ต่ำสุด 1 เท่า)
  };

  const resetZoom = () => {
    setZoomLevel(1); // รีเซ็ตการซูม
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/home/posts/${id}`);
        setPost(response.data);
        setComments(response.data.comments || []);

        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.id === response.data.authorId) {
          setIsOwner(true);
        }

        setEditedTitle(response.data.title);
        setEditedDescription(response.data.description);
        setEditedImages(response.data.fileUrls);
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

      const newComment = {
        ...response.data,
        author: {
          id: storedUser.id,
          name: storedUser.name,
        },
      };

      setComments([...comments, newComment]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

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

  const handleSavePost = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      alert('Please log in to save posts.');
      return;
    }

    try {
      if (isSaved) {
        await axios.post('http://localhost:5000/api/home/unsave-post', {
          userId: storedUser.id,
          postId: id,
        });
        setIsSaved(false);
        alert('Post unsaved successfully!');
      } else {
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

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      alert('Please log in to report posts.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/home/report-post', {
        userId: storedUser.id,
        postId: id,
        reason: reportReason,
        details: additionalDetails,
      });
      alert('Report submitted successfully!');
      setShowReportForm(false);
      setReportReason('');
      setAdditionalDetails('');
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Failed to submit report.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(post.title);
    setEditedDescription(post.description);
    setEditedImages(post.fileUrls);
    setNewImages([]);
  };

  const handleSaveEdit = async () => {
    try {
      const formData = new FormData();
      newImages.forEach((image) => formData.append('images', image));
  
      // อัปโหลดรูปภาพใหม่
      const uploadResponse = await axios.post('http://localhost:5000/api/home/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      const updatedImages = [...editedImages, ...uploadResponse.data.fileUrls];
  
      // อัปเดตโพสต์ในฐานข้อมูล
      await axios.put(`http://localhost:5000/api/home/posts/${id}`, {
        title: editedTitle,
        description: editedDescription,
        fileUrls: updatedImages,
      });
  
      // อัปเดต state ของ post และ editedImages
      setPost({ ...post, title: editedTitle, description: editedDescription, fileUrls: updatedImages });
      setEditedImages(updatedImages); // อัปเดต editedImages เพื่อให้แสดงรูปภาพใหม่ในฟอร์มแก้ไข
      setNewImages([]); // ล้าง newImages หลังจากอัปโหลดเสร็จ
      setIsEditing(false);
      alert('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post.');
    }
  };

  const handleDeletePost = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;
  
    try {
      const storedUser = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลผู้ใช้จาก localStorage
      if (!storedUser) {
        alert('Please log in to delete this post.');
        return;
      }
  
      await axios.delete(`http://localhost:5000/api/home/posts/${id}`, {
        data: { userId: storedUser.id }, // ส่ง userId ไปใน body ของคำขอ
      });
  
      alert('Post deleted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % post.fileUrls.length);
  };

  const showPreviousImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? post.fileUrls.length - 1 : prevIndex - 1
    );
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="post-detail">
        <button onClick={() => window.history.back()} className="back-button">←</button>
        {isEditing ? (
          <div className="edit-form">
            <h2>Edit Post</h2>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter the title of the post"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter the description of the post"
              />
            </div>
            <div className="form-group">
              <label>Current Images</label>
              <div className="edit-images">
                {editedImages.map((url, index) => (
                  <div key={index} className="image-preview">
                    <img src={url} alt={`Preview ${index}`} />
                    <button
                      onClick={() => setEditedImages(editedImages.filter((image) => image !== url))}
                      className="delete-image-button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="new-images">Add New Images</label>
              <input
                id="new-images"
                type="file"
                multiple
                onChange={(e) => setNewImages([...newImages, ...e.target.files])}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleSaveEdit} className="save-button">Save</button>
              <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
            </div>
          </div>
        ) : (
            <div className="post-content">
                <div className="post-images">
                    {post.fileUrls.map((url, index) => (
                        <img key={index} src={url} alt={`Post ${index}`} onClick={() => openLightbox(index)} />
                    ))}
                </div>
                <h1>{post.title}</h1>
                <div className="tags">
                    {post.tags.map((tag) => `#${tag.name}`).join(' ')}
                </div>
                <p>{post.description}</p>
                <div className="action-buttons">
                    <button 
                        onClick={handleSavePost} 
                        className={`save-button ${isSaved ? 'saved' : ''}`}
                    >
                        <i className={`fas ${isSaved ? 'fa-bookmark' : 'fa-bookmark-o'}`}></i>
                        {isSaved ? 'Unsave post' : 'Save post'}
                    </button>
                    <button onClick={() => setShowReportForm(true)} className="report-button">
                        <i className="fas fa-flag"></i>
                        Report
                    </button>
                    {isOwner && (
                        <>
                        <button onClick={handleEdit}>Edit</button>
                        <button onClick={handleDeletePost} className="delete-button">Delete</button>
                        </>
                    )}
                </div>
                <div className="comments-section">
                    <h2>Comments</h2>
                    <div className="comments">
                        {comments.map((c) => {
                            const storedUser = JSON.parse(localStorage.getItem('user'));
                            const canDelete =
                                storedUser &&
                                (storedUser.id === c.authorId ||
                                    storedUser.id === post.authorId ||
                                    storedUser.isAdmin);

                            return (
                                <div key={c.id} className="comment">
                                    <p>
                                        <strong>{c.author?.name || 'Unknown User'}</strong>
                                        <span className="comment-content">{c.content}</span>
                                    </p>
                                    {canDelete && (
                                        <button className="delete-comment-button" onClick={() => handleDeleteComment(c.id)}>
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="comment-form">
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Write a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <button className="comment-submit" onClick={handleAddComment}>
                            <i className="fa-solid fa-paper-plane"></i> Comment
                        </button>
                    </div>
                </div>
            </div>
        )}
        {showReportForm && (
            <div className="report-modal-overlay">
                <div className="report-form">
                    <button className="close-button" onClick={() => setShowReportForm(false)}>×</button>
                    <h2>Report Post</h2>
                    <form onSubmit={handleReportSubmit}>
                        <div className="report-options">
                            <div className="report-option">
                                <input
                                    type="radio"
                                    id="spam"
                                    name="reportReason"
                                    value="Spam"
                                    checked={reportReason === 'Spam'}
                                    onChange={(e) => setReportReason(e.target.value)}
                                />
                                <label htmlFor="spam">Spam</label>
                            </div>
                            <div className="report-option">
                                <input
                                    type="radio"
                                    id="inappropriate"
                                    name="reportReason"
                                    value="Inappropriate Content"
                                    checked={reportReason === 'Inappropriate Content'}
                                    onChange={(e) => setReportReason(e.target.value)}
                                />
                                <label htmlFor="inappropriate">Inappropriate Content</label>
                            </div>
                            <div className="report-option">
                                <input
                                    type="radio"
                                    id="misinformation"
                                    name="reportReason"
                                    value="Misinformation"
                                    checked={reportReason === 'Misinformation'}
                                    onChange={(e) => setReportReason(e.target.value)}
                                />
                                <label htmlFor="misinformation">Misinformation</label>
                            </div>
                            <div className="report-option">
                                <input
                                    type="radio"
                                    id="other"
                                    name="reportReason"
                                    value="Other"
                                    checked={reportReason === 'Other'}
                                    onChange={(e) => setReportReason(e.target.value)}
                                />
                                <label htmlFor="other">Other</label>
                            </div>
                        </div>
                        <textarea
                            placeholder="Additional details (Optional)"
                            value={additionalDetails}
                            onChange={(e) => setAdditionalDetails(e.target.value)}
                        />
                        <div className="button-group">
                            <button type="button" className="cancel-button" onClick={() => setShowReportForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-button">
                                Submit Report
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {isLightboxOpen && (
            <div className="lightbox">
            <button className="close-button" onClick={() => { closeLightbox(); resetZoom(); }}>X</button>
            <button className="prev-button" onClick={showPreviousImage}>❮</button>
            <div className="lightbox-image-container">
              <img
                src={post.fileUrls[currentImageIndex]}
                alt={`Post ${currentImageIndex}`}
                style={{ transform: `scale(${zoomLevel})` }} // ใช้การซูม
              />
            </div>
            <button className="next-button" onClick={showNextImage}>❯</button>
            <div className="zoom-controls">
              <button onClick={handleZoomIn}>+</button>
              <button onClick={handleZoomOut}>-</button>
              <button onClick={resetZoom}>Reset</button>
            </div>
            </div>
        )}
    </div>
  );
}

export default Post;