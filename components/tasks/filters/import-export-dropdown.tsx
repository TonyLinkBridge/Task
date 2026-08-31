"use client";

import {
  ArrowDown01Icon,
  Csv02Icon,
  Download01Icon,
  Table01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskInput } from "@/features/tasks/schema";
import type { AssignableUser, TaskRecord } from "@/features/tasks/types";

type TaskActionResult =
  | { ok: true; data: TaskRecord }
  | { ok: false; message: string };

type ImportExportDropdownProps = {
  tasks?: TaskRecord[];
  assignees?: AssignableUser[];
  createTaskAction?: (input: unknown) => Promise<TaskActionResult>;
  downloadFile?: (name: string, content: string) => void;
  downloadBinary?: (name: string, content: Uint8Array) => void;
};

const priorityToChinese = {
  low: "普通",
  medium: "重要",
  urgent: "紧急",
} as const;

const csvPriority = new Map<string, TaskInput["priority"]>([
  ["普通", "low"],
  ["重要", "medium"],
  ["紧急", "urgent"],
  ["low", "low"],
  ["medium", "medium"],
  ["urgent", "urgent"],
]);

function csvCell(value: string) {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function malaysiaDateTime(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function buildTaskCsv(tasks: TaskRecord[], assignees: AssignableUser[]) {
  const assigneeNames = new Map(assignees.map((person) => [person.id, person.name]));
  const rows = tasks.map((task) =>
    [
      task.title,
      task.project,
      task.description,
      assigneeNames.get(task.assigneeId) ?? task.assigneeId,
      priorityToChinese[task.priority],
      malaysiaDateTime(task.dueAt),
    ]
      .map(csvCell)
      .join(",")
  );
  return `\uFEFF标题,项目／分类,说明,负责人,优先级,完成时间\n${rows.join("\n")}`;
}

function parseCsvRows(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseDueAt(value: string) {
  const local = value.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?$/);
  const date = local
    ? new Date(`${local[1]}T${local[2]}:00+08:00`)
    : new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseTaskCsv(content: string, assignees: AssignableUser[]) {
  const rows = parseCsvRows(content.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map((value) => value.trim()) ?? [];
  const hasProject = headers.includes("项目／分类");
  const expectedHeaders = hasProject
    ? ["标题", "项目／分类", "说明", "负责人", "优先级", "完成时间"]
    : ["标题", "说明", "负责人", "优先级", "完成时间"];
  if (headers.join("|") !== expectedHeaders.join("|")) {
    return { inputs: [] as TaskInput[], errors: ["第一行必须使用系统导出的栏目格式。"] };
  }

  const people = new Map<string, string>();
  assignees.forEach((person) => {
    people.set(person.name.trim().toLocaleLowerCase(), person.id);
    people.set(person.id.toLocaleLowerCase(), person.id);
  });

  const inputs: TaskInput[] = [];
  const errors: string[] = [];
  rows.slice(0, 200).forEach((values, index) => {
    const rowNumber = index + 2;
    const [rawTitle = "", ...rest] = values;
    const [rawProject, description, rawAssignee, rawPriority, rawDueAt] = hasProject
      ? rest
      : ["一般", ...rest];
    const title = rawTitle.trim();
    const project = (rawProject ?? "").trim();
    const assigneeId = people.get(rawAssignee.trim().toLocaleLowerCase());
    const priority = csvPriority.get(rawPriority.trim().toLocaleLowerCase());
    const dueAt = parseDueAt(rawDueAt);

    if (!title || title.length > 200) {
      errors.push(`第 ${rowNumber} 行：标题不能为空，而且不能超过 200 个字。`);
    } else if (!project || project.length > 100) {
      errors.push(`第 ${rowNumber} 行：项目／分类不能为空，而且不能超过 100 个字。`);
    } else if (!assigneeId) {
      errors.push(`第 ${rowNumber} 行：找不到负责人“${rawAssignee.trim()}”。`);
    } else if (!priority) {
      errors.push(`第 ${rowNumber} 行：优先级必须是普通、重要或紧急。`);
    } else if (!dueAt) {
      errors.push(`第 ${rowNumber} 行：完成时间格式不正确。`);
    } else if (description.length > 10_000) {
      errors.push(`第 ${rowNumber} 行：说明不能超过 10000 个字。`);
    } else {
      inputs.push({ title, project, description: description.trim(), assigneeId, priority, dueAt });
    }
  });

  if (rows.length > 200) errors.push("一次最多只能导入 200 个任务。");
  return { inputs, errors };
}

function defaultDownload(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function defaultBinaryDownload(name: string, content: Uint8Array) {
  const copied = new Uint8Array(content);
  const url = URL.createObjectURL(
    new Blob([copied.buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportExportDropdown({
  tasks = [],
  assignees = [],
  createTaskAction = async () => ({ ok: false, message: "暂时无法保存，请稍后再试。" }),
  downloadFile = defaultDownload,
  downloadBinary = defaultBinaryDownload,
}: ImportExportDropdownProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const excelInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  function exportCsv() {
    const filename = `任务-${new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Kuala_Lumpur" })}.csv`;
    downloadFile(filename, buildTaskCsv(tasks, assignees));
    setStatus(`已经导出 ${tasks.length} 个任务`);
  }

  async function exportExcel() {
    setIsImporting(true);
    const XLSX = await import("xlsx");
    const names = new Map(assignees.map((person) => [person.id, person.name]));
    const worksheet = XLSX.utils.json_to_sheet(
      tasks.map((task) => ({
        标题: task.title,
        "项目／分类": task.project,
        说明: task.description,
        负责人: names.get(task.assigneeId) ?? task.assigneeId,
        优先级: priorityToChinese[task.priority],
        完成时间: malaysiaDateTime(task.dueAt),
      })),
      { header: ["标题", "项目／分类", "说明", "负责人", "优先级", "完成时间"] }
    );
    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 48 },
      { wch: 18 },
      { wch: 10 },
      { wch: 20 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "任务");
    const array = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const data = array instanceof Uint8Array ? array : new Uint8Array(array);
    const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Kuala_Lumpur" });
    downloadBinary(`任务-${date}.xlsx`, data);
    setStatus(`已经导出 ${tasks.length} 个任务`);
    setIsImporting(false);
  }

  async function saveImported(inputs: TaskInput[]) {
    let saved = 0;
    for (const input of inputs) {
      const result = await createTaskAction(input);
      if (!result.ok) {
        setStatus(`已经导入 ${saved} 个任务；其余任务保存失败：${result.message}`);
        return false;
      }
      saved += 1;
    }
    setStatus(`成功导入 ${saved} 个任务`);
    return true;
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    const parsed = parseTaskCsv(await file.text(), assignees);
    if (parsed.errors.length) {
      setStatus(parsed.errors[0]);
      setIsImporting(false);
      return;
    }

    await saveImported(parsed.inputs);
    setIsImporting(false);
  }

  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) {
        setStatus("Excel 文件里没有可以读取的工作表。");
        return;
      }
      const csv = XLSX.utils.sheet_to_csv(worksheet, { dateNF: "yyyy-mm-dd hh:mm" });
      const parsed = parseTaskCsv(csv, assignees);
      if (parsed.errors.length) {
        setStatus(parsed.errors[0]);
        return;
      }
      await saveImported(parsed.inputs);
    } catch {
      setStatus("这个 Excel 文件无法读取，请使用系统导出的格式再试一次。");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={fileInput}
        aria-label="选择 CSV 文件"
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={importCsv}
      />
      <input
        ref={excelInput}
        aria-label="选择 Excel 文件"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={importExcel}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" className="h-9 gap-2" disabled={isImporting}>
              <span className="text-xs">{isImporting ? "正在导入…" : "导入／导出"}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => fileInput.current?.click()} className="gap-2 cursor-pointer">
            <HugeiconsIcon icon={Upload01Icon} className="size-4" />
            导入 CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => excelInput.current?.click()} className="gap-2 cursor-pointer">
            <HugeiconsIcon icon={Table01Icon} className="size-4" />
            导入 Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportCsv} className="gap-2 cursor-pointer">
            <HugeiconsIcon icon={Download01Icon} className="size-4" />
            导出 CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void exportExcel()} className="gap-2 cursor-pointer">
            <HugeiconsIcon icon={Csv02Icon} className="size-4" />
            导出 Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span role="status" className="max-w-72 text-right text-xs text-muted-foreground">{status}</span>
    </div>
  );
}
