"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SearchResult = {
  id: string;
  type: "task" | "content" | "help";
  title: string;
  subtitle: string;
  href: string;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((response) => (response.ok ? response.json() : { results: [] }))
        .then((data) => setResults(data.results))
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  function changeQuery(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" aria-label="打开全系统搜索" />
        }
      >
        <HugeiconsIcon icon={Search01Icon} />
        <span className="hidden sm:inline">搜索</span>
        <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>搜索整个工作台</DialogTitle>
        </DialogHeader>
        <label className="grid gap-2 text-sm">
          <span className="sr-only">搜索任务、内容和帮助文章</span>
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <HugeiconsIcon icon={Search01Icon} className="size-4 text-muted-foreground" />
            <input
              aria-label="搜索任务、内容和帮助文章"
              autoFocus
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="输入至少两个字…"
              className="h-11 min-w-0 flex-1 bg-transparent outline-none"
            />
          </div>
        </label>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {results.map((result) => (
            <Link
              key={`${result.type}:${result.id}`}
              href={result.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{result.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {result.subtitle}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {result.type === "task" ? "任务" : result.type === "content" ? "内容" : "帮助文章"}
              </span>
            </Link>
          ))}
          {isSearching ? (
            <p className="py-6 text-center text-sm text-muted-foreground">搜索中…</p>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">没有找到结果</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
