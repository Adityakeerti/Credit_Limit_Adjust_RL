import React from 'react';

const GlassCard = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`glass-card ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        transition: 'all 0.3s ease',
        ...(hoverEffect ? { cursor: 'pointer' } : {})
      }}
      onMouseEnter={(e) => {
        if (hoverEffect) {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverEffect) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.2)';
           e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        }
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
