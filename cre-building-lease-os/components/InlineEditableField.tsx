"use client";

import { useState } from "react";

type InlineEditableFieldProps = {
  value: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSave: (nextValue: string) => Promise<void>;
};

export default function InlineEditableField({
  value,
  placeholder = "-",
  className,
  inputClassName,
  onSave,
}: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);

  const commit = async () => {
    if (loading) return;
    const normalized = draft.trim();
    if (normalized === value.trim()) {
      setEditing(false);
      return;
    }
    setLoading(true);
    try {
      await onSave(normalized);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        disabled={loading}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={inputClassName || "w-full rounded border px-2 py-1 text-sm"}
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={className || "w-full text-left text-sm"}
      title="雙擊可編輯"
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </button>
  );
}
