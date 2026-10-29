import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { fetchPendingNotes, reviewNote } from "./notesService";

function AdminDashboard() {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busyNoteId, setBusyNoteId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Retrieve submissions awaiting review.
      const pending = await fetchPendingNotes();
      setPendingNotes(pending);

      // Retrieve status counts. These queries require the admin RLS
      // policies to be configured in Supabase.
      const statuses = ["pending", "approved", "rejected"];
      const counts = {};

      for (const status of statuses) {
        const { count, error: countError } = await supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", status);

        if (countError) throw countError;
        counts[status] = count ?? 0;
      }

      setStatistics({
        pending: counts.pending,
        approved: counts.approved,
        rejected: counts.rejected,
        total: counts.pending + counts.approved + counts.rejected,
      });
    } catch (err) {
      console.error("Admin dashboard loading error:", err);
      setError(
        err.message ||
          "Could not load submissions. Check your Supabase permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleReview(note, decision) {
    const action = decision === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${note.title}"?`
    );

    if (!confirmed) return;

    setBusyNoteId(note.id);
    setError("");
    setMessage("");

    try {
      await reviewNote(note.id, decision);

      setMessage(
        decision === "approved"
          ? `"${note.title}" was approved.`
          : `"${note.title}" was rejected.`
      );

      await loadDashboard();
    } catch (err) {
      console.error("Review error:", err);
      setError(
        err.message ||
          "The review failed. Check the Supabase administrator policies."
      );
    } finally {
      setBusyNoteId(null);
    }
  }

  async function handlePreview(note) {
    setError("");

    try {
      // Create a short-lived URL for the private PDF.
      const { data, error: urlError } = await supabase.storage
        .from("notes-files")
        .createSignedUrl(note.file_path, 60);

      if (urlError) throw urlError;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("PDF preview error:", err);
      setError(
        err.message ||
          "Could not preview this PDF. Check your Storage policies."
      );
    }
  }

  if (loading) {
    return (
      <section className="admin-dashboard">
        <p>Loading admin dashboard...</p>
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      <div className="admin-heading">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Review student submissions and manage shared notes.</p>
        </div>

        <button type="button" onClick={loadDashboard}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}

      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <span>Total submissions</span>
          <strong>{statistics.total}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Pending review</span>
          <strong>{statistics.pending}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Approved</span>
          <strong>{statistics.approved}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Rejected</span>
          <strong>{statistics.rejected}</strong>
        </article>
      </div>

      <div className="admin-submissions">
        <div className="section-heading">
          <h2>Pending Submissions</h2>
          <p>Review each PDF before making it available to students.</p>
        </div>

        {pendingNotes.length === 0 ? (
          <div className="empty-state">
            <h3>You're all caught up!</h3>
            <p>There are no pending submissions to review.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Subject</th>
                  <th>Unit</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingNotes.map((note) => (
                  <tr key={note.id}>
                    <td>{note.title}</td>
                    <td>{note.subject}</td>
                    <td>{note.unit || "—"}</td>
                    <td>
                      {note.created_at
                        ? new Date(note.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="preview-button"
                          onClick={() => handlePreview(note)}
                          disabled={busyNoteId === note.id}
                        >
                          Preview PDF
                        </button>

                        <button
                          type="button"
                          className="approve-button"
                          onClick={() => handleReview(note, "approved")}
                          disabled={busyNoteId === note.id}
                        >
                          {busyNoteId === note.id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          className="reject-button"
                          onClick={() => handleReview(note, "rejected")}
                          disabled={busyNoteId === note.id}
                        >
                          Reject
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
  );
}

export default AdminDashboard;