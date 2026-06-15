import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader, Badge, Button } from '../components/common';
import '../styles/pages/AdminUserProfile.css';

const roleLabel = { creator: '👑 יוצר', admin: '👮 מנהל' };
const statusLabel = { pending: '⏳ ממתין', approved: '✅ אושר', rejected: '❌ נדחה' };

const AdminUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`/admin/users/${userId}/profile`)
            .then(res => setProfile(res.data))
            .catch(() => setError('שגיאה בטעינת הפרופיל'))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <Loader text="טוען פרופיל..." />;
    if (error)   return <div className="aup-error">{error}</div>;

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const avatarSrc = profile.profile_image && profile.profile_image !== 'default_profile.png'
        ? `${API_URL}/uploads/profiles/${profile.profile_image}`
        : null;

    return (
        <div className="aup-page">
            <div className="aup-back">
                <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>⬅️ חזרה</Button>
            </div>

            {/* כרטיס פרטים כלליים */}
            <div className="aup-card">
                <div className="aup-hero">
                    <div className="aup-avatar">
                        {avatarSrc
                            ? <img src={avatarSrc} alt={profile.username} />
                            : <span>{profile.username?.charAt(0).toUpperCase()}</span>
                        }
                    </div>
                    <div className="aup-hero-info">
                        <h1>{profile.username}</h1>
                        <p className="aup-email">{profile.email}</p>
                        <div className="aup-badges">
                            <Badge variant="primary">{roleLabel[profile.role] || profile.role}</Badge>
                            <Badge variant={profile.is_active === 1 ? 'success' : 'danger'}>
                                {profile.is_active === 1 ? '✅ פעיל' : '🚫 חסום'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="aup-meta">
                    <div className="aup-meta-item">
                        <span className="aup-meta-label">תאריך הרשמה</span>
                        <span>{new Date(profile.created_at).toLocaleDateString('he-IL')}</span>
                    </div>
                    <div className="aup-meta-item">
                        <span className="aup-meta-label">פרויקטים</span>
                        <span>{profile.projects?.length ?? 0}</span>
                    </div>
                    <div className="aup-meta-item">
                        <span className="aup-meta-label">בקשות</span>
                        <span>{profile.applications?.length ?? 0}</span>
                    </div>
                </div>

                {profile.bio && (
                    <div className="aup-bio">
                        <span className="aup-section-label">אודות</span>
                        <p>{profile.bio}</p>
                    </div>
                )}

                {profile.skills?.length > 0 && (
                    <div className="aup-skills">
                        <span className="aup-section-label">כישורים</span>
                        <div className="aup-skills-list">
                            {profile.skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                        </div>
                    </div>
                )}
            </div>

            {/* פרויקטים */}
            <div className="aup-card">
                <h2 className="aup-section-title">📁 פרויקטים ({profile.projects?.length ?? 0})</h2>
                {profile.projects?.length === 0 ? (
                    <p className="aup-empty">אין פרויקטים</p>
                ) : (
                    <table className="aup-table">
                        <thead>
                            <tr><th>כותרת</th><th>קטגוריה</th><th>סטטוס</th><th>תפקיד</th></tr>
                        </thead>
                        <tbody>
                            {profile.projects.map(p => (
                                <tr key={p.id}>
                                    <td>{p.title}</td>
                                    <td>{p.category}</td>
                                    <td>{p.status}</td>
                                    <td>{p.relation === 'owner' ? '👑 בעלים' : '👥 חבר'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* בקשות הצטרפות */}
            <div className="aup-card">
                <h2 className="aup-section-title">📋 בקשות הצטרפות ({profile.applications?.length ?? 0})</h2>
                {profile.applications?.length === 0 ? (
                    <p className="aup-empty">אין בקשות</p>
                ) : (
                    <table className="aup-table">
                        <thead>
                            <tr><th>פרויקט</th><th>סטטוס</th><th>סיבה</th><th>תאריך</th></tr>
                        </thead>
                        <tbody>
                            {profile.applications.map(a => (
                                <tr key={a.id}>
                                    <td>{a.project_title}</td>
                                    <td><Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'secondary'}>
                                        {statusLabel[a.status] || a.status}
                                    </Badge></td>
                                    <td className="aup-reason">{a.reason || '—'}</td>
                                    <td>{new Date(a.created_at).toLocaleDateString('he-IL')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminUserProfile;
