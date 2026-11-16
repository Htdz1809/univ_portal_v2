import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAboutInView, setIsAboutInView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track if About section is in view on the home page
  useEffect(() => {
    if (location.pathname !== '/') {
      setIsAboutInView(false);
      return;
    }

    if (location.hash === '#about') {
      setIsAboutInView(true);
    }

    const aboutEl = document.getElementById('about');
    if (!aboutEl || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsAboutInView(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(aboutEl);
    return () => observer.disconnect();
  }, [location.pathname, location.hash]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
      setIsAboutInView(false);
    }
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById('about');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      window.history.pushState(null, '', '/#about');
      setIsAboutInView(true);
    } else {
      navigate('/#about');
    }
  };

  const isAcademics = location.pathname.startsWith('/departments');
  const isNews = location.pathname.startsWith('/news');
  const isAdmin = location.pathname.startsWith('/admin');
  const isAboutActive = location.pathname === '/' && (location.hash === '#about' || isAboutInView);
  const isHomeActive = location.pathname === '/' && !isAboutActive;

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
