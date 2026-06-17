import React from 'react'
import './Card.css'

const Card = ({ 
  children, 
  className = '', 
  onClick, 
  hover = false,
  padding = '1.5rem'
}) => {
  return (
    <div 
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      onClick={onClick}
      style={{ padding }}
    >
      {children}
    </div>
  )
}

export default Card

