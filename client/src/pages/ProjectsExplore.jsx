import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/project/ProjectCard';
import { CATEGORIES, MATURITY_LEVELS, LOCATION_TYPES, PAYMENT_TYPES } from '../constants/projectOptions';
import api from '../services/api';
import '../styles/pages/ProjectsExplore.css';

const defaultFilters = {
    category: '', maturity_level: '', remote_or_physical: '',
    payment_status: '', is_startup: false, is_open_source: false, search: ''
};

const ProjectsExplore = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(defaultFilters);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.maturity_level) params.append('maturity_level', filters.maturity_level);
            if (filters.remote_or_physical) params.append('remote_or_physical', filters.remote_or_physical);
            if (filters.payment_status) params.append('payment_status', filters.payment_status);
            if (filters.is_startup) params.append('is_startup', 'true');
            if (filters.is_open_source) params.append('is_open_source', 'true');
            const res = await api.get(`/projects?${params}`);
            setProjects(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [filters.category, filters.maturity_level, filters.remote_or_physical, filters.payment_status, filters.is_startup, filters.is_open_source]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const filtered = filters.search
        ? projects.filter(p =>
            p.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            p.description?.toLowerCase().includes(filters.search.toLowerCase()))
        : projects;

    const setFilter = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
    const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v && v !== '').length;

    return (
        <div className="explore-wrapper">
            <div className="explore-header">
                <h1>🔎 גילוי פרויקטים</h1>
                <p>{filtered.length} פרויקטים נמצאו</p>
            </div>

            <input className="explore-search" placeholder="🔍 חפש לפי שם או תיאור..."
                value={filters.search} onChange={e => setFilter('search', e.target.value)} />

            <div className="explore-layout">
                <aside className="filters-sidebar">
                    <div className="filters-header">
                        <strong>פילטרים</strong>
                        {activeCount > 0 && <span className="filters-clear" onClick={() => setFilters(defaultFilters)}>נקה ({activeCount})</span>}
                    </div>

                    <div className="filter-group">
                        <label>תחום</label>
                        <select className="filter-select" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                            <option value="">הכל</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>רמת בשלות</label>
                        <select className="filter-select" value={filters.maturity_level} onChange={e => setFilter('maturity_level', e.target.value)}>
                            <option value="">הכל</option>
                            {MATURITY_LEVELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>מיקום</label>
                        <select className="filter-select" value={filters.remote_or_physical} onChange={e => setFilter('remote_or_physical', e.target.value)}>
                            <option value="">הכל</option>
                            {LOCATION_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>תגמול</label>
                        <select className="filter-select" value={filters.payment_status} onChange={e => setFilter('payment_status', e.target.value)}>
                            <option value="">הכל</option>
                            {PAYMENT_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-checkbox">
                            <input type="checkbox" checked={filters.is_startup} onChange={e => setFilter('is_startup', e.target.checked)} />
                            🏢 סטארטאפ בלבד
                        </label>
                        <label className="filter-checkbox">
                            <input type="checkbox" checked={filters.is_open_source} onChange={e => setFilter('is_open_source', e.target.checked)} />
                            🔓 Open Source בלבד
                        </label>
                    </div>
                </aside>

                <div className="projects-grid-wrapper">
                    {loading ? <p className="explore-loading">טוען פרויקטים...</p>
                        : filtered.length === 0 ? <p className="explore-empty">לא נמצאו פרויקטים מתאימים</p>
                        : <div className="projects-grid">{filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/project/${p.id}`)} />)}</div>}
                </div>
            </div>
        </div>
    );
};

export default ProjectsExplore;
