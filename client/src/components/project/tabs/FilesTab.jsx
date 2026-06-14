import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import '../../../styles/components/ProjectComponents.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getFileIcon = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (['jpg','jpeg','png','gif','svg'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    if (['mp4','mov','avi'].includes(ext)) return '🎬';
    if (['mp3','wav'].includes(ext)) return '🎵';
    if (['zip','rar'].includes(ext)) return '🗜️';
    if (['doc','docx'].includes(ext)) return '📝';
    return '📎';
};

const FilesTab = ({ projectId }) => {
    const { showSuccess, showError } = useToast();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchFiles = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/files`);
            setFiles(res.data);
        } catch { console.error('שגיאה בטעינת קבצים'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFiles(); }, [projectId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/projects/${projectId}/upload-file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('הקובץ הועלה בהצלחה!');
            fetchFiles();
        } catch { showError('שגיאה בהעלאת הקובץ'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    return (
        <div className="files-tab">
            <div className="files-header">
                <h3>קבצים מצורפים ({files.length})</h3>
                <label className="upload-label">
                    {uploading ? 'מעלה...' : '+ העלה קובץ'}
                    <input
                        type="file"
                        accept="image/*,audio/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </label>
            </div>
            {loading ? <p className="loading-state">טוען קבצים...</p>
                : files.length === 0 ? <p className="empty-state">אין קבצים עדיין</p>
                : (
                    <div className="files-list">
                        {files.map(file => (
                            <a key={file.id} href={`${API_BASE}${file.file_path}`} target="_blank" rel="noreferrer" className="file-item">
                                <span className="file-icon">{getFileIcon(file.file_name)}</span>
                                <span className="file-name">{file.file_name}</span>
                                <small className="file-date">{new Date(file.uploaded_at).toLocaleDateString('he-IL')}</small>
                            </a>
                        ))}
                    </div>
                )}
        </div>
    );
};

export default FilesTab;
