import React from 'react';

import { Badge } from './ui.jsx';

export function Sidebar({ items, activeItem, onSelect, user, mobileOpen, onClose }) {
  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <aside className={`erp-sidebar ${mobileOpen ? 'is-open' : ''}`.trim()}>
      <div className="erp-sidebar-header">
        <div>
          <p className="erp-brand-kicker">ERP</p>
          <h2>System</h2>
        </div>
        <button type="button" className="erp-sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ×
        </button>
      </div>

      <nav className="erp-sidebar-nav" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const isActive = item.id === activeItem;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              type="button"
              className={`erp-nav-item ${isActive ? 'is-active' : ''} ${isDisabled ? 'is-disabled' : ''}`.trim()}
              onClick={() => !isDisabled && onSelect(item.id)}
              disabled={isDisabled}
              title={isDisabled ? 'Coming in a future increment' : item.label}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <Badge tone="neutral">{item.badge}</Badge> : null}
            </button>
          );
        })}
      </nav>

      <div className="erp-sidebar-user-box">
        <p className="erp-sidebar-user-name">{user?.name || 'Guest User'}</p>
        <p className="erp-sidebar-user-role">{user?.role?.name || 'Role not loaded'}</p>
      </div>
    </aside>
  );
}
