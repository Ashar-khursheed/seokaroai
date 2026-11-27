"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "What does SEOKaroAI do?",
  "Pricing & Free plan limits?",
  "How does AI Auto-Fix work?",
  "Tell me about Reddit & Quora Add-on",
];

function renderText(text: string) {
  // Render simple **bold** and clickable /paths cleanly without dangerouslySetInnerHTML
  const parts = text.split(/(\*\*[^*]+\*\*|\/(?:pricing|signup|tutorials|features\/[a-z0-9-]+|compare\/[a-z0-9-]+|integrations\/[a-z0-9-]+))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("/")) {
      return <a key={i} href={part} className="font-medium text-brand-500 underline underline-offset-2 hover:opacity-80">{part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function SeoKaroChatbot() {
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! 👋 I'm **SEOKaroAI's assistant**. Ask me anything about AI SEO audits, Auto-Fix (WordPress, Shopify, GitHub PRs), Keyword Battles, pricing, or leave your inquiry for our team!",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadErr, setLeadErr] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMsg, setLeadMsg] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending, showLead, leadSent, open]);

  async function sendMessage(textRaw?: string) {
    const text = (textRaw ?? input).trim();
    if (!text || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data?.error || "Something went wrong. You can submit your inquiry below!" }]);
        setShowLead(true);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (data.showLeadForm && !leadSent) setShowLead(true);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Connection interrupted — leave your details below and our team will reach out right away." }]);
      setShowLead(true);
    } finally {
      setSending(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadErr(null);
    setLeadBusy(true);
    try {
      const transcript = messages
        .slice(-8)
        .map((m) => `${m.role === "user" ? "User" : "SEOKaroAI"}: ${m.content}`)
        .join("\n");
      const res = await fetch("/api/chat/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          message: leadMsg,
          page: typeof window !== "undefined" ? window.location.pathname : "/",
          transcript,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeadErr(data?.error || "Could not send inquiry.");
      } else {
        setLeadSent(true);
        setShowLead(false);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `Thanks **${leadName}**! ✅ Your inquiry has been sent to **info@seokaroai.com**. Our team will contact you shortly!`,
          },
        ]);
      }
    } catch {
      setLeadErr("Network error. Please try again.");
    } finally {
      setLeadBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 print:hidden">
      {/* Chat Window */}
      {open && (
        <div
          role="dialog"
          aria-label="SEOKaroAI Assistant"
          className="panel flex h-[min(82vh,580px)] w-[min(92vw,390px)] flex-col overflow-hidden shadow-2xl shadow-black/40"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b line bg-[var(--panel)] px-4 py-3">
            <div className="relative h-9 w-9 shrink-0">
              <img src="/brand/logo-mark-128.webp" alt="SEOKaroAI" className="h-9 w-9 object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-low ring-2 ring-[var(--panel)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">SEOKaroAI Assistant</div>
              <div className="muted flex items-center gap-1.5 text-[11.5px]">
                <span className="h-1.5 w-1.5 rounded-full bg-low" />Online · Replies instantly
              </div>
            </div>
            {!leadSent && (
              <button
                type="button"
                onClick={() => setShowLead((s) => !s)}
                className="rounded-lg border line px-2.5 py-1 text-[11.5px] font-medium hover:bg-[var(--panel2)]"
              >
                {showLead ? "Hide form" : "Inquiry"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost !p-1.5"
              aria-label="Close chat"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5 text-[13.5px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-md bg-brand-500 text-white"
                      : "rounded-bl-md border line bg-[var(--panel2)] text-[var(--ink)]"
                  }`}
                >
                  {m.role === "user" ? m.content : renderText(m.content)}
                </div>
              </div>
            ))}

            {/* Quick starter chips on initial state */}
            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendMessage(q)}
                    className="rounded-full border line bg-[var(--bg-elev)] px-3 py-1.5 text-[12px] font-medium transition hover:border-brand-500 hover:text-brand-500"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border line bg-[var(--panel2)] px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
                </div>
              </div>
            )}

            {/* Inline Lead / Inquiry Form */}
            {showLead && !leadSent && (
              <form onSubmit={submitLead} className="space-y-2.5 rounded-2xl border border-brand-500/40 bg-[var(--bg-elev)] p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-brand-500">Get a callback / Send inquiry</span>
                  <button type="button" onClick={() => setShowLead(false)} className="muted text-xs hover:text-[var(--ink)]">Later</button>
                </div>
                <input
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Your name *"
                  className="input !py-2 text-[13px]"
                />
                <input
                  required
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Email address *"
                  className="input !py-2 text-[13px]"
                />
                <input
                  required
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Phone / WhatsApp number *"
                  className="input !py-2 text-[13px]"
                />
                <textarea
                  rows={2}
                  value={leadMsg}
                  onChange={(e) => setLeadMsg(e.target.value)}
                  placeholder="Your website or question (optional)"
                  className="input !py-2 text-[13px]"
                />
                {leadErr && <div className="text-xs text-crit">{leadErr}</div>}
                <button type="submit" disabled={leadBusy} className="btn btn-brand w-full !py-2 text-[13px]">
                  {leadBusy ? "Sending…" : "Send inquiry to SEOKaroAI"}
                </button>
              </form>
            )}
          </div>

          {/* Input composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-center gap-2 border-t line bg-[var(--panel)] p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about SEOKaroAI…"
              className="input !rounded-xl !py-2 text-[13.5px]"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn btn-brand shrink-0 !rounded-xl !px-3.5 !py-2"
              aria-label="Send message"
            >
              <Icon name="ArrowRight" size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Greeting pill when closed */}
      {!open && showBubble && (
        <div className="panel flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-medium shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setShowBubble(false);
            }}
            className="flex items-center gap-1.5 text-left"
          >
            <span className="wave-hand inline-block">👋</span>
            <span>Need SEO help? Ask SEOKaroAI</span>
          </button>
          <button
            type="button"
            onClick={() => setShowBubble(false)}
            className="muted ml-1 hover:text-[var(--ink)]"
            aria-label="Dismiss greeting"
          >
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {/* Animated SEOKaroAI Brand Logo Launcher (no robot icon!) */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setShowBubble(false);
        }}
        aria-label={open ? "Close SEOKaroAI chat" : "Open SEOKaroAI chat"}
        className="group relative grid h-14 w-14 place-items-center rounded-full border border-brand-500/40 bg-[var(--panel)] shadow-2xl shadow-brand-500/30 transition hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-tr from-brand-500/30 to-teal-400/25 opacity-75 blur-md transition group-hover:opacity-100" />
        <img
          src="/brand/logo-mark-128.webp"
          alt="SEOKaroAI Assistant"
          className={`relative h-10 w-10 object-contain transition-transform duration-300 sm:h-11 sm:w-11 ${open ? "scale-90" : "float"}`}
        />
        {!open && (
          <span className="wave-hand absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full border line bg-[var(--panel)] text-[13px] shadow-md">
            👋
          </span>
        )}
        <span className="live-dot absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-low ring-2 ring-[var(--panel)]" />
      </button>
    </div>
  );
}
