
import { supabase } from "./supabaseClient";

// Fetch notes that have been approved by an admin
export async function fetchNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// Upload a PDF and submit it for admin approval
export async function uploadNote({ file, title, subject, unit }) {
  if (!file) {
    throw new Error("Please select a PDF file.");
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Only PDF files are allowed.");
  }

  if (!title.trim()) {
    throw new Error("Please enter a note title.");
  }

  if (!subject.trim()) {
    throw new Error("Please enter a subject.");
  }

  // Get the currently logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Please log in before uploading notes.");
  }

  // Create a safe filename
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Store each user's uploads in their own folder
  const filePath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

  // Upload the PDF to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("notes-files")
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Add the note details to the database
  const { error: insertError } = await supabase.from("notes").insert({
    user_id: user.id,
    title: title.trim(),
    subject: subject.trim(),
    unit: unit.trim() || null,
    file_path: filePath,
    approval_status: "pending",
  });

  // If saving the database record fails, remove the uploaded PDF
  if (insertError) {
    await supabase.storage.from("notes-files").remove([filePath]);
    throw insertError;
  }

  return {
    success: true,
    message: "Your PDF was submitted for admin approval.",
  };
}

// Fetch notes waiting for admin approval
export async function fetchPendingNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// Approve or reject a note
export async function reviewNote(noteId, decision) {
  if (!["approved", "rejected"].includes(decision)) {
    throw new Error("Invalid review decision.");
  }

  const { data, error } = await supabase
    .from("notes")
    .update({ approval_status: decision })
    .eq("id", noteId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Download a PDF from Supabase Storage
export async function downloadNote(filePath, title) {
  const { data, error } = await supabase.storage
    .from("notes-files")
    .download(filePath);

  if (error) {
    throw error;
  }

  const url = URL.createObjectURL(data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${title || "notes"}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
