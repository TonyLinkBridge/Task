import { revalidatePath } from "next/cache";

import { makeTaskActions } from "@/features/tasks/action-service";
import { taskRepository } from "@/features/tasks/repository";
import type { TaskStatus } from "@/features/tasks/types";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const taskActions = makeTaskActions({
  getVerifiedUser,
  repository: taskRepository,
  now: () => new Date(),
  revalidatePath,
});

export async function createTask(input: unknown) {
  "use server";
  return taskActions.createTask(input);
}

export async function updateTask(id: string, input: unknown) {
  "use server";
  return taskActions.updateTask(id, input);
}

export async function moveTask(id: string, status: TaskStatus, position: number) {
  "use server";
  return taskActions.moveTask(id, status, position);
}

export async function archiveTask(id: string) {
  "use server";
  return taskActions.archiveTask(id);
}

export async function deleteTask(id: string) {
  "use server";
  return taskActions.deleteTask(id);
}

export async function addTaskComment(taskId: string, body: string) {
  "use server";
  return taskActions.addTaskComment(taskId, body);
}
