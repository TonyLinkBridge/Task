"use client";

import { Children, type ReactNode, useId, useState } from "react";

// Adapted from GitBook's Tabs and DynamicTabs components.
export function HelpTabs({ labels, children }: { labels: string[]; children: ReactNode }) {
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const id = useId();

  return (
    <div className="my-5 overflow-hidden rounded-xl border">
      <div role="tablist" aria-label="分页内容" className="flex overflow-x-auto border-b bg-muted/40 p-1">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            className={active === index ? "rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-sm" : "rounded-lg px-3 py-2 text-sm text-muted-foreground"}
            onClick={() => setActive(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
        className="p-4"
      >
        {panels[active] ?? null}
      </div>
    </div>
  );
}
