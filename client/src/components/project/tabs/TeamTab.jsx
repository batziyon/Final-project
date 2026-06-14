import React, { useState, useEffect } from 'react';
import UserAvatar from '../../common/UserAvatar';
import api from '../../../services/api';
import '../../../styles/components/ProjectComponents.css';

const TeamTab = ({ projectId }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/members`);
                setMembers(res.data);
            } catch (err) {
                console.error('שגיאה בטעינת חברי הצוות', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [projectId]);

    if (loading) return <p className="loading-state">טוען חברי צוות...</p>;

    return (
        <div className="team-tab">
            <h3>צוות הפרויקט</h3>
            {members.length === 0 ? (
                <p className="empty-state">אין עדיין חברי צוות בפרויקט.</p>
            ) : (
                <div className="team-grid">
                    {members.map(member => (
                        <div key={member.id} className="member-card">
                            <UserAvatar username={member.username} image={member.profile_image} size={60} />
                            <span>{member.username}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamTab;
