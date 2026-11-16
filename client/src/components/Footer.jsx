import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div>
          <Link className="brand brand-footer" to="/">
            <img className="brand-mark" src="/images/umbb-logo.png" alt="" width="40" height="40" />
            <span className="brand-text">
              <strong>UMBB</strong>
              <small>Boumerdes</small>
            </span>
          </Link>
          <p className="footer-about">
            M'Hamed Bougara University of Boumerdes (UMBB) is a public university established in 1998 by Executive Decree 98-189. Its six faculties and two institutes cover science and technology, hydrocarbons and chemistry, economics and management, law and political science, languages, electrical engineering and applied sciences.
          </p>
        </div>

        <div>
          <h2>Contact</h2>
          <address>
            Independence Avenue, 35000 Boumerdes, Algeria<br />
            <a href="mailto:contact@univ-boumerdes.dz">contact@univ-boumerdes.dz</a><br />
            <a href="tel:+21324795275">+213 24 79 52 75</a>
          </address>
        </div>

        <div>
          <h2>Explore</h2>
          <ul className="footer-links">
            <li><Link to="/departments">Faculties and institutes</Link></li>
            <li><Link to="/news">News and announcements</Link></li>
            <li><a href="/#about">About UMBB</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>&copy; {currentYear} M'Hamed Bougara University of Boumerdes</p>
        <p>Academic demonstration portal; not an official university website.</p>
      </div>
    </footer>
  );
}
