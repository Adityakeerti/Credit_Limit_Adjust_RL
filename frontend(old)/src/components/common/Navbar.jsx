import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useApp()

  const handleLogout = () => {
    updateUser({ role: null })
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-icon">💰</div>
          <span className="brand-text">Fintech Platform</span>
        </div>
        
        <div className="navbar-right">
          {user && user.name && (
            <div className="user-profile">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="user-name">{user.name}</span>
            </div>
          )}
          
          {user && user.role && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

