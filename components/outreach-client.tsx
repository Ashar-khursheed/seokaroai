"use client";

import { useState } from "react";
import { Icon } from "./icons";

export function CopyAndOpenButton({ text, url }: { text: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // ignore clipboard permission errors
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={handleClick} className="btn btn-brand">
      <Icon name="ExternalLink" size={14} />
      {copied ? "Copied! Opening thread…" : text ? "Copy draft & open thread" : "Open thread"}
    </button>
  );
}
