import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common';
import UserAvatar from '../common/UserAvatar';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import '../../styles/components/ProjectComponents.css';

const roleLabel = { creator: '👑 יוצר', admin: '👮 מנהל' };

const ApplicationsList = ({ applications, projectId, onUpdate }) => {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [viewingProfile, setViewingProfile] = useState(null);
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

    const openProfile = async (app) => {
        if (String(user?.role).toLowerCase() === 'admin') {
            navigate(`/admin/user/${app.user_id}`);
            return;
        }
        try {
            const res = await api.get(`/auth/candidate/${app.user_id}`);
            setViewingProfile({ ...res.data, applicationId: app.id });
        } catch (err) {
            showError(err.response?.data?.message || 'שגיאה בטעינת הפרופיל');
        }
    };

    if (viewingProfile) {
        return (
            <div className="candidate-profile-view">
                <div className="candidate-profile-back">
                    <Button variant="secondary" size="sm" onClick={() => setViewingProfile(null)}>⬅️ חזרה לבקשות</Button>
                </div>
                <div className="candidate-profile-card">
                    <div className="candidate-header">
                        <UserAvatar username={viewingProfile.username} image={viewingProfile.profile_image} size={64} />
                        <div>
                            <h3>{viewingProfile.username}</h3>
                            <span className="candidate-role-tag">{roleLabel[viewingProfile.role] || viewingProfile.role}</span>
                            {viewingProfile.created_at && (
                                <p className="candidate-joined">הצטרף: {new Date(viewingProfile.created_at).toLocaleDateString('he-IL')}</p>
                            )}
                        </div>
                    </div>

                    {viewingProfile.bio && (
                        <div className="candidate-section">
                            <label>קצת עליי</label>
                            <p>{viewingProfile.bio}</p>
                        </div>
                    )}

                    {viewingProfile.skills?.length > 0 && (
                        <div className="candidate-section">
                            <label>כישורים</label>
                            <div className="profile-skills">
                                {viewingProfile.skills.map((s, i) => (
                                    <span key={i} className="skill-tag">{s.startsWith('אחר:') ? s.replace('אחר:', '') : s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="candidate-stats">
                        <div className="candidate-stat">
                            <span className="stat-num">{viewingProfile.projects?.length || 0}</span>
                            <span className="stat-label">פרויקטים</span>
                        </div>
                        <div className="candidate-stat">
                            <span className="stat-num">{viewingProfile.active_projects || 0}</span>
                            <span className="stat-label">פעילים</span>
                        </div>
                    </div>

                    {viewingProfile.projects?.length > 0 && (
                        <div className="candidate-section">
                            <label>📁 פרויקטים ({viewingProfile.projects.length})</label>
                            <div className="profile-projects-list">
                                {viewingProfile.projects.map(p => (
                                    <div key={p.id} className="profile-project-item">
                                        <span className="profile-project-title">{p.title}</span>
                                        <div className="profile-project-meta">
                                            <span className="skill-tag">{p.status}</span>
                                            <span className="skill-tag">{p.relation === 'owner' ? '👑 בעלים' : '👥 חבר'}</span>
                                            <span className="skill-tag">👤 {p.member_count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="applications-list">
            <h3>בקשות הצטרפות ממתינות ({pending.length})</h3>
            {pending.length === 0 && <p className="empty-state">אין בקשות ממתינות</p>}
            {pending.map(app => (
                <div key={app.id} className="application-card">
                    <div className="application-card-header">
                        <UserAvatar username={app.username} image={app.profile_image} size={40} />
                        <div>
                            <strong>{app.username}</strong>
                            {app.user_role && <span className="candidate-role-tag">{roleLabel[app.user_role] || app.user_role}</span>}
                        </div>
                    </div>
                    {app.created_at && (
                        <p className="app-date">📅 {new Date(app.created_at).toLocaleDateString('he-IL')}</p>
                    )}
                    <p><strong>למה מתאים:</strong> {app.reason}</p>
                    <p><strong>ניסיון:</strong> {app.experience}</p>
                    {app.portfolio && <p><a href={app.portfolio} target="_blank" rel="noreferrer">🔗 תיק עבודות</a></p>}
                    <div className="application-actions">
                        <Button variant="secondary" size="sm" onClick={() => openProfile(app)}>👤 צפה בפרופיל</Button>
                        <button className="btn btn-success btn-sm" onClick={() => handleDecision(app.id, 'approved')}>אשר ✅</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDecision(app.id, 'rejected')}>דחה ❌</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApplicationsList;
