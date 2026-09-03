import { Badge } from "@/components/ui/badge";

// Adapted from GitBook's PageTags component.
export function HelpPageTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="文章标签">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
