import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectForm from '../components/project/ProjectForm';
import UserAvatar from '../components/common/UserAvatar';
import api from '../services/api';
import '../styles/pages/Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const profileFields = [user?.bio, user?.skills?.length, user?.profile_image !== 'default_profile.png'];
    const profileComplete = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await api.get('/projects/dashboard-stats');
            setStats(res.data);
        } catch (err) {
            console.error('שגיאה בטעינת דשבורד', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    const handleCreateProject = async (formData) => {
        try {
            await api.post('/projects/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowForm(false);
            showSuccess('הפרויקט פורסם בהצלחה!');
            fetchDashboard();
        } catch {
            showError('שגיאה בפרסום הפרויקט');
        }
    };

    if (loading) return <div className="db-loading">טוען...</div>;

    const hasImage = user?.profile_image && user.profile_image !== 'default_profile.png';
    const profileImageUrl = hasImage ? user.profile_image : null;

    return (
        <div className="db-wrapper">
            {String(user?.role).toLowerCase() === 'admin' && (
                <div className="db-admin-banner">
                    <div>
                        <h3>⭐ שלום מנהל מערכת</h3>
                        <p>יש לך גישה מלאה ללוח הניהול. לחץ למטה כדי לעבור למסך הניהול.</p>
                    </div>
                    <button className="db-btn-secondary" onClick={() => navigate('/admin')}>לוח ניהול</button>
                </div>
            )}
            <div className="db-header">
                <div className="db-header-right">
                    <UserAvatar username={user?.username} image={profileImageUrl} size={60} className="db-avatar" />
                    <div className="db-header-info">
                        <h2>שלום, {user?.username} 👋</h2>
                        <div className="db-progress-bar">
                            <div className="db-progress-fill" style={{ width: `${profileComplete}%` }} />
                        </div>
                        <small className="db-progress-text">השלמת פרופיל: {profileComplete}%
                            {profileComplete < 100 && <span onClick={() => navigate(`/profile/${user?.username}`)} className="db-complete-link"> השלם עכשיו</span>}
                        </small>
                    </div>
                </div>
                <button className="db-btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✖ סגור' : '➕ צור פרויקט חדש'}
                </button>
            </div>

            {showForm && <div className="db-form-wrapper"><ProjectForm handleCreateProject={handleCreateProject} /></div>}

            <div className="db-stats-grid">
                {[
                    { label: 'הפרויקטים שלי', value: stats?.myProjects ?? 0, icon: '🚀' },
                    { label: 'בקשות ממתינות', value: stats?.pendingRequests ?? 0, icon: '⏳' },
                    { label: 'הודעות שלא נקראו', value: stats?.unreadNotifications ?? 0, icon: '🔔' },
                    { label: 'חברי צוות פעילים', value: stats?.teamMembers ?? 0, icon: '🤝' },
                ].map(s => (
                    <div key={s.label} className="db-stat-card">
                        <span className="db-stat-icon">{s.icon}</span>
                        <span className="db-stat-value">{s.value}</span>
                        <span className="db-stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="db-main-grid">
                <section className="db-section">
                    <div className="db-section-header">
                        <h3>🚀 הפרויקטים שלי</h3>
                        <span onClick={() => navigate('/projects')} className="db-see-all">ראה הכל</span>
                    </div>
                    {!stats?.myProjectsList?.length ? <p className="db-empty">אין פרויקטים עדיין</p> : (
                        <div className="db-projects-list">
                            {stats.myProjectsList.map(p => (
                                <div key={p.id} className="db-project-card" onClick={() => navigate(`/project/${p.id}`)}>
                                    <div className="db-project-info">
                                        <strong>{p.title}</strong>
                                        <small>{p.category}</small>
                                    </div>
                                    <div className="db-project-meta">
                                        <span>👥 {p.member_count}</span>
                                        <span className={`db-badge ${p.owner_id === user?.id ? 'owner' : 'member'}`}>
                                            {p.owner_id === user?.id ? 'בעלים' : 'חבר'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="db-section">
                    <h3>🔔 התראות אחרונות</h3>
                    {!stats?.notifications?.length ? <p className="db-empty">אין התראות</p> : (
                        <div className="db-notif-list">
                            {stats.notifications.map(n => (
                                <div key={n.id} className={`db-notif-item ${!n.is_read ? 'unread' : ''}`}>
                                    <span>{n.message}</span>
                                    <small>{new Date(n.created_at).toLocaleDateString('he-IL')}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="db-section">
                    <h3>🤝 פרויקטים מומלצים עבורך</h3>
                    {!stats?.openRoles?.length ? <p className="db-empty">אין התאמות כרגע - עדכן כישורים בפרופיל</p> : (
                        <div className="db-roles-list">
                            {stats.openRoles.map((r, i) => (
                                <div key={i} className="db-role-item" onClick={() => navigate(`/project/${r.project_id}`)}>
                                    <div>
                                        <span className="db-role-name">{r.role_name}</span>
                                        <small className="db-role-match">מתאים לכישורים שלך ✨</small>
                                    </div>
                                    <span className="db-role-project">{r.project_title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
