import { z } from "zod";

export const contentInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  platformIds: z
    .array(z.uuid())
    .min(1)
    .transform((ids) => [...new Set(ids)]),
  publishAt: z.iso.datetime(),
  assigneeId: z.string().trim().min(1),
});

export type ContentInput = z.infer<typeof contentInputSchema>;
