"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

interface ChatCard {
  badge?: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  cards?: ChatCard[];
  suggestions?: string[];
}

const INITIAL_CARDS: ChatCard[] = [
  {
    badge: "100% Free",
    title: "Free Website SEO Checker",
    description: "Check any URL instantly — no signup required.",
    href: "/website-seo-checker",
    cta: "Try Free Checker",
  },
  {
    badge: "Plans from $0/mo",
    title: "Pricing & Plans",
    description: "Compare Free, Starter, Pro, Agency & Outreach Add-on.",
    href: "/pricing",
    cta: "View Pricing",
  },
];

const QUICK_PROMPTS = [
  "What does SEOKaroAI do?",
  "Pricing & Free plan limits?",
  "How does AI Auto-Fix work?",
  "Tell me about Reddit & Quora Add-on",
];

function renderText(text: string) {
  const parts = text.split(
    /(\*\*[^*]+\*\*|`[^`]+`|\/(?:pricing|signup|tutorials|security|case-studies|contact|website-seo-checker|seo-audit-tool|site-audit-tool|features\/[a-z0-9-]+|compare\/[a-z0-9-]+|integrations\/[a-z0-9-]+))/g,
  );
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-[var(--ink)]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[12px]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("/")) {
      return (
        <Link key={i} href={part} className="font-semibold text-brand-600 underline underline-offset-2 hover:opacity-80">
          {part}
        </Link>
      );
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
      content:
        "Hi! 👋 I’m **SEOKaroAI’s official guide**. Ask me about our SEO Audits, Free Checker, WordPress/Shopify/GitHub Auto-Fix, Rank Tracking, Pricing, or leave your inquiry for our team.",
      cards: INITIAL_CARDS,
      suggestions: QUICK_PROMPTS,
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
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data?.error || "Something went wrong. You can submit your inquiry below!" },
        ]);
        setShowLead(true);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.reply,
            cards: Array.isArray(data.cards) ? data.cards : undefined,
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : undefined,
          },
        ]);
        if (data.showLeadForm && !leadSent) setShowLead(true);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection interrupted — leave your details below and our team will reach out right away." },
      ]);
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
            content: `Thanks **${leadName}**! Your inquiry has been sent to **info@seokaroai.com**. Our team will contact you shortly.`,
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
          className="panel flex h-[min(84vh,600px)] w-[min(93vw,400px)] flex-col overflow-hidden shadow-2xl shadow-slate-900/20"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b line bg-[var(--panel)] px-4 py-3">
            <div className="relative h-9 w-9 shrink-0">
              <img src="/brand/logo-mark-128.webp" alt="SEOKaroAI" className="h-9 w-9 object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-low ring-2 ring-[var(--panel)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">SEOKaroAI Guide</div>
              <div className="muted flex items-center gap-1.5 text-[11.5px]">
                <span className="h-1.5 w-1.5 rounded-full bg-low" />SEOKaroAI Product &amp; Pricing Help
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
          <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3.5 text-[13.5px]">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div key={i} className="space-y-2">
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-md bg-brand-500 text-white"
                          : "rounded-bl-md border line bg-[var(--panel2)] text-[var(--ink)]"
                      }`}
                    >
                      {m.role === "user" ? m.content : renderText(m.content)}
                    </div>
                  </div>

                  {/* Rich Clickable Product / Action Cards */}
                  {m.role === "assistant" && m.cards && m.cards.length > 0 && (
                    <div className="grid gap-2 pl-0.5">
                      {m.cards.map((c) => (
                        <Link
                          key={c.href + c.title}
                          href={c.href}
                          onClick={() => setOpen(false)}
                          className="group block rounded-xl border line bg-white p-3 transition hover:border-brand-500 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {c.badge && (
                                <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700">
                                  {c.badge}
                                </span>
                              )}
                              <div className="mt-1 text-[13px] font-semibold text-slate-900 group-hover:text-brand-600">
                                {c.title}
                              </div>
                              <p className="muted mt-0.5 text-[12px] leading-snug">{c.description}</p>
                            </div>
                            <Icon name="ArrowUpRight" size={15} className="mt-1 shrink-0 text-slate-400 transition group-hover:text-brand-600" />
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-600">
                            {c.cta} <Icon name="ArrowRight" size={12} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Suggestion Chips (only on latest assistant message) */}
                  {isLast && m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && !sending && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {m.suggestions.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => void sendMessage(q)}
                          className="rounded-full border line bg-white px-3 py-1.5 text-[11.5px] font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

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
              <form onSubmit={submitLead} className="space-y-2.5 rounded-2xl border border-brand-500/40 bg-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-brand-600">Get a callback / Send inquiry</span>
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
              placeholder="Ask about SEOKaroAI audits, pricing, Auto-Fix…"
              className="input !py-2 text-[13.5px]"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn btn-brand shrink-0 !px-3.5 !py-2"
              aria-label="Send message"
            >
              <Icon name="ArrowRight" size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Friendly Greeting Pill */}
      {!open && showBubble && (
        <div className="panel flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] shadow-lg">
          <button type="button" onClick={() => { setOpen(true); setShowBubble(false); }} className="text-left font-medium">
            👋 Need SEO help? Ask SEOKaroAI
          </button>
          <button
            type="button"
            onClick={() => setShowBubble(false)}
            aria-label="Dismiss greeting"
            className="muted hover:text-[var(--ink)]"
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
        className="group relative grid h-14 w-14 place-items-center rounded-full border border-brand-500/40 bg-[var(--panel)] shadow-2xl shadow-brand-500/20 transition hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-brand-500/15 opacity-75 blur-md transition group-hover:opacity-100" />
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
