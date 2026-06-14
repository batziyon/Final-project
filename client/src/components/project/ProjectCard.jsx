import { useAuth } from '../../context/AuthContext';

export default function ProjectCard({ project, onClick }) {
  const { user } = useAuth();
  const isOwner = user?.id === project.owner_id;

  const paymentLabel = { paid: '💰 בתשלום', volunteer: '🤝 התנדבותי', equity: '📈 אקוויטי' };
  const locationLabel = { remote: '🌐 מרחוק', physical: '📍 פיזי', hybrid: '🔀 היברידי' };

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-top">
        <h3>{project.title}</h3>
        <span className="project-card-category">{project.category}</span>
      </div>

      <p className="project-card-desc">{project.description?.substring(0, 110)}{project.description?.length > 110 ? '...' : ''}</p>

      <div className="project-card-meta">
        <span className="meta-item">👤 בעלים: <strong>{isOwner ? 'אני' : project.owner_name}</strong></span>
        <span className="meta-item">👥 {project.member_count || 1} חברים</span>
        {project.payment_status && <span className="meta-item">{paymentLabel[project.payment_status] || project.payment_status}</span>}
        {project.remote_or_physical && <span className="meta-item">{locationLabel[project.remote_or_physical] || project.remote_or_physical}</span>}
      </div>

      {project.open_roles && (
        <div className="project-card-roles">
          <span>מחפשים:</span>
          {project.open_roles.split(',').slice(0, 3).map((r, i) => (
            <span key={i} className="role-tag">{r.trim()}</span>
          ))}
        </div>
      )}

      <div className="project-card-footer">
        {project.is_startup ? <span className="badge-startup">🏢 סטארטאפ</span> : project.is_open_source ? <span className="badge-oss">🔓 Open Source</span> : <span />}
        <button className="btn-details" onClick={e => { e.stopPropagation(); onClick?.(); }}>ראה פרטים ←</button>
      </div>
    </div>
  );
}
