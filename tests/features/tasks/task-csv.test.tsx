import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { ImportExportDropdown } from "@/components/tasks/filters/import-export-dropdown";
import type { AssignableUser, TaskRecord } from "@/features/tasks/types";

const employee: AssignableUser = {
  id: "employee-1",
  role: "employee",
  name: "Ivy",
  imageUrl: null,
};

const task: TaskRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "准备, 周报",
  project: "内容运营",
  description: "第一段\n第二段",
  status: "todo",
  priority: "urgent",
  kind: "general",
  assigneeId: employee.id,
  creatorId: "admin",
  dueAt: "2026-09-02T02:00:00.000Z",
  position: 1000,
  linkedContentId: null,
  archivedAt: null,
  createdAt: "2026-08-31T02:00:00.000Z",
  updatedAt: "2026-08-31T02:00:00.000Z",
};

describe("ImportExportDropdown", () => {
  it("exports the current tasks as a Chinese CSV file", async () => {
    const user = userEvent.setup();
    let download: { name: string; content: string } | undefined;

    render(
      <ImportExportDropdown
        tasks={[task]}
        assignees={[employee]}
        downloadFile={(name, content) => {
          download = { name, content };
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "导入／导出" }));
    await user.click(await screen.findByRole("menuitem", { name: "导出 CSV" }));

    expect(download?.name).toMatch(/^任务-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(download?.content).toContain("标题,项目／分类,说明,负责人,优先级,完成时间");
    expect(download?.content).toContain('"准备, 周报"');
    expect(download?.content).toContain('"第一段\n第二段"');
    expect(download?.content).toContain("Ivy,紧急,2026-09-02 10:00");
  });

  it("imports valid CSV rows and keeps paragraph breaks", async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    const csv = [
      "标题,说明,负责人,优先级,完成时间",
      '新任务,"第一段\n第二段",Ivy,重要,2026-09-03 09:30',
    ].join("\n");

    render(
      <ImportExportDropdown
        tasks={[]}
        assignees={[employee]}
        createTaskAction={async (input) => {
          received.push(input);
          return { ok: true, data: task };
        }}
      />
    );

    await user.upload(
      screen.getByLabelText("选择 CSV 文件"),
      new File([csv], "tasks.csv", { type: "text/csv" })
    );

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toMatchObject({
      title: "新任务",
      project: "一般",
      description: "第一段\n第二段",
      assigneeId: employee.id,
      priority: "medium",
      dueAt: "2026-09-03T01:30:00.000Z",
    });
    expect(screen.getByRole("status")).toHaveTextContent("成功导入 1 个任务");
  });

  it("exports a real Excel workbook", async () => {
    const user = userEvent.setup();
    let downloaded: Uint8Array | undefined;
    render(
      <ImportExportDropdown
        tasks={[task]}
        assignees={[employee]}
        downloadBinary={(_name, content) => {
          downloaded = content;
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "导入／导出" }));
    await user.click(await screen.findByRole("menuitem", { name: "导出 Excel" }));

    await waitFor(() => expect(downloaded).toBeDefined());
    const workbook = XLSX.read(downloaded, { type: "array" });
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets[workbook.SheetNames[0]],
      { raw: false }
    );
    expect(rows[0]).toMatchObject({
      标题: "准备, 周报",
      "项目／分类": "内容运营",
      说明: "第一段\n第二段",
      负责人: "Ivy",
      优先级: "紧急",
      完成时间: "2026-09-02 10:00",
    });
  });

  it("imports tasks from a real Excel workbook", async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    const worksheet = XLSX.utils.json_to_sheet([
      {
        标题: "Excel 任务",
        "项目／分类": "客户项目",
        说明: "从工作簿导入",
        负责人: "Ivy",
        优先级: "普通",
        完成时间: "2026-09-04 11:00",
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "任务");
    const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    render(
      <ImportExportDropdown
        tasks={[]}
        assignees={[employee]}
        createTaskAction={async (input) => {
          received.push(input);
          return { ok: true, data: task };
        }}
      />
    );

    await user.upload(
      screen.getByLabelText("选择 Excel 文件"),
      new File([data], "tasks.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toMatchObject({
      title: "Excel 任务",
      project: "客户项目",
      assigneeId: employee.id,
      priority: "low",
      dueAt: "2026-09-04T03:00:00.000Z",
    });
    expect(screen.getByRole("status")).toHaveTextContent("成功导入 1 个任务");
  });
});
