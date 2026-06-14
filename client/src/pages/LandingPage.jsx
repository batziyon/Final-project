import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

export default function LandingPage() {
    const [stats, setStats] = useState({ users: 0, projects: 0, teamMembers: 0 });

    useEffect(() => {
      api.get('/projects/stats')
            .then(res => setStats(res.data))
            .catch(err => console.log("שגיאה בטעינת סטטיסטיקות:", err));
    }, []);

    return (
        <div className="landing-container">
            {/* Hero Section */}
            <section className="hero">
                <h1>ProjectMatch: המקום בו רעיונות פוגשים צוותים</h1>
                <p>מצא את השותפים המושלמים לפרויקט החלומות שלך, גייס כישרונות ובנה את העתיד ביחד.</p>
                
                <div className="cta-buttons">
                    <Link to="/register" className="btn-primary">הירשם עכשיו</Link>
                    <Link to="/login" className="btn-secondary">התחברות</Link>
                </div>

                <div className="demo-video">
                    <div className="video-placeholder">🎥 סרטון הדגמה של המערכת</div>
                </div>
            </section>

            {/* Stats Section - שימוש בנתונים מהשרת */}
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