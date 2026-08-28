import { SlackIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

type SlackLoginCardProps = {
  onContinue: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
};

export function SlackLoginCard({
  onContinue,
  isLoading,
  errorMessage,
}: SlackLoginCardProps) {
  return (
    <section className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 space-y-2 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={SlackIcon} className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">内部工作台</h1>
        <p className="text-sm text-muted-foreground">
          只开放给 JUYU 团队成员使用
        </p>
      </div>

      <div className="mb-5 rounded-lg border bg-muted/40 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">指定 Slack Workspace</p>
        <p className="mt-1 text-sm font-medium">juyuco.slack.com</p>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={isLoading}
        onClick={onContinue}
      >
        <HugeiconsIcon icon={SlackIcon} />
        {isLoading ? "正在打开 Slack…" : "使用 JUYU Slack 继续"}
      </Button>
      <div id="clerk-captcha" className="mt-4 flex justify-center" />
      {errorMessage ? (
        <p role="alert" className="mt-3 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
