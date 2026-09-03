// Adapted from GitBook's File component.
export function HelpFileCard({ href, name, size }: { href: string; name: string; size?: string }) {
  return (
    <div className="my-5 flex flex-wrap items-center gap-4 rounded-xl border p-4">
      <div aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-muted">↓</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        {size ? <p className="text-xs text-muted-foreground">{size}</p> : null}
      </div>
      <a href={href} download className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted" aria-label={`下载${name}`}>
        下载
      </a>
    </div>
  );
}
