import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDate, formatDateTime, categoryClass } from '../utils/format';

export default function NewsDetail() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const res = await fetch(`/api/news/${id}`);
        if (!res.ok) {
          setNotFound(true);
        } else {
          const data = await res.json();
          setAnnouncement(data.announcement);
          document.title = `${data.announcement.title} · M'Hamed Bougara University of Boumerdes`;
        }
      } catch (err) {
        console.error('Failed to load announcement:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncement();
  }, [id]);

  if (notFound) {
    return (
      <main id="main">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>Announcement not found</h2>
              <p>The announcement you are looking for may have been unpublished or removed.</p>
              <Link className="button button-primary" to="/news">
                Back to all announcements
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (loading || !announcement) {
    return (
      <main id="main">
        <div className="container" style={{ padding: '4rem 1rem' }}>
          <p>Loading announcement...</p>
        </div>
      </main>
    );
  }

  const isUpdated =
    announcement.updated_at &&
    formatDateTime(announcement.updated_at) !== formatDateTime(announcement.published_at);

  return (
    <main id="main">
      <article>
        <section className="page-hero article-hero">
          <div className="container">
            <Link className="back-link" to="/news">
              <span aria-hidden="true">&larr;</span> All announcements
            </Link>
            <div className="card-meta">
              <span className={`badge badge-${categoryClass(announcement.category)}`}>
                {announcement.category}
              </span>
              <time dateTime={new Date(announcement.published_at).toISOString()}>
                {formatDate(announcement.published_at)}
              </time>
            </div>
            <h1>{announcement.title}</h1>
            <p className="page-lead">{announcement.summary}</p>
          </div>
        </section>

        <section className="section article-section">
          <div className="container">
            {announcement.image_url && (
              <figure className="article-featured-media">
                <img
                  src={announcement.image_url}
                  alt={announcement.title}
                  className="article-featured-image"
                />
              </figure>
            )}
            <div className="article-body">
              <p style={{ whiteSpace: 'pre-line' }}>{announcement.body}</p>
            </div>
            {isUpdated && (
              <p className="article-updated">
                Last updated {formatDateTime(announcement.updated_at)}
              </p>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}
