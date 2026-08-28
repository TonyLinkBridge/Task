import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { malaysiaDateTimeFormatter } from "@/features/schedule/date";
import type { ScheduledContent } from "@/features/schedule/types";

const statusLabels = {
  draft: "草稿",
  in_review: "等待审核",
  changes_requested: "需要修改",
  approved: "已经批准",
  due: "等待发布",
  published: "已经发布",
} as const;

export function ContentList({ contents }: { contents: ScheduledContent[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">内容</th>
            <th className="px-4 py-3 font-medium">平台</th>
            <th className="px-4 py-3 font-medium">负责人</th>
            <th className="px-4 py-3 font-medium">审核</th>
            <th className="px-4 py-3 font-medium">发布时间</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {contents.map((content) => (
            <tr key={content.id}>
              <td className="px-4 py-3">
                <Link className="font-medium hover:underline" href={`/content/${content.id}`}>
                  {content.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{statusLabels[content.status]}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {content.platforms.map((platform) => (
                    <Badge key={platform.id} variant="outline">{platform.name}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">{content.assignee.name}</td>
              <td className="px-4 py-3">
                已批准 {new Set(content.approvalAdminIds).size}/{content.requiredApprovals}
              </td>
              <td className="px-4 py-3">
                {malaysiaDateTimeFormatter.format(new Date(content.publishAt))}
              </td>
            </tr>
          ))}
          {contents.length === 0 ? (
            <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">这个筛选暂时没有内容</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
