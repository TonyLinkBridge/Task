import { Badge } from "@/components/ui/badge";
import { approvalProgress } from "@/features/approval/rules";
import type { ContentApproval } from "@/features/approval/types";

export function ApprovalProgress({
  required,
  approvals,
}: {
  required: 1 | 2;
  approvals: ContentApproval[];
}) {
  const activeAdminIds = approvals
    .filter(({ invalidatedAt }) => invalidatedAt === null)
    .map(({ adminId }) => adminId);
  const progress = approvalProgress(required, activeAdminIds);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={progress.complete ? "default" : "secondary"}>
        已批准 {progress.count}/{required}
      </Badge>
      {progress.complete ? (
        <span className="text-xs text-emerald-700">审核完成</span>
      ) : null}
    </div>
  );
}
