function Dashboard({
  notes = [],
  userName = "Student",
  onNavigate,
}) {
  const subjects = new Set(
    notes.map((note) => note.subject).filter(Boolean)
  );

  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    .slice(0, 3);

  return (
    <div className="dashboard">
      {/* Welcome banner */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <span className="hero-label">YOUR LEARNING SPACE</span>

          <h2>Ready to learn, {userName}?</h2>

          <p>
            Discover study materials, explore subjects, and share
            your knowledge with your campus community.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("My Notes")}
          >
            Browse Notes <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="hero-decoration" aria-hidden="true">
          <div className="hero-document hero-document-back"></div>

          <div className="hero-document hero-document-front">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="dashboard-stats" aria-label="Study statistics">
        <article className="stat-card">
          <div className="stat-icon stat-icon-purple">N</div>

          <div>
            <p>Available Notes</p>
            <h3>{notes.length}</h3>
            <span>Approved study materials</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-icon-blue">S</div>

          <div>
            <p>Subjects</p>
            <h3>{subjects.size}</h3>
            <span>Subjects to explore</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-icon-green">↗</div>

          <div>
            <p>Recent Notes</p>
            <h3>{recentNotes.length}</h3>
            <span>Latest shared materials</span>
          </div>
        </article>
      </section>

      {/* Quick actions */}
      <section className="dashboard-quick-actions">
        <div>
          <h2>Make the most of your study time</h2>
          <p>
            Find the resources you need or contribute your own notes.
          </p>
        </div>

        <div className="quick-action-buttons">
          <button
            type="button"
            className="quick-action-primary"
            onClick={() => onNavigate("My Notes")}
          >
            Explore Notes
          </button>

          <button
            type="button"
            className="quick-action-secondary"
            onClick={() => onNavigate("Subjects")}
          >
            Browse Subjects
          </button>
        </div>
      </section>

      {/* Recently added notes */}
      <section className="dashboard-recent">
        <div className="dashboard-section-heading">
          <div>
            <h2>Recently Added Notes</h2>
            <p>Explore the latest approved study materials.</p>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() => onNavigate("My Notes")}
          >
            View All →
          </button>
        </div>

        {recentNotes.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Your study library is waiting</h3>

            <p>
              Approved notes will appear here when they become available.
            </p>

            <button
              type="button"
              onClick={() => onNavigate("My Notes")}
            >
              Browse Available Notes
            </button>
          </div>
        ) : (
          <div className="dashboard-recent-grid">
            {recentNotes.map((note) => (
              <article className="recent-note-card" key={note.id}>
                <div className="recent-note-icon" aria-hidden="true">
                  PDF
                </div>

                <div className="recent-note-details">
                  <h3>{note.title}</h3>

                  <p>{note.subject || "General Subject"}</p>

                  {note.unit && (
                    <span className="recent-note-unit">
                      {note.unit}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="recent-note-open"
                  onClick={() => onNavigate("My Notes")}
                  aria-label={`View ${note.title}`}
                >
                  →
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;