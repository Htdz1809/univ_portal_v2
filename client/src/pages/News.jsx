import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate, categoryClass } from '../utils/format';

export default function News() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentQ = searchParams.get('q') || '';

  const [categoryInput, setCategoryInput] = useState(currentCategory);
  const [qInput, setQInput] = useState(currentQ);

  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState(['News', 'Announcement', 'Event']);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async (cat, q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      if (q) params.set('q', q);

      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "News & Events · M'Hamed Bougara University of Boumerdes";
    document.body.className = 'page-news';
    setCategoryInput(currentCategory);
    setQInput(currentQ);
    fetchNews(currentCategory, currentQ);
  }, [currentCategory, currentQ, fetchNews]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const nextParams = {};
    if (categoryInput) nextParams.category = categoryInput;
    if (qInput.trim()) nextParams.q = qInput.trim();
    setSearchParams(nextParams);
  };

  const handleClearFilters = (e) => {
    e.preventDefault();
    setCategoryInput('');
    setQInput('');
    setSearchParams({});
  };

  const hasFilter = Boolean(currentCategory || currentQ);

  return (
    <main id="main">
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Stay informed</p>
            <h1>News and announcements</h1>
          </div>
          <div>
            <p className="page-lead">
              Updates from UMBB, including academic notices, events and research
              stories from across its faculties and institutes.
            </p>
            {user && (
              <div style={{ marginTop: '1.25rem' }}>
                <Link className="button button-primary" to="/admin/announcements/new">
                  + Add announcement
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form className="filter-bar" onSubmit={handleFilterSubmit} aria-label="Filter announcements">
            <label>
              <span>Category</span>
              <select
                name="category"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-search">
              <span>Search</span>
              <input
                type="search"
                name="q"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search announcements"
                maxLength={100}
              />
            </label>
            <button className="button button-secondary" type="submit">
              Filter
            </button>
            {hasFilter && (
              <a className="text-link" href="#clear" onClick={handleClearFilters}>
                Clear filters
              </a>
            )}
          </form>

          {!loading && announcements.length === 0 ? (
            <div className="empty-state">
              <h2>No matching announcements</h2>
              <p>
                Try a different category or search term, or{' '}
                <a href="#view-all" onClick={handleClearFilters}>
                  view all announcements
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="result-count">
                {announcements.length} announcement{announcements.length === 1 ? '' : 's'}
              </p>
              <div className="announcement-list">
                {announcements.map((announcement, index) => (
                  <article key={announcement.id} className="announcement-row">
                    <div className="announcement-row-meta">
                      <span className="announcement-index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`badge badge-${categoryClass(announcement.category)}`}>
                        {announcement.category}
                      </span>
                      <time dateTime={new Date(announcement.published_at).toISOString()}>
                        {formatDate(announcement.published_at)}
                      </time>
                    </div>
                    <div className="announcement-main">
                      {announcement.image_url && (
                        <div className="announcement-thumb-wrap">
                          <img
                            src={announcement.image_url}
                            alt=""
                            className="announcement-thumb"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="announcement-copy">
                        <h2>
                          <Link to={`/news/${announcement.id}`}>{announcement.title}</Link>
                        </h2>
                        <p>{announcement.summary}</p>
                      </div>
                    </div>
                    <Link
                      className="text-link"
                      to={`/news/${announcement.id}`}
                      aria-label={`Read ${announcement.title}`}
                    >
                      Read <span aria-hidden="true">&nearr;</span>
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
