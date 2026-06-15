import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaInfoCircle } from "react-icons/fa";
import api from "../services/api";
import SkillSelector from "../components/SkillSelector";
import { useToast } from "../context/ToastContext";
import "../styles/pages/Register.css";

function Register() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [form, setForm] = useState({ username: "", email: "", password: "", bio: "", role: "creator" });
  const [profileImage, setProfileImage] = useState(null);
  const [skills, setSkills] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};
    if (!form.username.trim()) errors.username = "שם משתמש הוא שדה חובה";
    else if (form.username.length < 3) errors.username = "שם משתמש חייב להכיל לפחות 3 תווים";
    if (!form.email.trim()) errors.email = "אימייל הוא שדה חובה";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "כתובת אימייל לא תקינה";
    if (!form.password) errors.password = "סיסמה היא שדה חובה";
    else if (form.password.length < 6) errors.password = "סיסמה חייבת להכיל לפחות 6 תווים";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("bio", form.bio);
      formData.append("role", form.role);
      if (profileImage) formData.append("profileImage", profileImage);
      formData.append("skills", JSON.stringify(skills));

      await api.post("/auth/register", formData, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/login");
    } catch (err) {
      showError(err.response?.data?.message || "שגיאה בהרשמה, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: "" }));
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>ברוכים הבאים ל-ProjectMatch</h1>
        <p className="subtitle">צרו חשבון והתחילו לשתף פעולה</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <FaUser className="icon" />
            <input type="text" placeholder="שם משתמש" value={form.username}
              onChange={e => setField('username', e.target.value)}
              className={fieldErrors.username ? 'input-error' : ''} />
            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
          </div>

          <div className="input-group">
            <FaEnvelope className="icon" />
            <input type="email" placeholder="אימייל" value={form.email}
              onChange={e => setField('email', e.target.value)}
              className={fieldErrors.email ? 'input-error' : ''} />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          <div className="input-group">
            <FaLock className="icon" />
            <input type="password" placeholder="סיסמה (לפחות 6 תווים)" value={form.password}
              onChange={e => setField('password', e.target.value)}
              className={fieldErrors.password ? 'input-error' : ''} />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>



          <div className="input-group">
            <FaInfoCircle className="icon" />
            <textarea placeholder="ספר קצת על עצמך... (אופציונלי)" value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
          </div>

          <div className="register-skills">
            <SkillSelector selected={skills} onChange={setSkills} label="מה אני יודע לעשות" />
          </div>

          <div className="input-group">
            <label className="file-label">תמונת פרופיל (אופציונלי)</label>
            <input type="file" accept="image/*" onChange={e => setProfileImage(e.target.files[0])} className="file-input" />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'נרשם...' : 'הרשמה'}
          </button>
        </form>

        <div className="auth-footer">
          <p>כבר יש לך חשבון? <Link to="/login">התחבר כאן</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
