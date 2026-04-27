import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-brand">
        <span className="brand-icon">◇</span>
        <span className="brand-text">CollabxDraw</span>
      </Link>

      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="nav-btn nav-btn-outline" id="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/signup" className="nav-btn nav-btn-primary" id="signup-nav-btn">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
