import { isValidElement, type ComponentProps, type ReactElement } from "react";
import type { MDXComponents } from "mdx/types";

import { HelpCodeBlock } from "../gitbook/code-block";
import { HelpFileCard } from "../gitbook/file-card";
import { HelpHint } from "../gitbook/hint";
import { HelpMath } from "../gitbook/math";
import { HelpImage, HelpVideo } from "../gitbook/media";
import { HelpMermaid } from "../gitbook/mermaid";
import { HelpPdfEmbed } from "../gitbook/pdf-embed";
import { HelpTabs } from "../gitbook/tabs";

function MdxPre({ children }: ComponentProps<"pre">) {
  if (!isValidElement(children)) {
    return <pre>{children}</pre>;
  }

  const child = children as ReactElement<{ className?: string; children?: unknown }>;
  const language = child.props.className?.replace("language-", "") ?? "text";
  const code = String(child.props.children ?? "").replace(/\n$/, "");
  return <HelpCodeBlock language={language} code={code} />;
}

function MdxLink({ href = "", children, ...props }: ComponentProps<"a">) {
  const external = href.startsWith("http://") || href.startsWith("https://");
  return (
    <a
      href={href}
      className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-4 hover:decoration-blue-600 dark:text-blue-400"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  );
}

export const helpMdxComponents: MDXComponents = {
  h2: (props) => <h2 className="mb-3 mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-8 scroll-mt-24 text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4 leading-8 text-foreground/90" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
  li: (props) => <li className="pl-1 leading-7" {...props} />,
  blockquote: (props) => <blockquote className="my-5 border-l-4 pl-4 text-muted-foreground" {...props} />,
  a: MdxLink,
  img: ({ src = "", alt = "" }) => <HelpImage src={String(src)} alt={alt} />,
  pre: MdxPre,
  code: (props) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />,
  table: (props) => <table className="my-6 block w-full overflow-x-auto border-collapse text-sm" {...props} />,
  th: (props) => <th className="border bg-muted/60 px-4 py-3 text-left font-semibold" {...props} />,
  td: (props) => <td className="border px-4 py-3 align-top" {...props} />,
  hr: (props) => <hr className="my-8" {...props} />,
  Hint: HelpHint,
  Tabs: HelpTabs,
  Image: HelpImage,
  Video: HelpVideo,
  File: HelpFileCard,
  Pdf: HelpPdfEmbed,
  Math: HelpMath,
  Mermaid: HelpMermaid,
  CodeBlock: HelpCodeBlock,
};
