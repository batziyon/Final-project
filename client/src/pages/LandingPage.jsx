import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

// ============================================================
// PLACEHOLDER: החלף כאן את קישור הסרטון האמיתי
// קובץ: client/src/pages/LandingPage.jsx  שורה: 8
// ============================================================
const VIDEO_URL_PLACEHOLDER = '/sounds/20260615-1917-59.2483222.mp4';

export default function LandingPage() {
    const [stats, setStats] = useState({ users: 0, projects: 0, teamMembers: 0 });

    useEffect(() => {
        api.get('/projects/stats')
            .then(res => setStats(res.data))
            .catch(() => {});
    }, []);

    return (
        <div className="landing-container">
            {/* Hero */}
            <section className="hero">
                <h1>ProjectMatch: המקום בו רעיונות פוגשים צוותים</h1>
                <p>מצא את השותפים המושלמים לפרויקט החלומות שלך, גייס כישרונות ובנה את העתיד ביחד.</p>
                <div className="cta-buttons">
                    <Link to="/register" className="btn-primary">הירשם עכשיו</Link>
                    <Link to="/login" className="btn-secondary">התחברות</Link>
                </div>

                {/* Video Section */}
                <div className="demo-video">
                    {VIDEO_URL_PLACEHOLDER.includes('YOUR_VIDEO_ID_HERE') ? (
                        <div className="video-placeholder">
                            🎥 סרטון הדגמה של המערכת
                            <small>החלף את VIDEO_URL_PLACEHOLDER בקובץ LandingPage.jsx שורה 8</small>
                        </div>
                    ) : (
                        <iframe
                            className="video-iframe"
                            src={VIDEO_URL_PLACEHOLDER}
                            title="סרטון הדגמה"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </div>
            </section>

            {/* Stats */}
            <section className="stats-section">
                <div className="stat-card">
                    <h2>{stats.users}+</h2>
                    <p>משתמשים רשומים</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.projects}+</h2>
                    <p>פרויקטים פעילים</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.teamMembers}+</h2>
                    <p>צוותים פעילים</p>
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works">
                <h2>איך זה עובד?</h2>
                <div className="steps">
                    <div className="step"><span>1</span><p>יוצרים חשבון בחינם</p></div>
                    <div className="step"><span>2</span><p>מפרסמים פרויקט או מחפשים אחד</p></div>
                    <div className="step"><span>3</span><p>יוצרים קשר ומתחילים לעבוד!</p></div>
                </div>
            </section>
        </div>
    );
}
