import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div id="clerk-captcha" className="flex justify-center" />
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
