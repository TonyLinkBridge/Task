import { SlackLoginButton } from "@/components/auth/slack-login-button";
import { safeRedirectPath } from "@/lib/auth/redirect";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedPath = Array.isArray(params.redirect)
    ? params.redirect[0]
    : params.redirect;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <SlackLoginButton redirectTo={safeRedirectPath(requestedPath)} />
    </main>
  );
}
