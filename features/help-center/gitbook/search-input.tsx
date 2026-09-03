// Adapted from GitBook's SearchInput component.
export function HelpSearchInput({ defaultValue = "", large = false }: { defaultValue?: string; large?: boolean }) {
  return (
    <form action="/help/search" role="search" className="w-full">
      <label className="sr-only" htmlFor={large ? "help-home-search" : "help-search"}>搜索帮助文章</label>
      <div className={`flex items-center gap-3 rounded-xl border bg-card px-4 shadow-sm focus-within:ring-2 focus-within:ring-ring ${large ? "h-14" : "h-11"}`}>
        <span aria-hidden="true" className="text-muted-foreground">⌕</span>
        <input
          id={large ? "help-home-search" : "help-search"}
          name="q"
          type="search"
          defaultValue={defaultValue}
          minLength={2}
          maxLength={100}
          placeholder="搜索文章、流程和常见问题……"
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
        <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">搜索</button>
      </div>
    </form>
  );
}
