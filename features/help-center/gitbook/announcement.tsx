import type { ReactNode } from "react";

// Adapted from GitBook's Announcement component.
export function HelpAnnouncement({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center border-b bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
    >
      {children}
    </div>
  );
}
