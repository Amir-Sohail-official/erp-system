import React from 'react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClass =
    variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'ghost'
        ? 'btn-ghost'
        : variant === 'danger'
          ? 'btn-danger'
          : 'btn-primary';

  return (
    <button className={`erp-btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <label className="erp-field">
      {label ? <span className="erp-field-label">{label}</span> : null}
      <input className={`erp-input ${error ? 'is-invalid' : ''}`.trim()} {...props} />
      {error ? <span className="erp-field-error">{error}</span> : null}
    </label>
  );
}

export function Select({ label, options = [], error, ...props }) {
  return (
    <label className="erp-field">
      {label ? <span className="erp-field-label">{label}</span> : null}
      <select className={`erp-input ${error ? 'is-invalid' : ''}`.trim()} {...props}>
        {options.map((option) => (
          <option key={option.value ?? option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="erp-field-error">{error}</span> : null}
    </label>
  );
}

export function Card({ title, subtitle, action, children, className = '', headerClassName = '' }) {
  return (
    <section className={`erp-card ${className}`.trim()}>
      {(title || subtitle || action) && (
        <div className={`erp-card-header ${headerClassName}`.trim()}>
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`erp-badge badge-${tone}`}>{children}</span>;
}

export function Loading({ message = 'Loading...' }) {
  return (
    <div className="erp-loading" role="status" aria-live="polite">
      <span className="erp-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function Skeleton({ lines = 3, className = '' }) {
  return (
    <div className={`erp-skeleton ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} className="erp-skeleton-line" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="erp-empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description = 'Please try again shortly.' }) {
  return (
    <div className="erp-error-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function Table({ columns = [], rows = [], emptyTitle = 'No records available', emptyDescription = 'There are no records to display right now.', onRowClick }) {
  if (!rows.length) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="erp-table-wrapper">
      <table className="erp-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              {...(onRowClick
                ? {
                  onClick: () => onRowClick(row, rowIndex),
                  style: { cursor: 'pointer' },
                }
                : {})}
            >
              {columns.map((column) => (
                <td key={`${row.id ?? rowIndex}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="erp-modal-backdrop" onClick={onClose}>
      <div className="erp-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="erp-modal-header">
          <h3>{title}</h3>
          <button type="button" className="erp-icon-btn" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className="erp-modal-body">{children}</div>
        {footer ? <div className="erp-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={
      <>
        <Button type="button" variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button type="button" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }>
      <p className="erp-confirm-text">{description}</p>
    </Modal>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="erp-pagination">
      <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
