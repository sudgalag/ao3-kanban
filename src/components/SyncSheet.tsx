import { useRef, useState } from "react";
import { Button, Input } from "../pcds";
import { normalizeSyncUrl, type SyncSettings } from "../lib/sync";
import { parseImport, serializeExport } from "../lib/storage";
import type { Card } from "../lib/types";
import type { SyncStatus } from "../hooks/useBoardSync";
import { Sheet } from "./Sheet";

interface Props {
  settings: SyncSettings | null;
  status: SyncStatus;
  message: string | null;
  cards: Card[];
  onSave: (settings: SyncSettings) => void;
  onDisconnect: () => void;
  onSyncNow: () => void;
  onImport: (cards: Card[]) => void;
  onClose: () => void;
}

const STATUS_COPY: Record<SyncStatus, string> = {
  off: "Not connected. This board lives only in this browser.",
  syncing: "Syncing…",
  synced: "In sync with the worker.",
  offline: "Offline. Changes are kept here and sent when the network is back.",
  error: "Sync error.",
};

export function SyncSheet({
  settings,
  status,
  message,
  cards,
  onSave,
  onDisconnect,
  onSyncNow,
  onImport,
  onClose,
}: Props) {
  const [url, setUrl] = useState(settings?.url ?? "");
  const [token, setToken] = useState(settings?.token ?? "");
  const [note, setNote] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const save = () => {
    const u = normalizeSyncUrl(url);
    if (!/^https?:\/\//.test(u) || !token.trim()) {
      setNote("Enter the worker URL and the token.");
      return;
    }
    setNote(null);
    onSave({ url: u, token: token.trim() });
  };

  const exportJson = () => {
    const blob = new Blob([serializeExport(cards)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `ficboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const importJson = async (f: File | undefined) => {
    if (!f) return;
    const parsed = parseImport(await f.text());
    if (!parsed) {
      setNote("That file does not contain any cards.");
      return;
    }
    if (!window.confirm(`Replace the current board with ${parsed.length} cards from ${f.name}?`)) return;
    onImport(parsed);
    setNote(`Imported ${parsed.length} cards.`);
  };

  return (
    <Sheet onClose={onClose} label="Sync and backup">
      <div className="eyebrow">Sync</div>
      <div className="sheet__hint">{status === "error" && message ? message : STATUS_COPY[status]}</div>
      <Input
        label="Worker URL"
        placeholder="https://ao3-kanban-proxy.example.workers.dev"
        value={url}
        onChange={setUrl}
      />
      <Input label="Token" placeholder="" type="password" value={token} onChange={setToken} />
      {note && <div className="sheet__error">{note}</div>}
      <div className="sheet__actions">
        {settings && <Button variant="ghost" label="Disconnect" onClick={onDisconnect} />}
        {settings && <Button variant="secondary" label="Sync now" onClick={onSyncNow} />}
        <Button variant="primary" label={settings ? "Save" : "Connect"} onClick={save} />
      </div>

      <div className="sheet__divider">
        <div className="eyebrow">Backup</div>
        <div className="sheet__hint">A JSON file you keep. Import replaces the whole board.</div>
      </div>
      <div className="sheet__actions">
        {/* PCDS has no file picker; the native input stays hidden behind the Button. */}
        {/* eslint-disable-next-line no-restricted-syntax */}
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Import JSON"
          onChange={(e) => {
            void importJson(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" label="Import JSON" onClick={() => file.current?.click()} />
        <Button variant="secondary" label="Export JSON" onClick={exportJson} />
        <Button variant="primary" size="md" label="Done" onClick={onClose} />
      </div>
    </Sheet>
  );
}
