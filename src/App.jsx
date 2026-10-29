import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  fetchNotes,
  uploadNote,
  downloadNote,
} from "./notesService";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activePage, setActivePage] = useState("Overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] =
    useState("All Subjects");

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadUnit, setUploadUnit] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // General error message
  const [error, setError] = useState("");

  // Determine whether the signed-in user is an administrator.
  const isAdmin =
    session?.user?.app_metadata?.role === "admin";

  // DEBUG: Check the role received by this application.
  useEffect(() => {
    if (session?.user) {
      console.log(
        "Signed-in user:",
        session.user.email
      );

      console.log(
        "App metadata:",
        session.user.app_metadata
      );

      console.log(
        "Admin role:",
        session.user.app_metadata?.role
      );
    }
  }, [session]);

  // Initialize authentication.
  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        const {
          data,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          setError(sessionError.message);
        }

        setSession(data?.session ?? null);
      } catch (err) {
        if (mounted) {
          setError(
            err.message ||
              "Could not initialize the application."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);

        // Prevent non-admin users from remaining on
        // the Admin page.
        if (
          newSession?.user?.app_metadata?.role !==
          "admin"
        ) {
          setActivePage((currentPage) =>
            currentPage === "Admin"
              ? "Overview"
              : currentPage
          );
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load approved notes.
  async function loadNotes() {
    try {
      setError("");

      const fetchedNotes = await fetchNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      console.error("Error loading notes:", err);

      setError(
        err.message || "Could not load notes."
      );
    }
  }

  useEffect(() => {
    if (session) {
      loadNotes();
    } else {
      setNotes([]);
    }
  }, [session]);

  // Log out.
  async function handleLogout() {
    setError("");

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
    } else {
      setSession(null);
      setActivePage("Overview");
      setSearchTerm("");
      setSelectedSubject("All Subjects");
      setUploadMessage("");
    }
  }

  // Upload a PDF for administrator approval.
  async function handleUpload(event) {
    event.preventDefault();

    setError("");
    setUploadMessage("");

    if (!session) {
      setError(
        "Please log in before uploading notes."
      );
      return;
    }

    if (!uploadFile) {
      setError("Please select a PDF file.");
      return;
    }

    setUploading(true);

    try {
      const result = await uploadNote({
        file: uploadFile,
        title: uploadTitle,
        subject: uploadSubject,
        unit: uploadUnit,
      });

      setUploadMessage(
        typeof result === "string"
          ? result
          : result?.message ||
              "Your notes have been submitted for admin approval."
      );

      setUploadTitle("");
      setUploadSubject("");
      setUploadUnit("");
      setUploadFile(null);

      event.target.reset();
    } catch (err) {
      console.error("Error uploading note:", err);

      setError(
        err.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  // Download an approved note.
  async function handleDownload(note) {
    try {
      setError("");

      await downloadNote(
        note.file_path,
        note.title
      );
    } catch (err) {
      console.error(
        "Error downloading note:",
        err
      );

      setError(
        err.message ||
          "Could not download this note."
      );
    }
  }

  // Build subject filter options.
  const subjects = [
    "All Subjects",
    ...new Set(
      notes
        .map((note) => note.subject)
        .filter(Boolean)
    ),
  ];

  // Filter notes.
  const filteredNotes = notes.filter((note) => {
    const normalizedSearch =
      searchTerm.toLowerCase();

    const matchesSearch =
      (note.title || "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      (note.subject || "")
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesSubject =
      selectedSubject === "All Subjects" ||
      note.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  // Display name.
  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Student";

  // Loading screen.
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading Campus Notes Hub...</p>
      </div>
    );
  }

  // Login and signup screen.
  if (!session) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Campus Notes Hub</h1>

          <p>
            Sign in to access and share your study notes.
          </p>

          {error && (
            <p
              className="error-message"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={async () => {
              const email = window.prompt(
                "Enter your email address:"
              );

              if (!email) return;

              const password = window.prompt(
                "Enter your password:"
              );

              if (!password) return;

              setError("");

              const {
                error: loginError,
              } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });

              if (loginError) {
                setError(loginError.message);
              }
            }}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={async () => {
              const email = window.prompt(
                "Enter your email address:"
              );

              if (!email) return;

              const password = window.prompt(
                "Create a password (at least 6 characters):"
              );

              if (!password) return;

              if (password.length < 6) {
                setError(
                  "Your password must contain at least 6 characters."
                );
                return;
              }

              setError("");

              const {
                error: signupError,
              } = await supabase.auth.signUp({
                email: email.trim(),
                password,
              });

              if (signupError) {
                setError(signupError.message);
              } else {
                setError(
                  "Account created. Check your email if confirmation is required, then log in."
                );
              }
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // Main application.
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Campus Notes</h2>
          <p>Hub</p>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={
              activePage === "Overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Overview")
            }
          >
            Overview
          </button>

          <button
            type="button"
            className={
              activePage === "My Notes"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("My Notes")
            }
          >
            Notes &amp; Upload
          </button>

          <button
            type="button"
            className={
              activePage === "Subjects"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Subjects")
            }
          >
            Subjects
          </button>

          {isAdmin && (
            <button
              type="button"
              className={
                activePage === "Admin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActivePage("Admin")
              }
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        <div className="sidebar-user">
          <p>{userName}</p>

          {isAdmin && (
            <span className="admin-role-label">
              Administrator
            </span>
          )}

          <button
            type="button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {activePage === "Overview"
                ? "Overview"
                : activePage === "My Notes"
                ? "Notes & Upload"
                : activePage === "Subjects"
                ? "Subjects"
                : activePage === "Admin"
                ? "Admin Dashboard"
                : "Overview"}
            </h1>

            <p>Welcome back, {userName}!</p>
          </div>
        </header>

        {error && (
          <div
            className="error-message"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Overview */}
        {activePage === "Overview" && (
          <Dashboard
            notes={notes}
            userName={userName}
            onNavigate={setActivePage}
          />
        )}

        {/* Notes and upload */}
        {activePage === "My Notes" && (
          <section className="notes-section">
            <div className="section-heading">
              <h2>Share Your Notes</h2>

              <p>
                Upload your PDF study materials.
                Your notes will be visible to other
                students after an admin approves them.
              </p>
            </div>

            <div className="upload-section">
              <h3>Upload Study Notes</h3>

              <form
                className="upload-form"
                onSubmit={handleUpload}
              >
                <div className="form-group">
                  <label htmlFor="upload-title">
                    Note Title *
                  </label>

                  <input
                    id="upload-title"
                    type="text"
                    placeholder="e.g. Introduction to Data Structures"
                    value={uploadTitle}
                    onChange={(event) =>
                      setUploadTitle(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="upload-subject">
                    Subject *
                  </label>

                  <input
                    id="upload-subject"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={uploadSubject}
                    onChange={(event) =>
                      setUploadSubject(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="upload-unit">
                    Unit (optional)
                  </label>

                  <input
                    id="upload-unit"
                    type="text"
                    placeholder="e.g. Unit 1"
                    value={uploadUnit}
                    onChange={(event) =>
                      setUploadUnit(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="upload-file">
                    Choose PDF *
                  </label>

                  <input
                    id="upload-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) =>
                      setUploadFile(
                        event.target.files?.[0] ||
                          null
                      )
                    }
                    required
                  />

                  <small>PDF files only.</small>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Submit for Approval"}
                </button>
              </form>

              {uploadMessage && (
                <p
                  className="success-message"
                  role="status"
                >
                  {uploadMessage}
                </p>
              )}
            </div>

            <div className="notes-list-section">
              <div className="section-heading">
                <h2>Available Notes</h2>

                <p>
                  Only notes approved by an admin
                  are shown here.
                </p>
              </div>

              <div className="notes-filters">
                <input
                  type="search"
                  placeholder="Search notes or subjects..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  aria-label="Search notes"
                />

                <select
                  value={selectedSubject}
                  onChange={(event) =>
                    setSelectedSubject(
                      event.target.value
                    )
                  }
                  aria-label="Filter by subject"
                >
                  {subjects.map((subject) => (
                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="empty-state">
                  <h3>No notes found</h3>

                  <p>
                    There are no approved notes
                    matching your search yet.
                  </p>
                </div>
              ) : (
                <div className="notes-grid">
                  {filteredNotes.map((note) => (
                    <article
                      className="note-card"
                      key={note.id}
                    >
                      <div className="note-card-content">
                        <h3>{note.title}</h3>

                        <p>
                          <strong>Subject:</strong>{" "}
                          {note.subject}
                        </p>

                        {note.unit && (
                          <p>
                            <strong>Unit:</strong>{" "}
                            {note.unit}
                          </p>
                        )}

                        <p>
                          <strong>Upvotes:</strong>{" "}
                          {note.upvotes ?? 0}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(note)
                        }
                      >
                        Download PDF
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Subjects */}
        {activePage === "Subjects" && (
          <section className="subjects-section">
            <h2>Browse by Subject</h2>

            <p>
              Select a subject to see its approved notes.
            </p>

            {subjects.length <= 1 ? (
              <p>No subjects are available yet.</p>
            ) : (
              <div className="subjects-grid">
                {subjects
                  .filter(
                    (subject) =>
                      subject !== "All Subjects"
                  )
                  .map((subject) => {
                    const count = notes.filter(
                      (note) =>
                        note.subject === subject
                    ).length;

                    return (
                      <button
                        type="button"
                        className="subject-card"
                        key={subject}
                        onClick={() => {
                          setSelectedSubject(subject);
                          setActivePage("My Notes");
                        }}
                      >
                        <h3>{subject}</h3>

                        <p>
                          {count}{" "}
                          {count === 1
                            ? "note"
                            : "notes"}
                        </p>
                      </button>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* Admin Dashboard */}
        {activePage === "Admin" && isAdmin && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

export default App;