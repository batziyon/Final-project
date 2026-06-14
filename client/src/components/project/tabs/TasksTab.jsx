import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';
import '../../../styles/components/ProjectComponents.css';

const COLUMNS = [
    { key: 'todo', label: 'לביצוע' },
    { key: 'in_progress', label: 'בתהליך' },
    { key: 'review', label: 'בבדיקה' },
    { key: 'done', label: 'הושלם ✅' },
];
const emptyForm = { title: '', description: '', assignee_id: '', due_date: '' };

const TasksTab = ({ projectId, isOwner, members = [] }) => {
    const { showSuccess, showError } = useToast();
    const [tasks, setTasks] = useState([]);
    const [pending, setPending] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const [t, p] = await Promise.all([
                api.get(`/projects/${projectId}/tasks`),
                isOwner ? api.get(`/projects/${projectId}/tasks/pending`) : Promise.resolve({ data: [] })
            ]);
            setTasks(t.data);
            setPending(p.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTasks(); }, [projectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/projects/${projectId}/tasks`, form);
            showSuccess(res.data.message);
            setForm(emptyForm);
            setShowForm(false);
            fetchTasks();
        } catch { showError('שגיאה ביצירת משימה'); }
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            await api.patch(`/projects/tasks/${taskId}/status`, { status });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        } catch { showError('שגיאה בעדכון סטטוס'); }
    };

    const handleApproval = async (taskId, action) => {
        try {
            await api.post(`/projects/tasks/${taskId}/approve`, { action });
            showSuccess(action === 'approve' ? 'המשימה אושרה ✅' : 'המשימה נדחתה');
            fetchTasks();
        } catch { showError('שגיאה בביצוע הפעולה'); }
    };

    if (loading) return <p className="loading-state">טוען משימות...</p>;

    return (
        <div className="tasks-tab">
            <div className="tasks-header">
                <h3>לוח משימות</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✖ סגור' : '+ הוסף משימה'}
                </button>
            </div>

            {isOwner && pending.length > 0 && (
                <div className="pending-panel">
                    <p className="pending-panel-title">⏳ משימות ממתינות לאישורך ({pending.length})</p>
                    {pending.map(t => (
                        <div key={t.id} className="pending-item">
                            <div className="pending-item-info">
                                <strong>{t.title}</strong>
                                <small>הוצע ע"י {t.creator_name}</small>
                                {t.description && <p>{t.description}</p>}
                            </div>
                            <div className="pending-item-actions">
                                <button className="btn btn-success btn-sm" onClick={() => handleApproval(t.id, 'approve')}>אשר ✅</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleApproval(t.id, 'reject')}>דחה ❌</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <form className="task-form" onSubmit={handleSubmit}>
                    <input className="form-input" placeholder="כותרת המשימה *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    <textarea className="form-input" placeholder="תיאור (אופציונלי)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ height: 70, resize: 'none' }} />
                    <select className="form-input" value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                        <option value="">בחר אחראי (אופציונלי)</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                    <input className="form-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    <button className="btn btn-primary" type="submit">
                        {isOwner ? 'צור משימה' : 'הצע משימה (ממתין לאישור)'}
                    </button>
                </form>
            )}

            <div className="task-board">
                {COLUMNS.map(col => (
                    <div key={col.key} className="task-column">
                        <div className="task-column-header">
                            {col.label}
                            <span className="task-count">{tasks.filter(t => t.status === col.key).length}</span>
                        </div>
                        {tasks.filter(t => t.status === col.key).map(task => (
                            <div key={task.id} className="task-card">
                                <strong>{task.title}</strong>
                                {task.description && <p>{task.description}</p>}
                                {task.assignee_name && <small>👤 {task.assignee_name}</small>}
                                {task.due_date && <small>📅 {new Date(task.due_date).toLocaleDateString('he-IL')}</small>}
                                <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                                    {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TasksTab;
