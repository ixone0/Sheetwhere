import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import { Link } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/user/register', {
        email,
        password,
        confirmPassword,
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <Link to="/" className="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" className="stroke-current">
            <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" d="M11 6L5 12M5 12L11 18M5 12H19"></path>
          </svg>
        </Link>
        <h1>Register</h1>
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Example@dome.tu.ac.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Register</button>
        </form>
        {message && <p>{message}</p>}
        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;