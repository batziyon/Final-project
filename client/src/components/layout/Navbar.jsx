import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import "../../styles/components/Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({ unread: [], older: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // טעינת התראות בטעינת הקומפוננטה
  useEffect(() => {
    if (!user) return;

   // בתוך ה-Navbar.jsx
const fetchNotifications = async () => {
    try {
        const res = await api.get('/projects/notifications');
        setNotifications(res.data);
    } catch (err) {
        console.error("שגיאה בטעינת התראות:", err);
    }
};

    fetchNotifications(); // משיכה ראשונית
    const interval = setInterval(fetchNotifications, 30000); // משיכה כל 30 שניות

    return () => clearInterval(interval); // ניקוי ה-interval כשהקומפוננטה יורדת
  }, [user]);

  const handleBellClick = async () => {
    const opening = !showDropdown;
    setShowDropdown(opening);
    setShowOlder(false);
    setMenuOpen(false);
    if (opening && notifications.unread.length > 0) {
      try {
        await api.post('/projects/notifications/clear', {});
        setNotifications(prev => ({ unread: [], older: [...prev.unread, ...prev.older].slice(0, 10) }));
      } catch (err) { console.error(err); }
    }
  };

  const handleLogout = () => {
    logout();
    showSuccess('התנתקת בהצלחה');
    navigate('/');
  };

  if (['/login', '/register', '/'].includes(location.pathname)) return null;

  return (
    <nav className="navbar">
      <div className="logo">ProjectMatch</div>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <Link to="/dashboard">דשבורד</Link>
        <Link to="/projects">גילוי פרויקטים</Link>
        <Link to={`/profile/${user?.username}`}>הפרופיל שלי</Link>
      </div>

      <div className="nav-actions">
        {user && (
          <div className="nav-user-info">
            <div className="notification-wrapper" onClick={handleBellClick}>
              🔔
              {notifications.unread.length > 0 && (
                <span className="notif-badge">{notifications.unread.length}</span>
              )}
              {showDropdown && (
                <div className="notification-dropdown">
                  <div className="notif-header">התראות</div>
                  {notifications.unread.length === 0 && notifications.older.length === 0
                    ? <div className="notif-empty">אין התראות חדשות</div>
                    : null
                  }
                  {notifications.unread.map((n, i) => (
                    <div key={i} className="notif-item unread">{n.message}</div>
                  ))}
                  {notifications.older.length > 0 && (
                    <>
                      <div className="notif-older-toggle" onClick={e => { e.stopPropagation(); setShowOlder(!showOlder); }}>
                        {showOlder ? 'פחות ▲' : 'הודעות קודמות ▼'}
                      </div>
                      {showOlder && notifications.older.map((n, i) => (
                        <div key={i} className="notif-item">{n.message}</div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <span>שלום, <b>{user.username}</b></span>
            <UserAvatar username={user.username} image={user.profile_image} size={36} className="nav-avatar" />
          </div>
        )}
        <button onClick={handleLogout} className="logout-btn">התנתק</button>
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="תפריט">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;