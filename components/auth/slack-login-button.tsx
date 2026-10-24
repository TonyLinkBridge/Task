"use client";

import { useClerk, useSignIn } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { SlackLoginCard } from "@/components/auth/slack-login-card";

export function SlackLoginButton({ redirectTo }: { redirectTo: string }) {
  const { fetchStatus, signIn } = useSignIn();
  const clerk = useClerk();
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const restartPending = useRef(false);

  const openSlack = useCallback(async () => {
    try {
      const { error } = await signIn.sso({
        strategy: "oauth_slack",
        redirectUrl: redirectTo,
        redirectCallbackUrl: "/sso-callback",
      });

      if (error) {
        setErrorMessage("暂时无法打开 Slack，请稍后再试。");
      } else if (signIn.status === "needs_identifier" && !signIn.firstFactorVerification.externalVerificationRedirectURL) {
        setErrorMessage("Slack 登录还没有开始，请点击重试。");
      }
    } catch {
      setErrorMessage("暂时无法打开 Slack，请稍后再试。");
    } finally {
      setIsOpening(false);
    }
  }, [redirectTo, signIn]);

  useEffect(() => {
    if (restartPending.current && !signIn.id) {
      restartPending.current = false;
      // reset() replaces the SDK resource. Calling sso() on the discarded object is a no-op.
      void openSlack();
    }
  }, [signIn, signIn.id, openSlack]);

  async function startSlackLogin() {
    setErrorMessage(null);
    setIsOpening(true);
    if (signIn.id && signIn.status === "needs_identifier" && !signIn.firstFactorVerification.externalVerificationRedirectURL) {
      restartPending.current = true;
      try {
        await signIn.reset();
      } catch {
        restartPending.current = false;
        setErrorMessage("暂时无法打开 Slack，请稍后再试。");
        setIsOpening(false);
      }
      return;
    }
    await openSlack();
  }

  return (
    <SlackLoginCard
      isLoading={!clerk.loaded || fetchStatus === "fetching" || isOpening}
      onContinue={startSlackLogin}
      errorMessage={errorMessage}
    />
  );
}
