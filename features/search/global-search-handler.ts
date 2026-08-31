import type { VerifiedUser } from "@/lib/auth/types";

type SearchRow = { id: string; title: string; subtitle: string };

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  searchTasks: (query: string) => Promise<SearchRow[]>;
  searchContents: (query: string) => Promise<SearchRow[]>;
};

export function makeGlobalSearchHandler(dependencies: Dependencies) {
  return async function GET(request: Request) {
    try {
      await dependencies.getVerifiedUser();
      const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
      if (query.length < 2 || query.length > 100) {
        return Response.json({ error: "invalid_query" }, { status: 400 });
      }
      const [tasks, contents] = await Promise.all([
        dependencies.searchTasks(query),
        dependencies.searchContents(query),
      ]);
      return Response.json({
        results: [
          ...tasks.map((row) => ({
            ...row,
            type: "task" as const,
            href: `/tasks/${row.id}`,
          })),
          ...contents.map((row) => ({
            ...row,
            type: "content" as const,
            href: `/content/${row.id}`,
          })),
        ],
      });
    } catch {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  };
}
