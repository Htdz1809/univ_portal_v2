import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active section on home page based on scroll and hash
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('none');
      return;
    }

    if (location.hash === '#about') {
      setActiveSection('about');
    } else {
      setActiveSection('home');
    }

    const handleScrollCheck = () => {
      const aboutEl = document.getElementById('about');
      if (!aboutEl) return;
      const rect = aboutEl.getBoundingClientRect();
      if (rect.top <= 250 && rect.bottom >= 150) {
        setActiveSection('about');
      } else if (rect.top > 250) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScrollCheck, { passive: true });
    // Initial check
    const timer = setTimeout(handleScrollCheck, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScrollCheck);
    };
  }, [location.pathname, location.hash]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setActiveSection('home');
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/', { replace: true });
    } else {
      navigate('/');
    }
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setActiveSection('about');
    if (location.pathname === '/') {
      const el = document.getElementById('about');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      navigate('/#about', { replace: true });
    } else {
      navigate('/#about');
    }
  };

  const isAcademics = location.pathname.startsWith('/departments');
  const isNews = location.pathname.startsWith('/news');
  const isAdmin = location.pathname.startsWith('/admin');

  const isHomeActive = location.pathname === '/' && activeSection === 'home';
  const isAboutActive = location.pathname === '/' && activeSection === 'about';

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-shell">
          <Link
            className="brand"
            to="/"
            onClick={handleHomeClick}
            aria-label="M'Hamed Bougara University of Boumerdes home"
          >
            <img className="brand-mark" src="/images/umbb-logo.png" alt="" width="46" height="46" />
            <span className="brand-text">
              <strong>UMBB</strong>
              <small>Boumerdes</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={isHomeActive ? 'active' : ''}
              aria-current={isHomeActive ? 'page' : undefined}
            >
              Home
            </Link>
            <Link
              to="/departments"
              className={isAcademics ? 'active' : ''}
              aria-current={isAcademics ? 'page' : undefined}
            >
              Academics
            </Link>
            <Link
              to="/news"
              className={isNews ? 'active' : ''}
              aria-current={isNews ? 'page' : undefined}
            >
              News &amp; events
            </Link>
            <a
              href="/#about"
              onClick={handleAboutClick}
              className={isAboutActive ? 'active' : ''}
              aria-current={isAboutActive ? 'page' : undefined}
            >
              About
            </a>
            {user && (
              <Link
                to="/admin"
                className={isAdmin ? 'active' : ''}
                aria-current={isAdmin ? 'page' : undefined}
              >
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
