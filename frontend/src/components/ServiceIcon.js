import React from 'react';

const ServiceIcon = ({ iconName, iconFile, size = 48, className = '', forceRefresh = false }) => {
  // If there's an uploaded icon file, display it
  if (iconFile) {
    let filename;
    
    // Handle different path formats
    if (iconFile.includes('\\')) {
      // Full path with backslashes: "uploads\\service-icons\\service-icon-123.jpg"
      // or "D:\\justice\\backend\\uploads\\service-icons\\service-icon-123.jpg"
      filename = iconFile.split(/[/\\]/).pop();
    } else if (iconFile.includes('/')) {
      // Full path with forward slashes: "uploads/service-icons/service-icon-123.jpg"
      // or "D:/justice/backend/uploads/service-icons/service-icon-123.jpg"
      filename = iconFile.split(/[/\\]/).pop();
    } else {
      // Just filename: "service-icon-123.jpg"
      filename = iconFile;
    }
    
    const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
    const iconUrl = iconFile.startsWith('http') 
      ? iconFile // Already a URL
      : `http://localhost:5000/uploads/service-icons/${filename}${cacheBuster}`; // Construct URL for frontend
    
    return (
      <img 
        src={iconUrl}
        alt={iconName || 'Service Icon'}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          display: 'inline-block',
          objectFit: 'contain',
          borderRadius: '8px'
        }} 
        className={className}
        onError={(e) => {
          // Simple fallback - show placeholder text
          e.target.style.display = 'none';
          const parent = e.target.parentElement;
          if (!parent.dataset.placeholderAdded) {
            parent.innerHTML += `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#f8f9fa;border:2px solid #e9ecef;border-radius:50%;font-size:${size/2}px;color:#6c757d;">⚖️</div>`;
            parent.dataset.placeholderAdded = 'true';
          }
        }}
      />
    );
  }
  
  // If no uploaded file, show placeholder with legal icon
  return (
    <div 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        border: '2px solid #e9ecef',
        borderRadius: '50%',
        fontSize: `${size/2}px`,
        color: '#6c757d'
      }} 
      className={className}
    >
      ⚖️
    </div>
  );
};

export default ServiceIcon;