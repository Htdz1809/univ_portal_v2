import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatDate, categoryClass } from '../utils/format';

export default function Home() {
  const location = useLocation();
  const [data, setData] = useState({
    recentAnnouncements: [],
    stats: { departments: 8, announcements: 0 },
  });
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const promoSectionRef = useRef(null);

  useEffect(() => {
    if (location.hash === '#about') {
      const timer = setTimeout(() => {
        const el = document.getElementById('about');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash, loading]);

  useEffect(() => {
    document.title = "Home · M'Hamed Bougara University of Boumerdes";
    document.body.className = 'page-home';

    async function loadHome() {
      try {
        const res = await fetch('/api/home');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHome();
  }, []);

  // Video autoplay & reduced motion logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncVideo = () => {
      if (reducedMotion.matches) {
        video.pause();
      } else {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      }
    };
    syncVideo();
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', syncVideo);
    }

    const showVideo = () => video.classList.add('is-loaded');
    if (video.readyState >= 2) {
      showVideo();
    } else {
      video.addEventListener('playing', showVideo, { once: true });
      video.addEventListener('canplay', showVideo, { once: true });
      video.addEventListener('loadeddata', showVideo, { once: true });
    }

    return () => {
      if (reducedMotion.removeEventListener) {
        reducedMotion.removeEventListener('change', syncVideo);
      }
    };
  }, []);

  // Promo section scroll-reveal animation
  useEffect(() => {
    const section = promoSectionRef.current;
    if (!section || !('IntersectionObserver' in window)) return;

    const cards = section.querySelectorAll('.promo-card');
    const getCols = () => {
      if (window.innerWidth <= 680) return 1;
      if (window.innerWidth <= 1080) return 2;
      return 3;
    };

    const updateCardDelays = () => {
      const cols = getCols();
      cards.forEach((card, index) => {
        card.style.setProperty('--card-index', index % cols);
      });
    };

    updateCardDelays();
    window.addEventListener('resize', updateCardDelays);

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    cards.forEach((card) => {
      card.classList.add('scroll-reveal');
      observer.observe(card);
    });

    return () => {
      window.removeEventListener('resize', updateCardDelays);
      observer.disconnect();
    };
  }, [loading]);

  const currentYear = new Date().getFullYear();
  const founded = 1998;
  const years = currentYear - founded;

  return (
    <main id="main">
      <section className="home-hero" aria-label="Welcome to M'Hamed Bougara University of Boumerdes">
        <h1 className="visually-hidden">M'Hamed Bougara University of Boumerdes - Higher education, research and innovation since 1998.</h1>
        <div className="hero-shapes" aria-hidden="true">
          <span className="hero-orb hero-orb-pink"></span>
          <span className="hero-orb hero-orb-blue"></span>
          <span className="hero-ring"></span>
          <span className="hero-cross"></span>
        </div>

        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex="-1"
        >
          <source src="/videos/pres.mp4" type="video/mp4" />
        </video>

        <div className="container hero-topline">
          <p className="hero-kicker">M'Hamed Bougara University of Boumerdes</p>
          <p className="hero-place"><span aria-hidden="true"></span> Boumerdes, Algeria</p>
        </div>

        <div className="container hero-foot">
          <p className="hero-lead">
            Higher education, research and innovation since 1998. Discover six
            faculties, two institutes and a community shaping the future of the
            Boumerdès region.
          </p>
          <div className="hero-actions">
            <Link className="pill-button pill-button-yellow" to="/departments">Explore academics</Link>
            <Link className="pill-button pill-button-ghost" to="/news">Latest news</Link>
          </div>
        </div>
      </section>

      <section className="promo-section" aria-label="Explore UMBB" ref={promoSectionRef}>
        <div className="promo-grid">
          <article className="promo-card theme-yellow">
            <p className="promo-eyebrow">Future students</p>
            <div className="promo-body">
              <h2 className="promo-title">Find your place at UMBB</h2>
              <p className="promo-desc">
                Explore {data.stats.departments} academic units spanning science,
                engineering, economics, law, languages and the arts of teaching.
              </p>
            </div>
            <div className="promo-footer">
              <Link className="pill-link" to="/departments">Explore academics</Link>
            </div>
          </article>

          <article className="promo-card theme-white">
            <p className="promo-eyebrow">Quick access</p>
            <nav className="promo-links" aria-label="Quick links">
              <Link to="/departments">Faculties &amp; institutes <span aria-hidden="true">↗</span></Link>
              <Link to="/news">News &amp; announcements <span aria-hidden="true">↗</span></Link>
              <a href="/#about">About the university <span aria-hidden="true">↗</span></a>
            </nav>
            <div className="promo-footer">
              <p className="promo-desc">
                A public university created in 1998, serving students and the
                economic and social life of Boumerdès.
              </p>
            </div>
          </article>

          <article className="promo-card theme-pink">
            <div className="promo-art" aria-hidden="true"></div>
            <p className="promo-eyebrow">About UMBB</p>
            <div className="promo-body">
              <h2 className="promo-title">Six faculties. Two institutes.</h2>
              <p className="promo-desc">
                One community bringing together teaching, research and public
                service across the Boumerdès region.
              </p>
            </div>
            <div className="promo-footer">
              <a className="pill-link" href="/#about">Discover our story</a>
            </div>
          </article>

          <article className="promo-card theme-blue">
            <p className="promo-eyebrow">Newsroom</p>
            <div className="promo-body">
              <h2 className="promo-title">Latest from campus</h2>
              <p className="promo-desc">
                Academic notices, events and stories from across our faculties and
                institutes.
              </p>
            </div>
            <div className="promo-footer">
              <Link className="pill-link" to="/news">Read announcements</Link>
            </div>
          </article>

          <article className="promo-card theme-green promo-card-media">
            <div className="promo-media-art" aria-hidden="true"></div>
            <p className="promo-eyebrow">Campus &amp; Sites</p>
            <div className="promo-body">
              <h2 className="promo-title">Faculties Localization</h2>
              <div className="campus-locations-list">
                <div className="campus-loc-item">
                  <strong>West / Central Campus:</strong>
                  <span>Sciences (FS) · Hydrocarbons &amp; Chemistry (FHC) · Technology (FT)</span>
                </div>
                <div className="campus-loc-item">
                  <strong>East Campus:</strong>
                  <span>Electrical &amp; Electronic Engineering (IGEE / ex-INELEC)</span>
                </div>
                <div className="campus-loc-item">
                  <strong>Sahel Pole:</strong>
                  <span>Economics &amp; Management (FSG) · Law &amp; Political Science (FDSP)</span>
                </div>
                <div className="campus-loc-item">
                  <strong>Downtown &amp; Bordj Ménaïel Pole:</strong>
                  <span>Letters &amp; Languages (FLL) · Applied Technology (ISTA)</span>
                </div>
              </div>
            </div>
            <div className="promo-footer">
              <a className="pill-link" href="https://maps.google.com/?q=Universite+M'Hamed+Bougara+Boumerdes" target="_blank" rel="noopener noreferrer">
                View on Map ↗
              </a>
            </div>
          </article>

          <article className="promo-card theme-yellow">
            <p className="promo-eyebrow">Research &amp; Innovation</p>
            <div className="promo-body">
              <h2 className="promo-title">Scientific research</h2>
              <p className="promo-desc">
                Laboratories and research teams contributing to engineering,
                hydrocarbons, chemistry and applied sciences.
              </p>
            </div>
            <div className="promo-footer">
              <Link className="pill-link" to="/departments">Explore faculties</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="home-news" id="news">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest updates</p>
              <h2>Recent announcements</h2>
            </div>
            <div className="section-heading-aside">
              <p>
                Notices, events and stories published by the university. Visit the
                newsroom for the full archive.
              </p>
              <Link className="text-link" to="/news">All announcements <span aria-hidden="true">↗</span></Link>
            </div>
          </div>

          {data.recentAnnouncements.length === 0 ? (
            <div className="empty-state">
              <h3>No announcements yet</h3>
              <p>Published news and announcements will appear here.</p>
            </div>
          ) : (
            <div className="story-grid">
              {data.recentAnnouncements.map((announcement) => (
                <article key={announcement.id} className={`story-card ${announcement.image_url ? 'has-card-image' : ''}`}>
                  {announcement.image_url && (
                    <div className="story-cover">
                      <img src={announcement.image_url} alt="" className="story-cover-image" loading="lazy" />
                    </div>
                  )}
                  <div className="story-meta">
                    <span className={`badge badge-${categoryClass(announcement.category)}`}>
                      {announcement.category}
                    </span>
                    <time dateTime={new Date(announcement.published_at).toISOString()}>
                      {formatDate(announcement.published_at)}
                    </time>
                  </div>
                  <h3><Link to={`/news/${announcement.id}`}>{announcement.title}</Link></h3>
                  <p>{announcement.summary}</p>
                  <Link className="story-link" to={`/news/${announcement.id}`}>
                    Read story <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-about" id="about">
        <div className="container about-grid">
          <div className="about-statement">
            <p className="eyebrow">About the university</p>
            <h2>Teaching, research and public service.</h2>
          </div>
          <div className="about-copy">
            <p className="about-lead">Higher education, research and innovation since 1998.</p>
            <p>
              UMBB was created in 1998 by Executive Decree 98-189. Its academic
              units cover science and technology, hydrocarbons and chemistry,
              economics and management, law and political science, languages,
              electrical engineering and applied sciences.
            </p>
            <Link className="text-link" to="/departments">Discover our academic units <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className="container stat-strip" aria-label="University at a glance">
          <div className="stat-block">
            <strong>{data.stats.departments}</strong>
            <span>Faculties and institutes</span>
          </div>
          <div className="stat-block">
            <strong>{data.stats.announcements}</strong>
            <span>Published announcements</span>
          </div>
          <div className="stat-block">
            <strong>{years}</strong>
            <span>Years of higher education</span>
          </div>
        </div>
      </section>
    </main>
  );
}
