"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

import { SlackLoginCard } from "@/components/auth/slack-login-card";

export function SlackLoginButton({ redirectTo }: { redirectTo: string }) {
  const { fetchStatus, signIn } = useSignIn();
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function startSlackLogin() {
    setErrorMessage(null);
    setIsOpening(true);
    try {
      const { error } = await signIn.sso({
        strategy: "oauth_slack",
        redirectUrl: redirectTo,
        redirectCallbackUrl: "/sso-callback",
      });

      if (error) {
        setErrorMessage("暂时无法打开 Slack，请稍后再试。");
        setIsOpening(false);
      }
    } catch {
      setErrorMessage("暂时无法打开 Slack，请稍后再试。");
      setIsOpening(false);
    }
  }

  return (
    <SlackLoginCard
      isLoading={fetchStatus === "fetching" || isOpening}
      onContinue={startSlackLogin}
      errorMessage={errorMessage}
    />
  );
}
