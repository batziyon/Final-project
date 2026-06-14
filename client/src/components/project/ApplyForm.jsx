// ApplyForm.jsx
import React, { useState } from 'react';
import '../../styles/components/ProjectComponents.css';

const ApplyForm = ({ onApplySubmit, roles = [] }) => {
    const openRoles = roles.filter(r => r.status === 'open');
    const [selectedRole, setSelectedRole] = useState('');
    const [formData, setFormData] = useState({ reason: '', experience: '', portfolio: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onApplySubmit({ ...formData, selectedRole });
            setFormData({ reason: '', experience: '', portfolio: '' });
            setSelectedRole('');
        } catch (err) { console.error(err); }
        finally { setIsSubmitting(false); }
    };

    if (openRoles.length === 0) return (
        <div className="no-roles-box">😔 אין כרגע תפקידים פתוחים בפרויקט זה.</div>
    );

    return (
        <form onSubmit={handleSubmit} className="apply-form">
            <div className="form-group">
                <label>תפקידים פתוחים בפרויקט:</label>
                <div className="roles-selector">
                    {openRoles.map(role => (
                        <button type="button" key={role.id}
                            className={`role-btn ${selectedRole === role.role_name ? 'active' : ''}`}
                            onClick={() => setSelectedRole(role.role_name)}>
                            {role.role_name}
                        </button>
                    ))}
                </div>
                {!selectedRole && <small className="role-required">יש לבחור תפקיד</small>}
            </div>
            <div className="form-group">
                <label htmlFor="reason">למה אתה מתאים לפרויקט?</label>
                <textarea id="reason" className="form-input" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required style={{ height: 80, resize: 'none' }} />
            </div>
            <div className="form-group">
                <label htmlFor="experience">ניסיון קודם</label>
                <textarea id="experience" className="form-input" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} required style={{ height: 80, resize: 'none' }} />
            </div>
            <div className="form-group">
                <label htmlFor="portfolio">קישור לתיק עבודות / לינקדאין</label>
                <input id="portfolio" type="text" className="form-input" value={formData.portfolio} onChange={e => setFormData({ ...formData, portfolio: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedRole}>
                {isSubmitting ? 'שולח...' : 'שלח בקשת הצטרפות'}
            </button>
        </form>
    );
};

export default ApplyForm;
