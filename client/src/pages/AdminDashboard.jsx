import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Loader, EmptyState, Badge, Button } from '../components/common';
import '../styles/pages/AdminDashboard.css';

const roleLabel = { creator: '👑 יוצר', listener: '🔍 מחפש', admin: '👮 מנהל' };

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch { showError('שגיאה בטעינת משתמשים'); }
        finally { setLoading(false); }
    };

    const handleToggle = async (userId, currentStatus) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            await api.put(`/admin/users/${userId}/toggle`, { isActive: newStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
            showSuccess(`סטטוס המשתמש עודכן ל-${newStatus === 1 ? 'פעיל' : 'חסום'}`);
        } catch { showError('שגיאה בעדכון סטטוס המשתמש'); }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>👮 פאנל ניהול מערכת</h1>
                    <p>ניהול וניטור משתמשי המערכת</p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>⬅️ חזרה לדשבורד</Button>
            </div>

            <div className="admin-stats">
                {[
                    { label: 'סה"כ משתמשים', value: users.length, cls: '' },
                    { label: 'פעילים', value: users.filter(u => u.is_active === 1).length, cls: 'success' },
                    { label: 'חסומים', value: users.filter(u => u.is_active === 0).length, cls: 'danger' },
                ].map(s => (
                    <div key={s.label} className={`admin-stat-card ${s.cls}`}>
                        <span className="admin-stat-value">{s.value}</span>
                        <span className="admin-stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <Loader text="טוען משתמשים..." />
            ) : users.length === 0 ? (
                <EmptyState icon="👥" title="אין משתמשים במערכת" />
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>שם משתמש</th><th>אימייל</th>
                                <th>תפקיד</th><th>סטטוס</th><th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td><strong>{user.username}</strong></td>
                                    <td>{user.email}</td>
                                    <td><Badge variant="primary">{roleLabel[user.role] || user.role}</Badge></td>
                                    <td>
                                        <Badge variant={user.is_active === 1 ? 'success' : 'danger'}>
                                            {user.is_active === 1 ? '✅ פעיל' : '🚫 חסום'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Button
                                            variant={user.is_active === 1 ? 'danger' : 'success'}
                                            size="sm"
                                            onClick={() => handleToggle(user.id, user.is_active)}
                                        >
                                            {user.is_active === 1 ? '🔒 חסום' : '🔓 שחרר'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
