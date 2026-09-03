import React from 'react';

export function Topbar({ user, onLogout, onToggleSidebar }) {
  return (
    <header className="erp-topbar">
      <div className="erp-topbar-left">
        <button type="button" className="erp-mobile-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
          ☰
        </button>
        <div>
          <p className="erp-topbar-label">Operations</p>
          <h1>ERP Console</h1>
        </div>
      </div>

      <div className="erp-topbar-right">
        <div className="erp-user-pill">
          <div className="erp-user-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user?.name || 'User'}</strong>
            <span>{user?.role?.name || 'No role'}</span>
          </div>
        </div>

        <button type="button" className="erp-btn btn-ghost" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
