import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.isAdmin) {
          navigate('/login'); // เปลี่ยนเส้นทางไปหน้า Login
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login'); // เปลี่ยนเส้นทางไปหน้า Login หากเกิดข้อผิดพลาด
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user')); // เพิ่มการดึง storedUser
        const response = await axios.get('http://localhost:5000/api/admin/reported-posts', {
          headers: {
            'user-id': storedUser.id, // ส่ง userId ใน headers
          },
        });
        setReports(response.data);
      } catch (error) {
        console.error('Error fetching reported posts:', error);
      }
    };

    fetchReports();
  }, []);

  const handleApprove = async (postId) => {
    const confirmApprove = window.confirm('Are you sure you want to approve this post?');
    if (!confirmApprove) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      await axios.post('http://localhost:5000/api/admin/delete-post', {
        postId,
        userId: storedUser.id,
      });
      setReports(reports.filter((report) => report.post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleReject = async (reportId) => {
    const confirmReject = window.confirm('Are you sure you want to reject this report?');
    if (!confirmReject) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      await axios.post('http://localhost:5000/api/admin/reject-report', {
        reportId,
        userId: storedUser.id,
      });
      setReports(reports.filter((report) => report.id !== reportId));
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  };

  return (
    <div className="admin">
      <h1>Reported posts</h1>
      <table>
        <thead>
          <tr>
            <th>Post</th>
            <th>Username</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
            {reports.map((report) => (
                <tr key={report.id}>
                <td>
                    <img src={report.post.fileUrls[0] || 'placeholder.png'} alt="Post" />
                </td>
                <td>{report.reporter.name}</td>
                <td>
                    {report.reason}
                    {report.details && ` - ${report.details}`} {/* แสดง details ถ้ามี */}
                </td>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
                <td>
                    <button onClick={() => handleApprove(report.post.id)} className="approve-button">
                    Approve
                    </button>
                    <button onClick={() => handleReject(report.id)} className="reject-button">
                    Reject
                    </button>
                </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;