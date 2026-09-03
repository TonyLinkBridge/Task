"use client";

import { Children, type ReactNode, useId, useState } from "react";

// Adapted from GitBook's Tabs and DynamicTabs components.
export function HelpTabs({
  labels,
  children,
}: {
  labels?: string[] | string;
  children: ReactNode;
}) {
  const panels = Children.toArray(children);
  const parsedLabels = Array.isArray(labels)
    ? labels
    : typeof labels === "string"
      ? labels.split("|").map((label) => label.trim()).filter(Boolean)
      : [];
  const safeLabels = panels.map(
    (_, index) => parsedLabels[index] || `分页 ${index + 1}`
  );
  const [active, setActive] = useState(0);
  const id = useId();

  return (
    <div className="my-5 overflow-hidden rounded-xl border">
      <div role="tablist" aria-label="分页内容" className="flex overflow-x-auto border-b bg-muted/40 p-1">
        {safeLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            className={active === index ? "min-h-11 rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "min-h-11 rounded-lg px-3 py-2 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}
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
