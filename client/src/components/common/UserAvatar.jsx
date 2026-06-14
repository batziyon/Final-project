/**
 * UserAvatar - מציג תמונת פרופיל, ואם אין - עיגול עם האות הראשונה של השם
 * Props:
 *   username  - שם המשתמש (לאות ראשונה ו-alt)
 *   image     - שם קובץ התמונה (ללא נתיב מלא)
 *   size      - גודל בפיקסלים (ברירת מחדל: 40)
 *   className - class נוסף אופציונלי
 */
export default function UserAvatar({ username = '', image, size = 40, className = '' }) {
  const hasImage = image && image !== 'default_profile.png' && image !== 'default-avatar.png';
  const letter = username.charAt(0).toUpperCase() || '?';

  const style = { width: size, height: size, fontSize: size * 0.4, borderRadius: '50%', flexShrink: 0 };

  if (hasImage) {
    const src = image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/profiles/${image}`;
    return (
      <img
        src={src}
        alt={username}
        className={`user-avatar ${className}`}
        style={{ ...style, objectFit: 'cover' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.style && (e.target.nextSibling.style.display = 'flex'); }}
      />
    );
  }

  return (
    <div
      className={`user-avatar user-avatar--letter ${className}`}
      style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, userSelect: 'none' }}
      aria-label={username}
    >
      {letter}
    </div>
  );
}
