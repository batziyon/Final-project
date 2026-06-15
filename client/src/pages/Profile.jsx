import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SkillSelector from '../components/SkillSelector';
import UserAvatar from '../components/common/UserAvatar';
import { Badge, Button } from '../components/common';
import api from '../services/api';
import '../styles/pages/Profile.css';

const roleLabel = { creator: '👑 יוצר פרויקטים', admin: '👮 מנהל מערכת', listener: '🔍 מחפש פרויקטים' };
const appStatusVariant = { pending: 'secondary', approved: 'success', rejected: 'danger' };
const appStatusLabel = { pending: '⏳ ממתין', approved: '✅ אושר', rejected: '❌ נדחה' };

const Profile = () => {
  const { username, userId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const isAdminView = Boolean(userId);
  const isOwnProfile = !isAdminView && user?.username === username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdminView) {
          const res = await api.get(`/admin/users/${userId}/profile`);
          setProfile(res.data);
        } else {
          const res = await api.get(`/auth/profile/${username}`);
          setProfile(res.data);
          if (isOwnProfile) {
            setBio(res.data.bio || '');
            setSkills(res.data.skills || []);
          }
        }
      } catch {
        showError('שגיאה בטעינת הפרופיל');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
      formData.append('skills', JSON.stringify(skills));
      if (selectedFile) formData.append('profileImage', selectedFile);

      const res = await api.put('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedData = { bio, skills };
      if (res.data.user?.profile_image) updatedData.profile_image = res.data.user.profile_image;
      updateUser(updatedData);
      setProfile(prev => ({ ...prev, ...updatedData }));
      showSuccess('הפרופיל עודכן בהצלחה! 🎉');
      setCurrentPassword(''); setNewPassword(''); setSelectedFile(null);
    } catch (err) {
      showError(err.response?.data?.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="db-loading">טוען פרופיל...</div>;
  if (!profile) return <div className="db-loading">המשתמש לא נמצא</div>;

  return (
    <div className="profile-page">
      {isAdminView && (
        <div className="profile-back">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>⬅️ חזרה</Button>
          <span className="profile-admin-tag">👮 תצוגת מנהל — קריאה בלבד</span>
        </div>
      )}

      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <UserAvatar username={profile.username} image={profile.profile_image} size={80} className="profile-avatar" />
          <div>
            <h2>{profile.username}</h2>
            <p className="profile-role">{roleLabel[profile.role] || profile.role}</p>
            {(isOwnProfile || isAdminView) && <p className="profile-email">{profile.email}</p>}
            {isAdminView && (
              <div className="profile-admin-badges">
                <Badge variant={profile.is_active === 1 ? 'success' : 'danger'}>
                  {profile.is_active === 1 ? '✅ פעיל' : '🚫 חסום'}
                </Badge>
                <span className="profile-joined">
                  הצטרף: {new Date(profile.created_at).toLocaleDateString('he-IL')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="form-group">
            <label>קצת עליי</label>
            <p className="profile-bio-text">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div className="form-group">
            <label>כישורים</label>
            <div className="profile-skills">
              {profile.skills.map((s, i) => (
                <span key={i} className="skill-tag">
                  {s.startsWith('אחר:') ? s.replace('אחר:', '') : s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {profile.projects?.length > 0 && (
          <div className="form-group">
            <label>📁 פרויקטים ({profile.projects.length})</label>
            <div className="profile-projects-list">
              {profile.projects.map(p => (
                <div key={p.id} className="profile-project-item">
                  <span className="profile-project-title">{p.title}</span>
                  <div className="profile-project-meta">
                    <Badge variant="secondary">{p.category}</Badge>
                    <Badge variant={p.relation === 'owner' ? 'primary' : 'secondary'}>
                      {p.relation === 'owner' ? '👑 בעלים' : '👥 חבר'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin only: applications */}
        {isAdminView && profile.applications?.length > 0 && (
          <div className="form-group">
            <label>📋 בקשות הצטרפות ({profile.applications.length})</label>
            <div className="profile-apps-list">
              {profile.applications.map(a => (
                <div key={a.id} className="profile-app-item">
                  <span>{a.project_title}</span>
                  <Badge variant={appStatusVariant[a.status] || 'secondary'}>
                    {appStatusLabel[a.status] || a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit form — own profile only */}
        {isOwnProfile && (
          <>
            <hr className="profile-divider" />
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>החלפת תמונת פרופיל</label>
                <input type="file" accept="image/*" className="form-input"
                  onChange={(e) => setSelectedFile(e.target.files[0])} />
                <small>מומלץ תמונה מרובעת, עד 5MB</small>
              </div>
              <div className="form-group">
                <label>קצת עליך</label>
                <textarea className="form-input" value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="ספר על עצמך..."
                  style={{ height: 80, resize: 'none' }} />
              </div>
              <div className="form-group">
                <SkillSelector selected={skills} onChange={setSkills} label="מה אני יודע לעשות" />
              </div>
              <div className="profile-password-section">
                <h4>שינוי סיסמה</h4>
                <div className="form-group">
                  <label>סיסמה נוכחית</label>
                  <input type="password" className="form-input" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} placeholder="הזן סיסמה נוכחית" />
                </div>
                <div className="form-group">
                  <label>סיסמה חדשה</label>
                  <input type="password" className="form-input" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="לפחות 6 תווים" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
