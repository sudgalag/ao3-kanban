import { useEffect, useRef, useState } from "react";
import { Button, Input, Select } from "../pcds";
import { fetchWorkMeta, parseWorkId } from "../lib/ao3";
import type { Draft } from "../lib/types";
import { Sheet } from "./Sheet";

interface Props {
  columns: readonly string[];
  onAdd: (draft: Draft, url: string) => void;
  onClose: () => void;
}

export function AddSheet({ columns, onAdd, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const fetchDetails = async () => {
    const id = parseWorkId(url);
    if (!id) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    setFetching(true);
    abort.current = new AbortController();
    const meta = await fetchWorkMeta(id, abort.current.signal);
    setFetching(false);
    if (abort.current.signal.aborted) return;
    setHint(meta ? null : "Couldn't read that work from AO3 here. Fill in the details by hand.");
    setDraft({
      title: meta?.title ?? "",
      author: meta?.author ?? "",
      fandom: meta?.fandom ?? "",
      ship: meta?.ship ?? "",
      words: meta ? String(meta.words) : "",
      col: columns[0],
      notes: "",
    });
  };

  const set = (k: keyof Draft) => (v: string) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <Sheet onClose={onClose} label="Add a fic">
      <div className="eyebrow">Add a fic</div>
      <Input
        label="AO3 link"
        placeholder="https://archiveofourown.org/works/…"
        value={url}
        onChange={(v) => {
          setUrl(v);
          setUrlError(false);
        }}
      />
      {urlError && <div className="sheet__error">That doesn't look like an AO3 work link.</div>}
      {hint && <div className="sheet__hint">{hint}</div>}
      {draft && (
        <>
          <div className="sheet__grid">
            <Input label="Title" placeholder="" value={draft.title} onChange={set("title")} />
            <Input label="Author" placeholder="" value={draft.author} onChange={set("author")} />
            <Input label="Fandom" placeholder="" value={draft.fandom} onChange={set("fandom")} />
            <Input label="Ship" placeholder="" value={draft.ship} onChange={set("ship")} />
            <Input label="Words" placeholder="0" value={draft.words} onChange={set("words")} />
            <Select label="Column" options={[...columns]} value={draft.col} onChange={set("col")} />
          </div>
          <Input label="Notes" placeholder="Why you saved it…" value={draft.notes} onChange={set("notes")} />
        </>
      )}
      <div className="sheet__actions">
        <Button variant="ghost" label="Cancel" onClick={onClose} />
        {!draft ? (
          <Button variant="primary" label={fetching ? "Fetching…" : "Fetch details"} disabled={fetching} onClick={fetchDetails} />
        ) : (
          <Button variant="accent" label="Add to board" onClick={() => onAdd(draft, url.trim())} />
        )}
      </div>
    </Sheet>
  );
}
