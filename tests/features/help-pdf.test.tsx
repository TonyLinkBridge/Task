import { readFile } from "node:fs/promises";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpDocumentView } from "@/features/help-center/gitbook/document-view";
import { HelpPdfPrintControls } from "@/features/help-center/gitbook/pdf-print-controls";
import { HelpPdfRootLayout } from "@/features/help-center/gitbook/pdf-root-layout";

describe("help article PDF view", () => {
  it("shows a clean printable article without the workbench sidebar", () => {
    render(
      <HelpPdfRootLayout
        title="如何提交上司审核"
        category="内容审核"
        updatedAt="2026-09-03"
      >
        <p>提交内容给上司审核</p>
      </HelpPdfRootLayout>
    );

    expect(screen.getByTestId("pdf-print-document"))
      .toHaveTextContent("如何提交上司审核");
    expect(screen.getByTestId("pdf-print-document"))
      .toHaveTextContent("提交内容给上司审核");
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  it("opens the browser print dialog for PDF export", () => {
    const print = vi.fn();
    Object.defineProperty(window, "print", { value: print, writable: true });
    render(<HelpPdfPrintControls articleHref="/help/内容审核/提交审核" />);

    fireEvent.click(screen.getByRole("button", { name: "导出 PDF" }));
    expect(print).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "返回文章" }))
      .toHaveAttribute("href", "/help/内容审核/提交审核");
  });

  it("keeps rich article content in the printable version", async () => {
    const source = await readFile(
      "content/help/platforms/help-content-components.mdx",
      "utf8"
    );
    const content = await HelpDocumentView({ source });

    render(
      <HelpPdfRootLayout
        title="帮助中心内容组件示范"
        category="平台操作"
        updatedAt="2026-09-03"
      >
        <HelpPdfPrintControls articleHref="/help/平台操作/帮助中心内容示范" />
        {content}
      </HelpPdfRootLayout>
    );

    expect(screen.getByTestId("pdf-print-document"))
      .toHaveTextContent("帮助中心内容组件示范");
    expect(screen.getByRole("button", { name: "导出 PDF" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回文章" }))
      .toHaveAttribute("href", "/help/平台操作/帮助中心内容示范");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByLabelText("流程图")).toBeInTheDocument();
  });

  it("forces the printable article and rich blocks to use light colors", async () => {
    const css = await readFile("features/help-center/gitbook/pdf.css", "utf8");

    expect(css).toContain(".help-pdf-document,");
    expect(css).toContain(".help-pdf-document .help-document");
    expect(css).toContain("background: #fff !important;");
    expect(css).toContain("color: #111 !important;");
  });
});
