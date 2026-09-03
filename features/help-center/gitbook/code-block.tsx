import { HelpCopyCodeButton } from "./copy-code-button";

// Adapted from GitBook's CodeBlock and PlainCodeBlock components.
export function HelpCodeBlock({
  language = "text",
  code,
}: {
  language?: string;
  code: string;
}) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs text-zinc-400">{language}</span>
        <HelpCopyCodeButton code={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}
