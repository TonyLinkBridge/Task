"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

export function ContentRoom({
  contentId,
  children,
}: {
  contentId: string;
  children: React.ReactNode;
}) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) => {
        const response = await fetch("/api/liveblocks-users", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userIds }),
        });
        if (!response.ok) return undefined;
        return response.json();
      }}
    >
      <RoomProvider id={`content:${contentId}`} initialPresence={{}}>
        <ClientSideSuspense
          fallback={
            <div className="min-h-72 animate-pulse rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
              正在打开内容…
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
