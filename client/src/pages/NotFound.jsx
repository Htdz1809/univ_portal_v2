import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found · M'Hamed Bougara University of Boumerdes";
    document.body.className = 'page-general';
  }, []);

  return (
    <main id="main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">404</p>
          <h1>Page not found</h1>
          <p className="page-lead">
            The page you requested could not be found or may have been moved.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link className="button button-primary" to="/">
              Return to home page
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
