import React, { useEffect } from 'react';
import '../../styles/components/common.css';
export { default as UserAvatar } from './UserAvatar';

export const Button = ({ children, variant = 'primary', size = '', full = false, className = '', loading = false, ...props }) => (
    <button
        className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${full ? 'btn-full' : ''} ${className}`}
        disabled={loading || props.disabled}
        {...props}
    >
        {loading ? <span className="loader loader-sm" style={{ borderTopColor: 'white' }} /> : children}
    </button>
);

export const Input = ({ label, error, hint, className = '', as: Tag = 'input', ...props }) => (
    <div className="field">
        {label && <label className="field-label">{label}</label>}
        <Tag className={`field-input ${error ? 'error' : ''} ${className}`} {...props} />
        {error && <span className="field-error">{error}</span>}
        {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
);

export const Card = ({ children, hoverable = false, className = '', onClick }) => (
    <div className={`card ${hoverable ? 'card-hover' : ''} ${className}`} onClick={onClick}>
        {children}
    </div>
);
Card.Body   = ({ children, className = '' }) => <div className={`card-body ${className}`}>{children}</div>;
Card.Header = ({ children, className = '' }) => <div className={`card-header ${className}`}>{children}</div>;
Card.Footer = ({ children, className = '' }) => <div className={`card-footer ${className}`}>{children}</div>;

export const Badge = ({ children, variant = 'primary', className = '' }) => (
    <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

export const Avatar = ({ src, alt = '', size = 'md', bordered = false, fallback }) => {
    const cls = `avatar avatar-${size} ${bordered ? 'avatar-bordered' : ''}`;
    if (src) return <img src={src} alt={alt} className={cls} />;
    return <span className={cls}>{fallback || alt?.charAt(0)?.toUpperCase() || '?'}</span>;
};

export const Loader = ({ size = '', text = '' }) => (
    <div className="loader-wrapper">
        <div style={{ textAlign: 'center' }}>
            <div className={`loader ${size ? `loader-${size}` : ''}`} />
            {text && <p className="loader-text">{text}</p>}
        </div>
    </div>
);

export const EmptyState = ({ icon = '📭', title = 'אין תוצאות', description = '', action }) => (
    <div className="empty-state">
        <span className="empty-state-icon">{icon}</span>
        <p className="empty-state-title">{title}</p>
        {description && <p className="empty-state-desc">{description}</p>}
        {action}
    </div>
);

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <span>{title}</span>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
};
