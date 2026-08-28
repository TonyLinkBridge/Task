import { z } from "zod";

import type { ContentAttachment } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  findAttachment: (id: string) => Promise<ContentAttachment | null>;
  createSignedUrl: (path: string, expiresIn: number) => Promise<string>;
};

export function makeFileDownloadHandler(dependencies: Dependencies) {
  return async function GET(
    _request: Request,
    context: { params: Promise<{ attachmentId: string }> }
  ) {
    try {
      await dependencies.getVerifiedUser();
    } catch {
      return new Response(null, { status: 403 });
    }

    const { attachmentId } = await context.params;
    if (!z.uuid().safeParse(attachmentId).success) {
      return new Response(null, { status: 404 });
    }
    const attachment = await dependencies.findAttachment(attachmentId);
    if (!attachment) return new Response(null, { status: 404 });

    const signedUrl = await dependencies.createSignedUrl(
      attachment.storagePath,
      60
    );
    return new Response(null, {
      status: 302,
      headers: { location: signedUrl, "cache-control": "no-store" },
    });
  };
}
