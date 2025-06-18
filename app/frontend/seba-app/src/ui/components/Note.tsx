import React from "react";
import "../../styles/Note.css";

type NoteType = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

type NoteProps = {
  note: NoteType;
  onDelete: (id: number) => void;
};

function Note({ note, onDelete }: NoteProps) {
  const formattedDate = new Date(note.created_at).toLocaleDateString("de-DE");

  return (
    <div className="note-container">
      <p className="note-title">{note.title}</p>
      <p className="note-content">{note.content}</p>
      <p className="note-date">{formattedDate}</p>
      <button className="delete-button" onClick={() => onDelete(note.id)}>
        Delete
      </button>
    </div>
  );
}

export default Note;
