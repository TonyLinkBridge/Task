import { makeFileDownloadHandler } from "@/features/content/api/file-download-handler";
import { taskRepository } from "@/features/tasks/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "task-files";

export const GET = makeFileDownloadHandler({
  getVerifiedUser,
  findAttachment: (id) => taskRepository.findAttachment(id),
  async createSignedUrl(path, expiresIn) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .createSignedUrl(path, expiresIn, { download: true });
    if (error || !data) throw new Error("TASK_FILE_SIGNING_FAILED");
    return data.signedUrl;
  },
});
