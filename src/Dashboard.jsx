
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { fetchNotes, downloadNote } from "./notesService";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [activePage, setActivePage] = useState("My Notes");
  const [downloading, setDownloading] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Student");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeDashboard() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!mounted) return;

        const user = session?.user;

        if (!user) {
          setIsLoggedIn(false);
          setError("Please log in to access your study resources.");
          return;
        }

        setIsLoggedIn(true);
        setUserEmail(user.email || "");

        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Student";

        setUserName(name);

        const data = await fetchNotes();

        if (mounted) {
          setNotes(data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your notes.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const subjects = [
    "All Subjects",
    ...new Set(notes.map((note) => note.subject).filter(Boolean)),
  ];

  const filteredNotes = notes.filter((note) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      (note.title || "").toLowerCase().includes(query) ||
      (note.subject || "").toLowerCase().includes(query);

    const matchesSubject =
      selectedSubject === "All Subjects" ||
      note.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  async function handleDownload(note) {
    try {
      setDownloading(note.id);
      setError("");

      await downloadNote(note.file_path, note.title);
    } catch (err) {
      setError(err.message || "Unable to download this file.");
    } finally {
      setDownloading(null);
    }
  }

  async function handleLogout() {
    setError("");

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setIsLoggedIn(false);
    setNotes([]);
    setUserEmail("");
    setUserName("Student");
    setError("You have been logged out. Please use your login page to sign in again.");
  }

  function navigateTo(page) {
    setActivePage(page);
    setSearch("");
    setSelectedSubject("All Subjects");
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">CN</div>
          <div className="brand-name">
            <h2>Campus Notes</h2>
            <span>HUB</span>
          </div>
        </div>

        <div className="menu-label">MENU</div>

        <nav className="sidebar-nav">
          <button
            className={activePage === "Overview" ? "nav-item active" : "nav-item"}
            onClick={() => navigateTo("Overview")}
          >
            <span className="nav-icon">◫</span>
            Overview
          </button>

          <button
            className={activePage === "My Notes" ? "nav-item active" : "nav-item"}
            onClick={() => navigateTo("My Notes")}
          >
            <span className="nav-icon">▤</span>
            My Notes
          </button>

          <button
            className={activePage === "Subjects" ? "nav-item active" : "nav-item"}
            onClick={() => navigateTo("Subjects")}
          >
            <span className="nav-icon">▦</span>
            Subjects
          </button>
        </nav>

        <div className="sidebar-profile">
          <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="profile-details">
            <strong>{userName}</strong>
            <span>College student</span>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-logo small-logo">CN</div>
            <strong>Campus Notes Hub</strong>
          </div>

          <div className="topbar-label">STUDENT WORKSPACE</div>

          <div className="topbar-user">
            <div className="avatar small-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span>{userName}</span>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING SPACE</p>
              <h1>
                {activePage === "Overview"
                  ? "Overview"
                  : activePage === "Subjects"
                    ? "Your Subjects"
                    : "My Notes"}
              </h1>
              <p className="page-subtitle">
                Find your study materials, all in one place.
              </p>
            </div>

            <div className="heading-decoration">CN</div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {!isLoggedIn && !loading ? (
            <section className="overview-card">
              <h2>Login required</h2>
              <p>
                Your dashboard is ready, but you need an active account
                session to view your study resources.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  setError(
                    "Please open your existing login page to sign in."
                  );
                }}
              >
                Sign in to continue
              </button>
            </section>
          ) : (
            <>
              <section className="welcome-card">
                <div>
                  <p className="welcome-label">WELCOME BACK</p>
                  <h2>Ready to learn, {userName}?</h2>
                  <p>
                    Explore shared notes and make your next study session count.
                  </p>
                </div>

                <div className="welcome-art" aria-hidden="true">
                  <div className="book book-back"></div>
                  <div className="book book-front">
                    <span>CN</span>
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-icon">N</div>
                  <div>
                    <p>Available Notes</p>
                    <h3>{loading ? "..." : notes.length}</h3>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-icon">S</div>
                  <div>
                    <p>Subjects</p>
                    <h3>{loading ? "..." : subjects.length - 1}</h3>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-icon">D</div>
                  <div>
                    <p>Study Resources</p>
                    <h3>{loading ? "..." : notes.length}</h3>
                  </div>
                </article>
              </section>

              {activePage === "Overview" && (
                <section className="overview-card">
                  <h2>Your study space</h2>
                  <p>
                    Browse shared notes, search by subject, and download
                    the materials you need.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => navigateTo("My Notes")}
                  >
                    Browse notes
                  </button>
                </section>
              )}

              {activePage === "Subjects" && (
                <section className="subjects-section">
                  <div className="section-heading">
                    <div>
                      <h2>Browse subjects</h2>
                      <p>Choose a subject to find its study materials.</p>
                    </div>
                  </div>

                  <div className="subject-grid">
                    {subjects.slice(1).map((subject) => (
                      <button
                        className="subject-card"
                        key={subject}
                        onClick={() => {
                          setSelectedSubject(subject);
                          setActivePage("My Notes");
                        }}
                      >
                        <span className="subject-symbol">S</span>
                        <strong>{subject}</strong>
                        <span>
                          {notes.filter((n) => n.subject === subject).length} notes
                        </span>
                      </button>
                    ))}

                    {!loading && subjects.length === 1 && (
                      <p>No subjects available yet.</p>
                    )}
                  </div>
                </section>
              )}

              <section className="notes-section">
                <div className="section-heading">
                  <div>
                    <h2>Study resources</h2>
                    <p>Search and browse the shared notes.</p>
                  </div>

                  <span className="notes-count">
                    {loading ? "Loading..." : `${filteredNotes.length} notes`}
                  </span>
                </div>

                <div className="filter-bar">
                  <div className="search-box">
                    <span className="search-icon">⌕</span>
                    <input
                      type="search"
                      placeholder="Search notes or subjects..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      aria-label="Search notes or subjects"
                    />
                  </div>

                  <select
                    value={selectedSubject}
                    onChange={(event) => setSelectedSubject(event.target.value)}
                    aria-label="Filter by subject"
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                {loading ? (
                  <div className="empty-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your study resources...</p>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">N</div>
                    <h3>No notes found</h3>
                    <p>
                      {notes.length === 0
                        ? "Shared notes will appear here when they are added."
                        : "Try another search or choose a different subject."}
                    </p>

                    {(search || selectedSubject !== "All Subjects") && (
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setSearch("");
                          setSelectedSubject("All Subjects");
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="notes-list">
                    {filteredNotes.map((note) => (
                      <article className="note-card" key={note.id}>
                        <div className="file-icon">PDF</div>

                        <div className="note-details">
                          <h3>{note.title}</h3>
                          <p>
                            {note.subject || "General"}
                            {note.unit != null ? ` · Unit ${note.unit}` : ""}
                          </p>
                          <span className="note-date">
                            {note.created_at
                              ? new Date(note.created_at).toLocaleDateString()
                              : "Study resource"}
                          </span>
                        </div>

                        <div className="note-actions">
                          <span className="file-type">Study Notes</span>
                          <button
                            className="download-button"
                            disabled={downloading === note.id}
                            onClick={() => handleDownload(note)}
                          >
                            {downloading === note.id
                              ? "Downloading..."
                              : "Download"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="footer">
            <span>Campus Notes Hub</span>
            <span className="footer-dot">·</span>
            <span>Built for college learning</span>
            {userEmail && (
              <span className="footer-email">{userEmail}</span>
            )}
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
