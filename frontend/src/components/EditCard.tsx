import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function EditCard({ card, refresh }: any) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  async function save() {
    await supabase
      .from("kanban_cards")
      .update({ title, description })
      .eq("id", card.id);
    setOpen(false);
    refresh();
  }

  if (!open)
    return (
      <button
        className="text-xs"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>
    );

  return (
    <div className="space-y-1">
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={save}>Save</button>
    </div>
  );
}
