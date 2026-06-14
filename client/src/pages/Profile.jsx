import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SkillSelector from '../components/SkillSelector';
import UserAvatar from '../components/common/UserAvatar';
import api from '../services/api';
import '../styles/pages/Profile.css';

const roleLabel = { creator: '👑 יוצר פרויקטים', admin: '👮 מנהל מערכת', listener: '🔍 מחפש פרויקטים' };

const Profile = () => {
  const { username } = useParams();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const isOwnProfile = user?.username === username;

  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [skills, setSkills] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(!isOwnProfile);

  // עבור הפרופיל האישי — טוען מ-AuthContext
  useEffect(() => {
    if (isOwnProfile && user) {
      setBio(user.bio || '');
      setEmail(user.email || '');
      setUserRole(user.role || '');
      setImageUrl(user.profile_image || '');
      setSkills(user.skills || []);
    }
  }, [isOwnProfile, user]);

  // עבור פרופיל של משתמש אחר — טוען מהשרת
  useEffect(() => {
    if (!isOwnProfile) {
      setProfileLoading(true);
      api.get(`/auth/profile/${username}`)
        .then(res => {
          const u = res.data;
          setBio(u.bio || '');
          setEmail(u.email || '');
          setUserRole(u.role || '');
          setImageUrl(u.profile_image || '');
          setSkills(u.skills || []);
        })
        .catch(() => showError('שגיאה בטעינת פרופיל המשתמש'))
        .finally(() => setProfileLoading(false));
    }
  }, [isOwnProfile, username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      if (res.data.user?.profile_image) {
        updatedData.profile_image = res.data.user.profile_image;
        setImageUrl(res.data.user.profile_image);
      }
      updateUser(updatedData);
      showSuccess('הפרופיל עודכן בהצלחה! 🎉');
      setCurrentPassword('');
      setNewPassword('');
      setSelectedFile(null);
    } catch (err) {
      showError(err.response?.data?.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) return <div className="db-loading">טוען פרופיל...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <UserAvatar username={username} image={imageUrl} size={80} className="profile-avatar" />
          <div>
            <h2>{username}</h2>
            <p className="profile-role">{roleLabel[userRole] || userRole}</p>
            {isOwnProfile && <p className="profile-email">{email}</p>}
          </div>
        </div>

        {bio && (
          <div className="form-group">
            <label>קצת עליי</label>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{bio}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div className="form-group">
            <label>כישורים</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skills.map((s, i) => (
                <span key={i} className="skill-tag" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-sm)' }}>
                  {s.startsWith('אחר:') ? s.replace('אחר:', '') : s}
                </span>
              ))}
            </div>
          </div>
        )}

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

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'שומר...' : 'שמור שינויים'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
