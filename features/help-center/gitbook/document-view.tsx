import { compileMDX } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { extractHelpHeadings } from "../content/headings";
import { helpMdxComponents } from "../content/mdx-components";

function addHeadingIds(source: string) {
  const headings = extractHelpHeadings(source);
  let index = 0;

  return source.replace(/^(#{2,3})\s+(.+)$/gm, (line, marks: string, text: string) => {
    const heading = headings[index++];
    if (!heading) return line;
    const level = marks.length;
    return `<h${level} id="${heading.id}">${text}</h${level}>`;
  });
}

// Adapted from GitBook's DocumentView and block mapping.
export async function HelpDocumentView({ source }: { source: string }) {
  const { content } = await compileMDX({
    source: addHeadingIds(source),
    components: helpMdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return <div className="help-document min-w-0">{content}</div>;
}
