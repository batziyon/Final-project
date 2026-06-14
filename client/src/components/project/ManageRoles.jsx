import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SkillSelector from '../SkillSelector';
import '../../styles/components/ProjectComponents.css';

const ManageRoles = ({ projectId, onUpdate, onSuccess, onError }) => {
    const { showSuccess, showError } = useToast();
    const [selectedRoles, setSelectedRoles] = useState([]);

    const handleAddRoles = async () => {
        if (selectedRoles.length === 0) return showError('נא לבחור לפחות תפקיד אחד');
        try {
            await api.post(`/projects/${projectId}/add-role`, { selectedRoles });
            const msg = 'התפקידים עודכנו בהצלחה!';
            if (onSuccess) onSuccess(msg); else showSuccess(msg);
            setSelectedRoles([]);
            if (onUpdate) onUpdate();
        } catch {
            const msg = 'שגיאה בעדכון התפקידים';
            if (onError) onError(msg); else showError(msg);
        }
    };

    return (
        <div className="manage-roles-form">
            <SkillSelector selected={selectedRoles} onChange={setSelectedRoles} label="הוסף תפקידים לפרויקט:" />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleAddRoles} style={{ marginTop: 12 }}>
                עדכן תפקידים
            </button>
        </div>
    );
};

export default ManageRoles;
