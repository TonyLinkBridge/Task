import Link from "next/link";

export default function HelpOpenSourcePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
        ← 返回帮助中心
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">开源授权</h1>
      <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
        <p>这个内部帮助中心采用并修改了 GitBook 开源前台的部分代码。</p>
        <p>原项目使用 GNU General Public License version 3。</p>
        <p>完整来源和修改清单保存在项目的 THIRD_PARTY_NOTICES.md。</p>
      </div>
    </div>
  );
}
