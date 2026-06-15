import React from 'react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const maturityLabel = { idea: '💡 רעיון', mvp: '🔧 MVP', active: '🚀 פעיל' };
const locationLabel = { remote: '🌐 מרחוק', physical: '📍 פיזי', hybrid: '🔀 היברידי' };
const paymentLabel  = { paid: '💰 בתשלום', unpaid: '🤝 התנדבות', equity: '📈 אקוויטי' };
const statusLabel   = { recruiting: '🟢 מגייס', in_progress: '🔵 בתהליך', completed: '✅ הושלם' };

const getMediaType = (url) => {
    if (!url) return null;
    const ext = url.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
    if (['mp3','wav','ogg','m4a'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    return 'other';
};

const OverviewTab = ({ project }) => {
    if (!project) return <div>אין נתוני פרויקט להצגה.</div>;

    const mediaType = getMediaType(project.media_url);
    const mediaSrc  = project.media_url ? `${API_BASE}${project.media_url}` : null;

    return (
        <div className="overview-tab">
            <h3>סקירה כללית</h3>

            {/* מדיה מצורפת */}
            {mediaSrc && (
                <div className="overview-media">
                    {mediaType === 'image' && (
                        <img src={mediaSrc} alt="תמונת פרויקט" className="overview-media-img" />
                    )}
                    {mediaType === 'audio' && (
                        <div className="overview-audio">
                            <p>🎵 קובץ שמע מצורף:</p>
                            <audio controls src={mediaSrc} style={{ width: '100%' }} />
                        </div>
                    )}
                    {mediaType === 'pdf' && (
                        <a href={mediaSrc} target="_blank" rel="noreferrer" className="overview-pdf-link">
                            📄 פתח קובץ PDF
                        </a>
                    )}
                    {mediaType === 'other' && (
                        <a href={mediaSrc} target="_blank" rel="noreferrer" className="overview-pdf-link">
                            📎 צפה בקובץ מצורף
                        </a>
                    )}
                </div>
            )}

            <div className="project-description">
                <h4>תיאור הפרויקט</h4>
                <p>{project.description || 'אין תיאור לפרויקט זה.'}</p>
            </div>

            <div className="project-details-grid">
                <div><strong>תאריך יצירה:</strong><p>{new Date(project.created_at).toLocaleDateString('he-IL')}</p></div>
                <div><strong>סטטוס:</strong><p>{statusLabel[project.status] || project.status || 'פעיל'}</p></div>
                <div><strong>קטגוריה:</strong><p>{project.category || 'כללי'}</p></div>
                {project.maturity_level && <div><strong>שלב:</strong><p>{maturityLabel[project.maturity_level]}</p></div>}
                {project.remote_or_physical && <div><strong>מיקום:</strong><p>{locationLabel[project.remote_or_physical]}</p></div>}
                {project.payment_status && <div><strong>תגמול:</strong><p>{paymentLabel[project.payment_status]}</p></div>}
                {project.is_startup == 1 && <div><strong>סוג:</strong><p>🏢 סטארטאפ</p></div>}
                {project.is_open_source == 1 && <div><strong>קוד:</strong><p>🔓 Open Source</p></div>}
            </div>
        </div>
    );
};

export default OverviewTab;