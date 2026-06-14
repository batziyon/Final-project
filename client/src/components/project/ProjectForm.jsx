import React, { useState } from 'react';
import api from '../../services/api';
import SkillSelector from '../SkillSelector';
import { CATEGORIES, MATURITY_LEVELS, LOCATION_TYPES, PAYMENT_TYPES } from '../../constants/projectOptions';

const ProjectForm = ({ handleCreateProject }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [seeking, setSeeking] = useState([]);
    const [maturityLevel, setMaturity] = useState('');
    const [remoteOrPhysical, setLocation] = useState('remote');
    const [paymentStatus, setPayment] = useState('unpaid');
    const [isStartup, setIsStartup] = useState(false);
    const [isOpenSource, setIsOpenSource] = useState(false);
    const [projectMedia, setProjectMedia] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('maturityLevel', maturityLevel);
        formData.append('remoteOrPhysical', remoteOrPhysical);
        formData.append('paymentStatus', paymentStatus);
        formData.append('isStartup', isStartup);
        formData.append('isOpenSource', isOpenSource);
        formData.append('seeking', JSON.stringify(seeking));
        if (projectMedia) formData.append('projectMedia', projectMedia);

        try {
            if (handleCreateProject) {
                await handleCreateProject(formData);
            } else {
                await api.post('/projects/create', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setTitle(''); setDescription(''); setSeeking([]); setProjectMedia(null);
        } catch (err) {
            console.error('שגיאה ביצירת פרויקט', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="project-form" onSubmit={onSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label>כותרת הפרויקט *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label>קטגוריה</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="form-input">
                        <option value="">בחר קטגוריה</option>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>תיאור הפרויקט</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-input" rows={4} />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>רמת בשלות</label>
                    <select value={maturityLevel} onChange={e => setMaturity(e.target.value)} className="form-input">
                        <option value="">בחר שלב</option>
                        {MATURITY_LEVELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>מיקום עבודה</label>
                    <select value={remoteOrPhysical} onChange={e => setLocation(e.target.value)} className="form-input">
                        {LOCATION_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>תגמול</label>
                    <select value={paymentStatus} onChange={e => setPayment(e.target.value)} className="form-input">
                        {PAYMENT_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>מדיה לפרויקט (תמונה / אודיו / PDF)</label>
                    <input type="file" accept="image/*,audio/*,.pdf" onChange={e => setProjectMedia(e.target.files?.[0] || null)} className="form-input" />
                </div>
            </div>

            <div className="form-row">
                <label className="checkbox-label">
                    <input type="checkbox" checked={isStartup} onChange={e => setIsStartup(e.target.checked)} />
                    🏢 סטארטאפ
                </label>
                <label className="checkbox-label">
                    <input type="checkbox" checked={isOpenSource} onChange={e => setIsOpenSource(e.target.checked)} />
                    🔓 Open Source
                </label>
            </div>

            <div className="form-group">
                <SkillSelector selected={seeking} onChange={setSeeking} label="אילו בעלי תפקידים אני מחפש?" />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
                {isSubmitting ? 'יוצר פרויקט...' : '🚀 צור פרויקט'}
            </button>
        </form>
    );
};

export default ProjectForm;
