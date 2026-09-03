"use client";

import { useEffect, useState } from "react";

import type { HelpHeading } from "../content/headings";

// Adapted from GitBook's PageAside and ScrollSectionsList components.
export function HelpPageAside({ headings }: { headings: HelpHeading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-15% 0px -70%", threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <aside aria-label="本页内容" className="text-sm">
      <p className="font-semibold">本页内容</p>
      <nav className="mt-3 grid gap-1.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            aria-current={activeId === heading.id ? "location" : undefined}
            className={
              activeId === heading.id
                ? `${heading.level === 3 ? "pl-3 " : ""}flex min-h-9 items-center rounded-md font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
                : `${heading.level === 3 ? "pl-3 " : ""}flex min-h-9 items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
            }
          >
            {heading.text}
          </a>
        ))}
      </nav>
      {headings.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">这篇文章没有小标题</p>
      ) : null}
    </aside>
  );
}
