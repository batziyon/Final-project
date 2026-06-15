import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export const useProject = (id) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProject = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (err) {
            console.error("שגיאה בטעינת הפרויקט:", err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchProject(); }, [fetchProject]);

    return { project, loading, refreshProject: fetchProject };
};