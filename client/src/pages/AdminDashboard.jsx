import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, categoryClass } from '../utils/format';

export default function AdminDashboard() {
  const { user, loading: authLoading, setFlash } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || { total: 0, published: 0, drafts: 0 });
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Administration · M'Hamed Bougara University of Boumerdes";
    document.body.className = 'page-admin';

    if (!authLoading) {
      if (!user) {
        navigate('/admin/login', { replace: true });
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, navigate, fetchDashboardData]);

  const handleDelete = async (announcement) => {
    const confirmed = window.confirm(
      `Delete announcement "${announcement.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFlash({
          type: 'warning',
          message: `Announcement #${announcement.id} deleted.`,
        });
        fetchDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete announcement.');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Error deleting announcement.');
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <main id="main">
        <div className="container" style={{ padding: '4rem 1rem' }}>
          <p>Loading administration area...</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main">
      <section className="page-hero page-hero-admin">
        <div className="container">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">Staff area</p>
              <h1>Announcement administration</h1>
              <p className="page-lead">
                Create, edit, publish or remove announcements. Changes are written
                directly to PostgreSQL and appear on the public site immediately.
              </p>
            </div>
            <div className="admin-heading-actions">
              <Link className="button button-primary" to="/admin/announcements/new">
                New announcement
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-admin">
        <div className="container">
          <div className="stats-grid" aria-label="Announcement statistics">
            <div className="stat-card">
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-card">
              <span>Published</span>
              <strong>{stats.published}</strong>
            </div>
            <div className="stat-card">
              <span>Drafts</span>
              <strong>{stats.drafts}</strong>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="empty-state">
              <h2>No announcements yet</h2>
              <p>Create the first announcement to populate the public news page.</p>
              <Link className="button button-primary" to="/admin/announcements/new">
                Create announcement
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <caption className="visually-hidden">All announcements</caption>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>
                    <th scope="col">Published</th>
                    <th scope="col">Updated</th>
                    <th scope="col" className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr key={announcement.id}>
                      <td>
                        <div className="table-title-cell">
                          {announcement.image_url && (
                            <img
                              src={announcement.image_url}
                              alt=""
                              className="table-row-thumb"
                              loading="lazy"
                            />
                          )}
                          <div className="table-title-content">
                            <Link className="table-title" to={`/news/${announcement.id}`}>
                              {announcement.title}
                            </Link>
                            <span className="table-summary">{announcement.summary}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${categoryClass(announcement.category)}`}>
                          {announcement.category}
                        </span>
                      </td>
                      <td>
                        {announcement.is_published ? (
                          <span className="status status-live">Published</span>
                        ) : (
                          <span className="status status-draft">Draft</span>
                        )}
                      </td>
                      <td>{formatDate(announcement.published_at)}</td>
                      <td>{formatDateTime(announcement.updated_at)}</td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="button button-small button-secondary"
                            to={`/admin/announcements/${announcement.id}/edit`}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="button button-small button-danger"
                            onClick={() => handleDelete(announcement)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
