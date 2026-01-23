import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { login as apiLogin, register as apiRegister } from '../services/authService';
import GlassCard from '../components/GlassCard';
import loginVideo from '../assets/login_signup.mp4';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('user'); // 'user' or 'banker'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await apiLogin(formData.email, formData.password);

        // Update context with user data
        await login({
          userId: response.userId,
          email: response.email,
          role: response.role,
          name: response.email.split('@')[0]
        });

        // Navigate to main page
        navigate('/main', {
          state: {
            userType: response.role === 'ADMIN' ? 'banker' : 'user',
            email: response.email
          }
        });
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match!");
          setIsLoading(false);
          return;
        }

        const response = await apiRegister(
          formData.username || formData.email.split('@')[0],
          formData.email,
          formData.password,
          userType === 'banker' ? 'ADMIN' : 'USER'
        );

        // Update context with user data
        await login({
          userId: response.userId,
          email: response.email,
          role: response.role,
          name: formData.username || formData.email.split('@')[0]
        });

        // Navigate to main page
        navigate('/main', {
          state: {
            userType: 'user',
            email: response.email
          }
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setError('');
  };

  return (
    <div className="login-container">
      {/* Video Background */}
      <div className="video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="bg-video"
        >
          <source src={loginVideo} type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Decorative orbs */}
      <div className="login-background-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <GlassCard className="login-card">
        <h1 className="text-gradient login-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="login-subtitle">
          {isLogin ? 'Access your premium portfolio' : 'Join the future of finance'}
        </p>

        {/* User Type Toggle */}
        <div className="user-type-toggle">
          <button
            className={`type-btn ${userType === 'user' ? 'active' : ''}`}
            onClick={() => setUserType('user')}
            disabled={isLoading}
          >
            User
          </button>
          <button
            className={`type-btn ${userType === 'banker' ? 'active' : ''}`}
            onClick={() => setUserType('banker')}
            disabled={isLoading}
          >
            Banker
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="Full Name"
                value={formData.username}
                onChange={handleChange}
                required
                className="glass-input"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="glass-input"
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="glass-input"
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="glass-input"
                disabled={isLoading}
              />
            </div>
          )}

          {isLogin && (
            <div className="forgot-password-container">
              <span className="forgot-password-link">Forgot Password?</span>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        {/* Demo Credentials Hint */}


        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              className="text-gradient toggle-link"
              onClick={toggleMode}
            >
              {isLogin ? 'Join Now' : 'Sign In'}
            </span>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default Login;
