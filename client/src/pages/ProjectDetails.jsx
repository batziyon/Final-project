import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../hooks/useProjects';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import ProjectHeader from '../components/project/ProjectHeader';
import ApplyForm from '../components/project/ApplyForm';
import OpenRolesTab from '../components/project/tabs/OpenRolesTab';
import TeamTab from '../components/project/tabs/TeamTab';
import TasksTab from '../components/project/tabs/TasksTab';
import FilesTab from '../components/project/tabs/FilesTab';
import ApplicationsList from '../components/project/ApplicationsList';
import OverviewTab from '../components/project/tabs/OverviewTab';
import "../styles/pages/ProjectDetails.css";

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { project, loading, refreshProject } = useProject(id);
    const { showSuccess, showError, showWarning } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [localApplied, setLocalApplied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApplySubmit = async (formData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post('/projects/apply', { projectId: id, ...formData });
            showSuccess('הבקשה נשלחה בהצלחה!');
            setLocalApplied(true);
            await refreshProject();
        } catch (err) {
            if (err.response?.status === 400) {
                showWarning('כבר נרשמת לפרויקט!');
                setLocalApplied(true);
            } else {
                showError('שגיאה בשליחת הבקשה, נסה שוב מאוחר יותר');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">טוען נתוני פרויקט...</div>;
    if (!project) return <div>הפרויקט לא נמצא.</div>;

    const currentUserId = String(user?.id);
    const isMember = project.members?.some(m => String(m.id) === currentUserId) || String(project.owner_id) === currentUserId;
    const hasApplied = localApplied || project.applications?.some(app => String(app.user_id) === currentUserId);
    const isOwner = String(project.owner_id) === currentUserId;

    return (
        <div className="project-page">
            <ProjectHeader project={project} />

            {!isMember ? (
                <div className="apply-container">
                    {hasApplied ? (
                        <div className="alert-box">✅ הבקשה נשלחה בהצלחה! ממתין לאישור בעלי הפרויקט.</div>
                    ) : (
                        <>
                            <h2>🤝 הצטרף לפרויקט</h2>
                            <p>כדי לצפות בתכנים המלאים ולהשתתף, הגש בקשת הצטרפות.</p>
                            <ApplyForm onApplySubmit={handleApplySubmit} isSubmitting={isSubmitting} roles={project.roles || []} />
                        </>
                    )}
                </div>
            ) : (
                <>
                    <nav className="tabs-navigation">
                        {[
                            { id: 'overview', label: 'סקירה' },
                            { id: 'team', label: 'צוות' },
                            { id: 'tasks', label: 'משימות' },
                            { id: 'files', label: 'קבצים' },
                            { id: 'roles', label: 'דרושים' },
                            ...(isOwner ? [{ id: 'requests', label: 'ניהול בקשות' }] : [])
                        ].map(tab => (
                            <button key={tab.id}
                                className={activeTab === tab.id ? 'active' : ''}
                                onClick={() => setActiveTab(tab.id)}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <main className="tab-content">
                        {activeTab === 'overview' && <OverviewTab project={project} />}
                        {activeTab === 'team' && <TeamTab projectId={id} />}
                        {activeTab === 'tasks' && <TasksTab projectId={id} isOwner={isOwner} members={project.members || []} />}
                        {activeTab === 'files' && <FilesTab projectId={id} />}
                        {activeTab === 'roles' && (
                            <OpenRolesTab
                                roles={project.roles || []}
                                projectId={id}
                                isOwner={isOwner}
                                onUpdate={refreshProject}
                                onSuccess={showSuccess}
                                onError={showError}
                            />
                        )}
                        {activeTab === 'requests' && isOwner && (
                            <ApplicationsList
                                applications={project.applications}
                                projectId={id}
                                onUpdate={refreshProject}
                            />
                        )}
                    </main>
                </>
            )}
        </div>
    );
};

export default ProjectDetails;
