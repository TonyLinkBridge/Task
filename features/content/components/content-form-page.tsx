"use client";

import { useRouter } from "next/navigation";

import type { ContentActionResult } from "@/features/content/action-service";
import { ContentForm } from "@/features/content/components/content-form";
import type { ContentPlatform } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";

export function ContentFormPage({
  platforms,
  assignees,
  createContentAction,
}: {
  platforms: ContentPlatform[];
  assignees: AssignableUser[];
  createContentAction: (input: unknown) => Promise<ContentActionResult>;
}) {
  const router = useRouter();
  return (
    <ContentForm
      platforms={platforms}
      assignees={assignees}
      createContentAction={createContentAction}
      onSaved={(content) => router.push(`/content/${content.id}`)}
    />
  );
}
