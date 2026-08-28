import { makeFileDownloadHandler } from "@/features/content/api/file-download-handler";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "content-files";

export const GET = makeFileDownloadHandler({
  getVerifiedUser,
  findAttachment: (id) => contentRepository.findAttachment(id),
  async createSignedUrl(path, expiresIn) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .createSignedUrl(path, expiresIn, { download: true });
    if (error || !data) {
      throw new Error(`FILE_SIGNING_FAILED:${error?.message ?? "NO_DATA"}`);
    }
    return data.signedUrl;
  },
});
