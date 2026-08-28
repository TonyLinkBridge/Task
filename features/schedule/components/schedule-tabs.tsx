"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ContentBoard } from "@/features/schedule/components/content-board";
import { ContentCalendar } from "@/features/schedule/components/content-calendar";
import { ContentList } from "@/features/schedule/components/content-list";
import type { ScheduledContent } from "@/features/schedule/types";

type View = "calendar" | "list" | "board";

export function ScheduleTabs({
  contents,
  moveAction,
}: {
  contents: ScheduledContent[];
  moveAction?: (
    contentId: string,
    status: "draft" | "changes_requested"
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const [view, setView] = useState<View>("calendar");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>日历</Button>
        <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>清单</Button>
        <Button variant={view === "board" ? "default" : "outline"} onClick={() => setView("board")}>看板</Button>
      </div>
      {view === "calendar" ? <ContentCalendar contents={contents} /> : null}
      {view === "list" ? <ContentList contents={contents} /> : null}
      {view === "board" ? (
        <ContentBoard
          initialContents={contents}
          moveAction={moveAction}
          onMoved={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
