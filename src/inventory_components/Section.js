import React from 'react';
import './Section.css';

function Section({ title, children, button = null }) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">{title}</div>
        {button}
      </div>
      {children}
    </div>
  );
}

export default Section;