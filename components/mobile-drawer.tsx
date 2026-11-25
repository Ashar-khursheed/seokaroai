"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

/**
 * Mobile slide-in drawer. Closes on route change, ESC, backdrop tap or
 * any link click inside. Locks body scroll while open.
 */
export function MobileDrawer({ children, title, label = "Open menu", className = "" }: { children: React.ReactNode; title?: React.ReactNode; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onMq);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); mq.removeEventListener("change", onMq); };
  }, [open]);

  return (
    <>
      <button type="button" className={`btn btn-ghost !px-2.5 ${className}`} aria-label={label} aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon name="Menu" size={18} />
      </button>
      {mounted && open && createPortal(
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="drawer-panel" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Menu"}
            onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
            <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b line px-4">
              <div className="min-w-0">{title}</div>
              <button type="button" className="btn btn-ghost !px-2.5" aria-label="Close menu" onClick={() => setOpen(false)} autoFocus>
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
