import { Marked } from "marked";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Markdown renderer for agent-written reports. Raw HTML in the markdown is escaped (the content
 * is derived from untrusted web pages) and only http(s), relative and anchor links are kept.
 */
const md = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return esc(text);
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const ok = /^(https?:\/\/|#|\.{0,2}\/|[\w-]+\.[\w]+$)/i.test(href) && !/^\s*javascript:/i.test(href);
      if (!ok) return text;
      const ext = /^https?:\/\//i.test(href);
      return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
    },
    image({ href, text }) {
      if (!/^https?:\/\//i.test(href)) return esc(text);
      return `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy">`;
    },
  },
});

export function renderMarkdown(src: string): string {
  return md.parse(src, { async: false }) as string;
}
