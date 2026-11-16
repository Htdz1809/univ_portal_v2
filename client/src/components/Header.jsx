import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const isHome = location.pathname === '/';
  const isAcademics = location.pathname.startsWith('/departments');
  const isNews = location.pathname.startsWith('/news');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-shell">
          <Link className="brand" to="/" aria-label="M'Hamed Bougara University of Boumerdes home">
            <img className="brand-mark" src="/images/umbb-logo.png" alt="" width="46" height="46" />
            <span className="brand-text">
              <strong>UMBB</strong>
              <small>Boumerdes</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            <Link to="/" className={isHome ? 'active' : ''} aria-current={isHome ? 'page' : undefined}>
              Home
            </Link>
            <Link to="/departments" className={isAcademics ? 'active' : ''} aria-current={isAcademics ? 'page' : undefined}>
              Academics
            </Link>
            <Link to="/news" className={isNews ? 'active' : ''} aria-current={isNews ? 'page' : undefined}>
              News &amp; events
            </Link>
            <a href="/#about">About</a>
            {user && (
              <Link to="/admin" className={isAdmin ? 'active' : ''} aria-current={isAdmin ? 'page' : undefined}>
                Dashboard
              </Link>
            )}
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <Link to="/admin/announcements/new" className="header-staff header-add-btn">
                  + Add announcement
                </Link>
                <button type="button" onClick={handleSignOut} className="header-staff">
                  Sign out
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
