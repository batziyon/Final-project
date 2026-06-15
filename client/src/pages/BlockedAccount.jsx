import { useAuth } from "../context/AuthContext";
import "../styles/pages/BlockedAccount.css";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@projectmatch.com";

function BlockedAccount() {
  const { logout } = useAuth();

  return (
    <div className="blocked-page">
      <div className="blocked-card">
        <div className="blocked-icon">🚫</div>
        <h1>החשבון שלך נחסם</h1>
        <p>הגישה למערכת נחסמה על ידי מנהל המערכת.</p>
        <div className="blocked-contact">
          <span>כדי לשחרר את החסימה, פנה ישירות למנהל המערכת:</span>
          <a className="blocked-email" href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a>
        </div>
      </div>
    </div>
  );
}

export default BlockedAccount;
