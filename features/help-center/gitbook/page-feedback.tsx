"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type FeedbackInput = {
  articleSlug: string;
  helpful: boolean;
  comment?: string;
};

type FeedbackResult = { ok: boolean; message: string };

// Adapted from GitBook's PageFeedbackForm component.
export function HelpPageFeedback({
  articleSlug,
  saveAction,
}: {
  articleSlug: string;
  saveAction: (input: FeedbackInput) => Promise<FeedbackResult>;
}) {
  const [choice, setChoice] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(input: FeedbackInput) {
    setMessage("");
    startTransition(async () => {
      const result = await saveAction(input);
      setMessage(result.message);
    });
  }

  return (
    <section className="mt-10 rounded-xl border bg-card p-5" aria-labelledby="help-feedback-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="help-feedback-title" className="font-semibold">这篇文章有帮助吗？</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={choice === true ? "default" : "outline"}
            disabled={pending}
            onClick={() => {
              setChoice(true);
              setComment("");
              submit({ articleSlug, helpful: true });
            }}
          >
            有帮助
          </Button>
          <Button
            type="button"
            variant={choice === false ? "default" : "outline"}
            disabled={pending}
            onClick={() => {
              setChoice(false);
              setMessage("");
            }}
          >
            没帮助
          </Button>
        </div>
      </div>

      {choice === false ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm">
            <span>哪里不清楚？</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              minLength={3}
              maxLength={512}
              className="resize-y rounded-lg border bg-background p-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <Button
            type="button"
            className="justify-self-start"
            disabled={pending || comment.trim().length < 3}
            onClick={() => submit({ articleSlug, helpful: false, comment: comment.trim() })}
          >
            {pending ? "保存中…" : "送出反馈"}
          </Button>
        </div>
      ) : null}

      {message ? <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
