import React from 'react';
import '../../styles/pages/ProjectDetails.css';

const maturityLabel = { idea: 'רעיון 💡', mvp: 'MVP 🔧', active: 'פעיל 🚀' };
const statusLabel = { recruiting: '🟢 מגייס', in_progress: '🔵 בתהליך', completed: '✅ הושלם' };

const ProjectHeader = ({ project }) => {
    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const hasImage = !!project.media_url && ['jpg','jpeg','png','gif','webp'].some(ext => project.media_url.endsWith(ext));

    return (
        <div className={`project-header ${hasImage ? 'with-image' : 'no-image'}`}>
            {hasImage ? (
                <div className="cover-container">
                    <img src={`${API_BASE}${project.media_url}`} alt="Project Cover" className="cover-img" />
                    <div className="cover-overlay">
                        <div className="header-info-overlay">
                            <h1>{project.title}</h1>
                            <div className="header-meta">
                                <span className="status-badge">{statusLabel[project.status] || project.status}</span>
                                <span className="meta-tag">📁 {project.category}</span>
                                {project.owner_name && <span className="meta-tag">👤 בעלים: {project.owner_name}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="header-no-image">
                    <div className="header-icon">
                        {project.category?.charAt(0) || '🚀'}
                    </div>
                    <div className="header-info-plain">
                        <h1>{project.title}</h1>
                        <div className="header-meta">
                            <span className="status-badge">{statusLabel[project.status] || project.status}</span>
                            <span className="meta-tag">📁 {project.category}</span>
                            {project.owner_name && <span className="meta-tag">👤 בעלים: {project.owner_name}</span>}
                            {project.maturity_level && <span className="meta-tag">{maturityLabel[project.maturity_level]}</span>}
                            {project.remote_or_physical && <span className="meta-tag">{project.remote_or_physical === 'remote' ? '🌐 מרחוק' : '📍 פיזי'}</span>}
                            {project.payment_status && <span className="meta-tag">{project.payment_status === 'paid' ? '💰 בתשלום' : '🤝 התנדבות'}</span>}
                            {project.is_startup == 1 && <span className="meta-tag">🏢 סטארטאפ</span>}
                            {project.is_open_source == 1 && <span className="meta-tag">🔓 Open Source</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectHeader;
