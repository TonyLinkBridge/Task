import type { ReactNode } from "react";

import type { AppRole } from "@/lib/auth/types";

export function AdminOnly({ role, children }: { role: AppRole; children: ReactNode }) {
  return role === "admin" ? children : null;
}
