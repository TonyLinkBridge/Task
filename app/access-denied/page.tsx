import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const workspaceCopy = {
  eyebrow: "Slack Workspace 不符合",
  title: "无法进入内部工作台",
  description: "请使用指定 Slack Workspace 的账号登录。",
  linkLabel: "返回登录页",
  href: "/login",
};

const adminCopy = {
  eyebrow: "管理员权限",
  title: "只有管理员可以进入",
  description: "你的账号是员工，仍然可以继续使用任务和内容排期。",
  linkLabel: "返回任务页面",
  href: "/tasks",
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const reason = (await searchParams).reason;
  const copy = reason === "admin-only" ? adminCopy : workspaceCopy;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <section className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {copy.eyebrow}
        </p>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {copy.description}
        </p>
        <Link className={buttonVariants({ className: "mt-6" })} href={copy.href}>
          {copy.linkLabel}
        </Link>
      </section>
    </main>
  );
}
