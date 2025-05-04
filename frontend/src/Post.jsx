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
            <>
            <div className="post-images">
                {post.fileUrls.map((url, index) => (
                <img key={index} src={url} alt={`Post ${index}`} onClick={() => openLightbox(index)} />
                ))}
            </div>
            <h1>{post.title}</h1>
            <p>{post.tags.map((tag) => `#${tag.name}`).join(' ')}</p>
            <p>{post.description}</p>
            <button onClick={handleSavePost} className="save-button">
                {isSaved ? 'Unsave post' : 'Save post'}
            </button>
            <button onClick={() => setShowReportForm(true)} className="report-button">Report</button>
            {isOwner && (
                <>
                <button onClick={handleEdit}>Edit</button>
                <button onClick={handleDeletePost} className="delete-button">Delete</button>
                </>
            )}
            </>
        )}
        {showReportForm && (
            <div className="report-form">
            <h2>Report post</h2>
            <form onSubmit={handleReportSubmit}>
                <div>
                <label>
                    <input
                    type="checkbox"
                    value="Spam"
                    checked={reportReason === 'Spam'}
                    onChange={() => setReportReason('Spam')}
                    />
                    Spam
                </label>
                </div>
                <div>
                <label>
                    <input
                    type="checkbox"
                    value="Inappropriate Content"
                    checked={reportReason === 'Inappropriate Content'}
                    onChange={() => setReportReason('Inappropriate Content')}
                    />
                    Inappropriate Content
                </label>
                </div>
                <div>
                <label>
                    <input
                    type="checkbox"
                    value="Misinformation"
                    checked={reportReason === 'Misinformation'}
                    onChange={() => setReportReason('Misinformation')}
                    />
                    Misinformation
                </label>
                </div>
                <div>
                <label>
                    <input
                    type="checkbox"
                    value="Other"
                    checked={reportReason === 'Other'}
                    onChange={() => setReportReason('Other')}
                    />
                    Other
                </label>
                </div>
                <textarea
                placeholder="Add more details (Optional)"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                />
                <button type="submit">Submit</button>
                <button type="button" onClick={() => setShowReportForm(false)}>Cancel</button>
            </form>
            </div>
        )}
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