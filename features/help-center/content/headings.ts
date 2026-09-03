export type HelpHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

function headingId(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[*_`~[\]()]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHelpHeadings(source: string): HelpHeading[] {
  const used = new Map<string, number>();
  const headings: HelpHeading[] = [];
  const pattern = /^(#{2,3})\s+(.+)$/gm;

  for (const match of source.matchAll(pattern)) {
    const text = match[2]!.trim();
    const base = headingId(text) || "section";
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);

    headings.push({
      id: count === 1 ? base : `${base}-${count}`,
      text,
      level: match[1]!.length as 2 | 3,
    });
  }

  return headings;
}
