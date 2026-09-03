import { readFile } from "node:fs/promises";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpDocumentView } from "@/features/help-center/gitbook/document-view";
import { HelpCodeBlock } from "@/features/help-center/gitbook/code-block";
import { HelpFileCard } from "@/features/help-center/gitbook/file-card";
import { HelpHint } from "@/features/help-center/gitbook/hint";
import { HelpMath } from "@/features/help-center/gitbook/math";
import { HelpImage, HelpVideo } from "@/features/help-center/gitbook/media";
import { HelpMermaid } from "@/features/help-center/gitbook/mermaid";
import { HelpPdfEmbed } from "@/features/help-center/gitbook/pdf-embed";
import { HelpTabs } from "@/features/help-center/gitbook/tabs";

describe("help article document view", () => {
  it("renders markdown headings, lists and tables", async () => {
    const view = await HelpDocumentView({
      source: "## 填写资料\n\n- 标题\n- 平台\n\n|项目|说明|\n|---|---|\n|标题|必填|",
    });
    render(view);

    expect(screen.getByRole("heading", { name: "填写资料" }))
      .toHaveAttribute("id", "填写资料");
    expect(screen.getByRole("list")).toHaveTextContent("标题");
    expect(screen.getByRole("list")).toHaveTextContent("平台");
    expect(screen.getByRole("table")).toHaveTextContent("项目");
    expect(screen.getByRole("table")).toHaveTextContent("必填");
  });

  it("renders GitBook-style hints and tabs", () => {
    render(
      <>
        <HelpHint type="warning" title="提交前检查">请先确认正文已经同步。</HelpHint>
        <HelpTabs labels={["员工", "管理员"]}>
          <p>员工步骤</p>
          <p>管理员步骤</p>
        </HelpTabs>
      </>
    );

    expect(screen.getByRole("note", { name: "警告" }))
      .toHaveTextContent("提交前检查请先确认正文已经同步。");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("员工步骤");
    fireEvent.click(screen.getByRole("tab", { name: "管理员" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("管理员步骤");
  });

  it("keeps tab labels when they cross the MDX boundary as text", () => {
    render(
      <HelpTabs labels="员工|管理员">
        <p>员工步骤</p>
        <p>管理员步骤</p>
      </HelpTabs>
    );

    expect(screen.getByRole("tab", { name: "员工" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "管理员" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("管理员步骤");
  });

  it("uses safe fallback labels instead of crashing an article", () => {
    render(
      <HelpTabs>
        <p>第一段</p>
        <p>第二段</p>
      </HelpTabs>
    );

    expect(screen.getByRole("tab", { name: "分页 1" })).toBeInTheDocument();
  });

  it("renders the complete submit-review MDX article", async () => {
    const source = await readFile(
      "content/help/content-review/submit-review.mdx",
      "utf8"
    );
    const view = await HelpDocumentView({ source });
    render(view);

    expect(screen.getByRole("tab", { name: "员工" })).toBeInTheDocument();
    expect(screen.getByLabelText("流程图")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载发布检查清单" }))
      .toBeInTheDocument();
  });

  it("copies code and renders formula and diagram fallbacks", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <>
        <HelpCodeBlock language="text" code="提交审核" />
        <HelpMath formula="x^2 + y^2" />
        <HelpMermaid chart="flowchart TD; A-->B" />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "复制代码" }));
    expect(writeText).toHaveBeenCalledWith("提交审核");
    expect(screen.getByLabelText("数学公式")).toBeInTheDocument();
    expect(screen.getByLabelText("流程图")).toHaveTextContent("flowchart TD; A-->B");
  });

  it("renders image, video, file and PDF blocks with safe failures", () => {
    render(
      <>
        <HelpImage src="/mascots/chiikawa-peek.png" alt="帮助中心示范图片" />
        <HelpVideo src="https://www.youtube-nocookie.com/embed/example" title="示范影片" />
        <HelpVideo src="http://unsafe.example/video" title="不安全影片" />
        <HelpFileCard href="/help/sample-checklist.txt" name="发布检查清单" size="2KB" />
        <HelpPdfEmbed src="/help/example.pdf" title="示范 PDF" />
      </>
    );

    expect(screen.getByRole("img", { name: "帮助中心示范图片" }))
      .toBeInTheDocument();
    expect(screen.getByTitle("示范影片")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("这个影片地址不能使用");
    expect(screen.getByRole("link", { name: /下载发布检查清单/ }))
      .toHaveAttribute("href", "/help/sample-checklist.txt");
    expect(screen.getByTitle("示范 PDF")).toBeInTheDocument();
  });
});
