"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

// Adapted from GitBook's MermaidCodeBlock component, without fullscreen and pan/zoom.
export function HelpMermaid({ chart }: { chart: string }) {
  const root = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [error, setError] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    const element = root.current;
    if (!element) return;

    void import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "default",
        });
        const id = `help-mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
        return mermaid.render(id, chart);
      })
      .then((result) => {
        if (!cancelled && element) element.innerHTML = result.svg;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, reactId, resolvedTheme]);

  return (
    <div aria-label="流程图" className="my-6 overflow-x-auto rounded-xl border bg-card p-4">
      <pre className="sr-only">{chart}</pre>
      {error ? <p role="alert" className="text-sm text-destructive">流程图无法显示，请检查写法。</p> : null}
      <div ref={root} className="flex min-h-24 items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full" />
    </div>
  );
}
