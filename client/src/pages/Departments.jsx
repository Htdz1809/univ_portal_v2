import React, { useState, useEffect } from 'react';

const facultyLogoMap = {
  'Faculty of Sciences': '/images/fs.png',
  'Faculty of Technology': '/images/ft.png',
  'Faculty of Hydrocarbons and Chemistry': '/images/fhc.png',
  'Faculty of Economic, Commercial and Management Sciences': '/images/fsecsg.png',
  'Faculty of Economics, Commercial and Management Sciences': '/images/fsecsg.png',
  'Faculty of Law and Political Science': '/images/fdsp.png',
  'Faculty of Letters and Languages': '/images/fll.png',
  'Institute of Electrical and Electronic Engineering': '/images/igee.png',
  'Institute of Applied Science and Technology': '/images/ista.png',
  'Institute of Applied Sciences and Technology': '/images/ista.png',

  // French fallback
  'Faculté des Sciences': '/images/fs.png',
  'Faculté de Technologie': '/images/ft.png',
  'Faculté des Hydrocarbures et de la Chimie': '/images/fhc.png',
  'Faculté des Sciences Economiques, Commerciales et des Sciences de Gestion': '/images/fsecsg.png',
  'Faculté de Droit et des Sciences Politiques': '/images/fdsp.png',
  'Faculté des Lettres et des Langues': '/images/fll.png',
  'Institut de Génie Electrique et Electronique': '/images/igee.png',
  'Institut des Sciences et Techniques Appliquées': '/images/ista.png',
};

function getDepartmentLogo(name) {
  if (facultyLogoMap[name]) return facultyLogoMap[name];
  const lower = (name || '').toLowerCase();
  if (lower.includes('hydrocarbon') || lower.includes('chimie')) return '/images/fhc.png';
  if (lower.includes('technolog')) return '/images/ft.png';
  if (lower.includes('econom') || lower.includes('gestion')) return '/images/fsecsg.png';
  if (lower.includes('droit') || lower.includes('law')) return '/images/fdsp.png';
  if (lower.includes('lettre') || lower.includes('letter') || lower.includes('language')) return '/images/fll.png';
  if (lower.includes('electr') || lower.includes('igee') || lower.includes('inelec')) return '/images/igee.png';
  if (lower.includes('appliqu') || lower.includes('applied') || lower.includes('ista')) return '/images/ista.png';
  if (lower.includes('science')) return '/images/fs.png';
  return null;
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Departments · M'Hamed Bougara University of Boumerdes";
    document.body.className = 'page-academics';

    async function loadDepartments() {
      try {
        const res = await fetch('/api/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDepartments();
  }, []);

  return (
    <main id="main">
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Academic units</p>
            <h1>Our faculties and institutes</h1>
          </div>
          <p className="page-lead">
            UMBB's academic units combine teaching, research and community
            activities. Contact the faculty or institute office for programme and
            admissions questions.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!loading && departments.length === 0 ? (
            <div className="empty-state">
              <h2>No academic units available</h2>
              <p>Faculty and institute information will appear here once it is added.</p>
            </div>
          ) : (
            <div className="card-grid department-grid">
              {departments.map((department, index) => {
                const isInstitute =
                  department.name.toLowerCase().includes('institut') ||
                  department.name.toLowerCase().includes('institute');
                const unitType = isInstitute ? 'Institute' : 'Faculty';
                const logoSrc = getDepartmentLogo(department.name);

                return (
                  <article key={department.id} className="card department-card">
                    <div className="card-topline">
                      {logoSrc && (
                        <div className="department-emblem">
                          <img
                            src={logoSrc}
                            alt={`${department.name} logo`}
                            className="department-logo"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="department-meta">
                        <span className="department-mark" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="card-label">{unitType}</span>
                      </div>
                    </div>
                    <h2>{department.name}</h2>
                    <p>{department.description}</p>
                    <dl className="detail-list">
                      <div>
                        <dt>Dean / Director</dt>
                        <dd>{department.head_of_department}</dd>
                      </div>
                      <div>
                        <dt>Contact</dt>
                        <dd>
                          <a href={`mailto:${department.contact_email}`}>
                            {department.contact_email}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
