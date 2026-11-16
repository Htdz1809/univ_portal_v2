import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminAnnouncementForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, loading: authLoading, setFlash } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Announcement');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [categories, setCategories] = useState(['News', 'Announcement', 'Event']);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    document.title = `${isEdit ? 'Edit announcement' : 'New announcement'} · M'Hamed Bougara University of Boumerdes`;
    document.body.className = 'page-admin';

    if (!authLoading && !user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (isEdit) {
      async function loadAnnouncement() {
        try {
          const res = await fetch(`/api/admin/announcements/${id}`);
          if (!res.ok) {
            navigate('/admin');
            return;
          }
          const data = await res.json();
          const ann = data.announcement;
          setTitle(ann.title || '');
          setCategory(ann.category || 'Announcement');
          setSummary(ann.summary || '');
          setBody(ann.body || '');
          setImageUrl(ann.image_url || '');
          setIsPublished(ann.is_published !== false);
        } catch (err) {
          console.error('Failed to load announcement:', err);
          navigate('/admin');
        } finally {
          setLoading(false);
        }
      }
      loadAnnouncement();
    }
  }, [id, isEdit, user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('summary', summary);
      formData.append('body', body);
      formData.append('image_url', imageUrl);
      formData.append('is_published', isPublished ? 'true' : 'false');

      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (removeImage) {
        formData.append('remove_image', '1');
      }

      const url = isEdit
        ? `/api/admin/announcements/${id}`
        : '/api/admin/announcements';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors);
        } else {
          setErrors([data.error || 'Failed to save announcement.']);
        }
      } else {
        setFlash({
          type: 'success',
          message: data.message || `Announcement ${isEdit ? 'updated' : 'created'}.`,
        });
        navigate('/admin');
      }
    } catch (err) {
      console.error('Failed to submit announcement:', err);
      setErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (isEdit && loading)) {
    return (
      <main id="main">
        <div className="container" style={{ padding: '4rem 1rem' }}>
          <p>Loading form...</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main">
      <section className="page-hero page-hero-admin">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Staff area</p>
            <h1>{isEdit ? 'Edit announcement' : 'New announcement'}</h1>
          </div>
          <p className="page-lead">
            {isEdit
              ? 'Update the announcement. Changes are saved to the database when you submit the form.'
              : 'Write a clear title and summary. Published announcements appear on the home page and news page.'}
          </p>
        </div>
      </section>

      <section className="section section-tight section-admin">
        <div className="container container-form">
          {errors.length > 0 && (
            <div className="alert alert-error" role="alert">
              <strong>Please correct the following:</strong>
              <ul>
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="card form-card">
            <label>
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={3}
                maxLength={160}
                required
              />
              <small>3 to 160 characters.</small>
            </label>

            <label>
              <span>Category</span>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Summary</span>
              <textarea
                name="summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                minLength={10}
                maxLength={300}
                required
              />
              <small>Shown in the announcement list. 10 to 300 characters.</small>
            </label>

            <label>
              <span>Full text</span>
              <textarea
                name="body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                minLength={10}
                maxLength={10000}
                required
              />
              <small>10 to 10,000 characters. Line breaks are preserved.</small>
            </label>

            <div className="form-media-section">
              <label>
                <span>Announcement image (optional)</span>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                />
                <small>Upload an image from your computer (PNG, JPG, WebP, GIF, SVG up to 8MB).</small>
              </label>

              {imageUrl && !removeImage && (
                <div className="current-image-box">
                  <span className="preview-badge">Current attached image</span>
                  <div className="preview-container">
                    <img src={imageUrl} alt="Current announcement" className="form-image-thumb" />
                    <div className="preview-controls">
                      <span className="preview-url">{imageUrl}</span>
                      <label className="checkbox-field remove-image-checkbox">
                        <input
                          type="checkbox"
                          checked={removeImage}
                          onChange={(e) => setRemoveImage(e.target.checked)}
                        />
                        <span>Remove current image</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <label>
                <span>Or enter image URL / path (optional)</span>
                <input
                  type="text"
                  name="image_url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. /images/fs.png or https://..."
                />
                <small>Optional image link if you don't upload a file directly.</small>
              </label>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                name="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span>Published (visible on the public site)</span>
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={submitting}>
                {submitting
                  ? 'Saving...'
                  : isEdit
                  ? 'Save changes'
                  : 'Create announcement'}
              </button>
              <Link className="button button-ghost-dark" to="/admin">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
