"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Immediate feedback for App Router transitions. Next.js keeps the current
 * page visible while a new segment loads; without a signal this feels like a
 * dead click. We detect same-origin link navigation at capture phase and show
 * a slim progress rail until the pathname changes.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target === "_blank" || target.hasAttribute("download")) return;

      let next: URL;
      try {
        next = new URL(target.href, window.location.href);
      } catch {
        return;
      }
      if (next.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      if (next.pathname === current.pathname && next.search === current.search) return;

      setPending(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    // Safety valve for cancelled navigation or an unexpected router error.
    const timeout = window.setTimeout(() => setPending(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  if (!pending) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-indigo-100 print:hidden" role="progressbar" aria-label="Loading page">
      <div className="route-progress h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
    </div>
  );
}
