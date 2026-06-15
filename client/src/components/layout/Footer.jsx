import { Link, useLocation } from 'react-router-dom';
import '../../styles/components/Footer.css';

const HIDE_ON = ['/', '/login', '/register', '/blocked'];

export default function Footer() {
    const { pathname } = useLocation();
    if (HIDE_ON.includes(pathname)) return null;

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <span className="footer-brand">ProjectMatch</span>
                <nav className="footer-nav">
                    <Link to="/dashboard">דשבורד</Link>
                    <Link to="/projects">גילוי פרויקטים</Link>
                </nav>
                <span className="footer-copy">© {new Date().getFullYear()} כל הזכויות שמורות</span>
            </div>
        </footer>
    );
}
