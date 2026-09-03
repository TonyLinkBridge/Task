"use client";

import { ContentHeader } from "@/components/app-shell/content-header";
import type { VerifiedUser } from "@/lib/auth/types";

export function HelpHeader({ currentUser }: { currentUser: VerifiedUser }) {
  return (
    <ContentHeader
      currentUser={currentUser}
      title="帮助中心"
      description="Marketing 团队的流程、规则和操作说明"
    />
  );
}
