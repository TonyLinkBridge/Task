import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AssignableUser } from "@/features/tasks/types";

export function MemberList({ members }: { members: AssignableUser[] }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold">系统成员</h3>
        <p className="text-sm text-muted-foreground">
          账号和管理员权限仍然在 Clerk 管理，这里只供查看。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((member) => (
          <article key={member.id} className="flex items-center gap-3 rounded-xl border p-3">
            <Avatar className="size-9">
              {member.imageUrl ? (
                <AvatarImage src={member.imageUrl} alt={member.name} />
              ) : null}
              <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.role === "admin" ? "管理员" : "员工"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
