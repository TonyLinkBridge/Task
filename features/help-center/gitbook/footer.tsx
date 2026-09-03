import Link from "next/link";

// Adapted from GitBook's Footer component.
export function HelpFooter() {
  return (
    <footer className="mt-12 border-t py-8 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>JUYU Marketing 内部帮助中心</p>
        <div className="flex items-center gap-4">
          <Link href="/help">帮助中心首页</Link>
          <Link href="/help/open-source">开源授权</Link>
        </div>
      </div>
    </footer>
  );
}
