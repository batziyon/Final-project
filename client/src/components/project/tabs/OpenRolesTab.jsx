import React from 'react';
import ManageRoles from '../ManageRoles';
import '../../../styles/components/ProjectComponents.css';

const OpenRolesTab = ({ roles = [], projectId, isOwner, onUpdate, onSuccess, onError }) => {
    const safeRoles = Array.isArray(roles) ? roles : [];

    return (
        <div className="roles-tab">
            <h3>דרושים לפרויקט</h3>

            {isOwner && (
                <div className="admin-section">
                    <ManageRoles projectId={projectId} onUpdate={onUpdate} onSuccess={onSuccess} onError={onError} />
                </div>
            )}

            {safeRoles.length === 0 ? (
                <p className="empty-state">כרגע אין משרות פתוחות.</p>
            ) : (
                safeRoles.map((role, i) => (
                    <div key={i} className="role-card">
                        <strong>{role.role_name}</strong>
                        <span className={role.status === 'open' ? 'role-status-open' : 'role-status-taken'}>
                            {role.status === 'open' ? '🟢 פתוח' : '🔴 תפוס'}
                        </span>
                    </div>
                ))
            )}
        </div>
    );
};

export default OpenRolesTab;
