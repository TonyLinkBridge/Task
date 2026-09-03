"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HelpPdfPrintControls({
  articleHref,
}: {
  articleHref: string;
}) {
  return (
    <div className="help-pdf-controls flex flex-wrap items-center justify-between gap-3">
      <Button render={<Link href={articleHref} />} variant="outline">
        返回文章
      </Button>
      <Button type="button" onClick={() => window.print()}>
        导出 PDF
      </Button>
    </div>
  );
}
