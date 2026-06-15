import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/pages/Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';
  const { user, login } = useAuth();
  const { showError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser?.role?.toLowerCase() === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      if (error.response?.status === 403) {
        navigate('/blocked', { replace: true });
      } else {
        const message = error.response?.data?.message || "אימייל או סיסמה שגויים";
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>התחברות</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'מתחבר...' : 'כניסה'}</button>
        </form>
        <div className="auth-footer">
          <p>אין חשבון? <Link to="/register">הרשמה</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
