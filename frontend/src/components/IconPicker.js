import React, { useState } from 'react';

// Unicode symbols for icon selection
const legalIcons = [
  { name: 'Gavel', symbol: '⚖️', category: 'Legal' },
  { name: 'Balance', symbol: '⚖️', category: 'Legal' },
  { name: 'AccountBalance', symbol: '🏛️', category: 'Legal' },
  { name: 'Policy', symbol: '📋', category: 'Legal' },
  { name: 'VerifiedUser', symbol: '✅', category: 'Legal' },
  { name: 'Security', symbol: '🔒', category: 'Legal' }
];

const businessIcons = [
  { name: 'Business', symbol: '💼', category: 'Business' },
  { name: 'Work', symbol: '💼', category: 'Business' },
  { name: 'Handshake', symbol: '🤝', category: 'Business' },
  { name: 'Apartment', symbol: '🏢', category: 'Business' },
  { name: 'Domain', symbol: '🌐', category: 'Business' },
  { name: 'RealEstateAgent', symbol: '🏠', category: 'Business' }
];

const documentIcons = [
  { name: 'Description', symbol: '📄', category: 'Document' },
  { name: 'Assignment', symbol: '📋', category: 'Document' },
  { name: 'FolderSpecial', symbol: '📁', category: 'Document' },
  { name: 'LibraryBooks', symbol: '📚', category: 'Document' },
  { name: 'Checklist', symbol: '✅', category: 'Document' },
  { name: 'FactCheck', symbol: '✔️', category: 'Document' }
];

const serviceIcons = [
  { name: 'Support', symbol: '💬', category: 'Service' },
  { name: 'Groups', symbol: '👥', category: 'Service' },
  { name: 'FamilyRestroom', symbol: '👨‍👩‍👧‍👦', category: 'Service' },
  { name: 'School', symbol: '🎓', category: 'Service' },
  { name: 'HealthAndSafety', symbol: '⚕️', category: 'Service' },
  { name: 'LocalHospital', symbol: '🏥', category: 'Service' }
];

const financeIcons = [
  { name: 'AttachMoney', symbol: '💰', category: 'Finance' },
  { name: 'CreditCard', symbol: '💳', category: 'Finance' },
  { name: 'Savings', symbol: '💰', category: 'Finance' },
  { name: 'TrendingUp', symbol: '📈', category: 'Finance' },
  { name: 'Analytics', symbol: '📊', category: 'Finance' }
];

const otherIcons = [
  { name: 'Home', symbol: '🏠', category: 'Other' },
  { name: 'Car', symbol: '🚗', category: 'Other' },
  { name: 'TravelExplore', symbol: '🔍', category: 'Other' },
  { name: 'Assessment', symbol: '📝', category: 'Other' }
];

const IconPicker = ({ selectedIcon, onIconSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allIcons = [...legalIcons, ...businessIcons, ...documentIcons, ...serviceIcons, ...financeIcons, ...otherIcons];

  const filteredIcons = allIcons.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedIconSymbol = () => {
    const icon = allIcons.find(i => i.name === selectedIcon);
    return icon ? icon.symbol : '⚖️';
  };

  const iconCategories = [
    { name: 'Legal', icons: legalIcons },
    { name: 'Business', icons: businessIcons },
    { name: 'Document', icons: documentIcons },
    { name: 'Service', icons: serviceIcons },
    { name: 'Finance', icons: financeIcons },
    { name: 'Other', icons: otherIcons }
  ];

  return (
    <div className="icon-picker">
      <label className="form-label">Service Icon *</label>
      <div className="icon-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="selected-icon">{getSelectedIconSymbol()}</span>
        <span>{selectedIcon || 'Select an icon'}</span>
        <div className="icon-picker-arrow">▼</div>
      </div>

      {isOpen && (
        <div className="icon-picker-dropdown">
          <div className="icon-search">
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="icon-search-input"
            />
          </div>

          {searchTerm ? (
            <div className="icon-category">
              <h4>Search Results</h4>
              <div className="icon-grid">
                {filteredIcons.map((icon) => (
                  <div
                    key={icon.name}
                    className={`icon-option ${selectedIcon === icon.name ? 'selected' : ''}`}
                    onClick={() => {
                      onIconSelect(icon.name);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    title={icon.name}
                  >
                    {icon.symbol}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            iconCategories.map((category) => (
              <div key={category.name} className="icon-category">
                <h4>{category.name}</h4>
                <div className="icon-grid">
                  {category.icons.map((icon) => (
                    <div
                      key={icon.name}
                      className={`icon-option ${selectedIcon === icon.name ? 'selected' : ''}`}
                      onClick={() => {
                        onIconSelect(icon.name);
                        setIsOpen(false);
                      }}
                      title={icon.name}
                    >
                      {icon.symbol}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default IconPicker;
