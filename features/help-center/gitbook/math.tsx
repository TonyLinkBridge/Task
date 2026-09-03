import katex from "katex";

// Adapted from GitBook's Math component.
export function HelpMath({ formula, block = true }: { formula: string; block?: boolean }) {
  const html = katex.renderToString(formula, { displayMode: block, throwOnError: false, strict: "warn" });
  return (
    <span
      aria-label="数学公式"
      className={block ? "my-5 block overflow-x-auto py-2" : "inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
