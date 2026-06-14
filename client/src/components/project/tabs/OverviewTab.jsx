import React from 'react';

const OverviewTab = ({ project }) => {
    if (!project) return <div>אין נתוני פרויקט להצגה.</div>;

    return (
        <div className="overview-tab">
            <h3>סקירה כללית</h3>
            
            <div className="project-description">
                <h4>תיאור הפרויקט</h4>
                <p>{project.description || "אין תיאור לפרויקט זה."}</p>
            </div>

            <div className="project-details-grid">
                <div>
                    <strong>תאריך יצירה:</strong>
                    <p>{new Date(project.created_at).toLocaleDateString('he-IL')}</p>
                </div>
                <div>
                    <strong>סטטוס:</strong>
                    <p>{project.status || "פעיל"}</p>
                </div>
                <div>
                    <strong>קטגוריה:</strong>
                    <p>{project.category || "כללי"}</p>
                </div>
            </div>

            {/* אפשר להוסיף כאן עוד אלמנטים כמו קישורים חיצוניים או דרישות טכניות */}
        </div>
    );
};

export default OverviewTab;