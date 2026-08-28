import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <section className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Slack Workspace 不符合
        </p>
        <h1 className="text-2xl font-semibold">无法进入内部工作台</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          请使用指定 Slack Workspace 的账号登录。
        </p>
        <Link className={buttonVariants({ className: "mt-6" })} href="/login">
          返回登录页
        </Link>
      </section>
    </main>
  );
}
