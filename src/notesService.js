
import { supabase } from "./supabaseClient";

export async function fetchNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, subject, unit, file_path, upvotes, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }

  return data;
}

export async function downloadNote(filePath, title) {
  if (!filePath) {
    throw new Error("No file path is available for this note.");
  }

  const { data, error } = await supabase.storage
    .from("notes-files")
    .download(filePath);

  if (error) {
    console.error("Supabase download error:", error);
    alert(`Download failed: ${error.message}`);
    throw error;
  }

  if (!data) {
    throw new Error("The downloaded file is empty.");
  }

  const url = URL.createObjectURL(data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${title || "study-note"}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
