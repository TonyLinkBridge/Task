import type { HelpHeading } from "../content/headings";

// Mobile adaptation of GitBook's PageAside content outline.
export function HelpMobilePageOutline({ headings }: { headings: HelpHeading[] }) {
  if (headings.length === 0) return null;

  return (
    <details className="mb-6 rounded-xl border bg-card xl:hidden">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        本页内容
      </summary>
      <nav aria-label="手机本页内容" className="grid gap-1 border-t px-3 py-3 text-sm">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`${heading.level === 3 ? "pl-6" : "pl-3"} flex min-h-11 items-center rounded-lg pr-3 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </details>
  );
}
