"use client";

import { Button } from "@/components/ui/button";

// Adapted from GitBook's ScrollToTopButton component.
export function HelpScrollToTop() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-6 w-full"
      onClick={(event) => {
        const main = event.currentTarget.closest("main");
        if (main) {
          main.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      回到顶部
    </Button>
  );
}
