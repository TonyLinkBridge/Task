import Link from 'next/link';

export function ArchivedTaskNotice() {
  return <div className="marketing-card marketing-entry">
    <section className="marketing-page-empty" aria-label="任务已归档">
      <h2>这个任务已经归档</h2>
      <p>任务已从日常看板收起，原本的通知仍然保留。</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/marketing/inbox" className="marketing-primary">返回通知</Link>
        <Link href="/marketing/tasks" className="underline underline-offset-4">查看任务看板</Link>
      </div>
    </section>
  </div>;
}
