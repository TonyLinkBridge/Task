import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  ALLOWED_SLACK_TEAM_ID: z.string().regex(/^T[A-Z0-9]+$/),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: z.string().regex(/^pk_/),
  LIVEBLOCKS_SECRET_KEY: z.string().regex(/^sk_/),
  LIVEBLOCKS_WEBHOOK_SECRET: z.string().min(1),
  SLACK_BOT_TOKEN: z.string().regex(/^xoxb-/).optional(),
  SLACK_SIGNING_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  EDGE_FUNCTION_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  input: Record<string, string | undefined>
): ServerEnv {
  return serverEnvSchema.parse(input);
}

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
