import React from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import '../../styles/components/ProjectComponents.css';

const ApplicationsList = ({ applications, projectId, onUpdate }) => {
    const { showSuccess, showError } = useToast();
    const pending = applications?.filter(a => a.status === 'pending') || [];

    const handleDecision = async (applicationId, action) => {
        try {
            await api.post('/projects/handle-application', {
                applicationId,
                projectId,
                userId: applications.find(a => a.id === applicationId).user_id,
                action: action === 'approved' ? 'approve' : 'reject'
            });
            showSuccess(action === 'approved' ? 'הבקשה אושרה בהצלחה!' : 'הבקשה נדחתה');
            onUpdate();
        } catch { showError('שגיאה בעדכון הבקשה'); }
    };

    return (
        <div className="applications-list">
            <h3>בקשות הצטרפות ממתינות ({pending.length})</h3>
            {pending.length === 0 && <p className="empty-state">אין בקשות ממתינות</p>}
            {pending.map(app => (
                <div key={app.id} className="application-card">
                    <p><strong>משתמש:</strong> {app.user_name}</p>
                    <p><strong>למה מתאים:</strong> {app.reason}</p>
                    <p><strong>ניסיון:</strong> {app.experience}</p>
                    {app.portfolio && <p><a href={app.portfolio} target="_blank" rel="noreferrer">🔗 תיק עבודות</a></p>}
                    <div className="application-actions">
                        <button className="btn btn-success btn-sm" onClick={() => handleDecision(app.id, 'approved')}>אשר ✅</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDecision(app.id, 'rejected')}>דחה ❌</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApplicationsList;
