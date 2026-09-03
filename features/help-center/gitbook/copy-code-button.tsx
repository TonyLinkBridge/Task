"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

// Adapted from GitBook's CopyCodeButton component.
export function HelpCopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      }}
      aria-label={copied ? "已经复制" : "复制代码"}
    >
      {copied ? "已经复制" : "复制代码"}
    </Button>
  );
}
