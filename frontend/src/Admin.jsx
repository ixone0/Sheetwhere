import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Admin.css';
import NavigationBar from './components/NavigationBar';

function Admin() {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.isAdmin) {
          navigate('/login');
          return;
        }
        setUser(storedUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login');
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const response = await axios.get('http://localhost:5000/api/admin/reported-posts', {
          headers: {
            'user-id': storedUser.id,
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
      <NavigationBar 
        user={user}
        setUser={setUser}
        showSearch={false}
      />
      <div className="admin-content">
        <h1>Reported posts</h1>
        <table className="admin-table">
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
                  <Link to={`/posts/${report.post.id}`}>
                    <img src={report.post.fileUrls[0] || 'placeholder.png'} alt="Post" />
                  </Link>
                </td>
                <td>{report.reporter.name}</td>
                <td>
                  {report.reason}
                  {report.details && ` - ${report.details}`}
                </td>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleApprove(report.post.id)}
                    className="admin-button admin-approve-button"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(report.id)}
                    className="admin-button admin-reject-button"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;