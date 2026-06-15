import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../common';
import UserAvatar from '../../common/UserAvatar';
import api from '../../../services/api';
import '../../../styles/components/ProjectComponents.css';

const TeamTab = ({ projectId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
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

    const getProfileUrl = (member) => {
        if (String(user?.role).toLowerCase() === 'admin') {
            return `/admin/user/${member.id}`;
        }
        return `/profile/${member.username}`;
    };

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
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(getProfileUrl(member))}
                            >צפה בפרופיל</Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamTab;
