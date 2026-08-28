"use client";

import { FormEvent, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  ContentComment,
  ContentCommentView,
} from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

type AddCommentResult =
  | { ok: true; data: ContentComment }
  | { ok: false; message: string };

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});

export function ContentChat({
  contentId,
  comments: initialComments,
  currentUser,
  addCommentAction = async () => ({
    ok: false,
    message: "暂时无法留言，请稍后再试。",
  }),
}: {
  contentId: string;
  comments: ContentCommentView[];
  currentUser: VerifiedUser;
  addCommentAction?: (
    contentId: string,
    body: string
  ) => Promise<AddCommentResult>;
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    setIsSaving(true);
    setErrorMessage(null);
    const result = await addCommentAction(contentId, trimmedBody);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    setComments((current) => [
      ...current,
      {
        ...result.data,
        authorName: currentUser.name,
        authorImageUrl: currentUser.imageUrl,
      },
    ]);
    setBody("");
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium">普通留言</h2>
        <span className="text-xs text-muted-foreground">
          {comments.length} 条
        </span>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="flex gap-3">
            <Avatar className="size-8 shrink-0">
              {comment.authorImageUrl ? (
                <AvatarImage
                  src={comment.authorImageUrl}
                  alt={comment.authorName}
                />
              ) : null}
              <AvatarFallback>{comment.authorName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 rounded-lg bg-muted/50 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{comment.authorName}</p>
                <time className="text-xs text-muted-foreground">
                  {timeFormatter.format(new Date(comment.createdAt))}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                {comment.body}
              </p>
            </div>
          </article>
        ))}
        {comments.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
            还没有留言
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 border-t pt-4">
        <label htmlFor="content-comment" className="text-sm font-medium">
          写留言
        </label>
        <textarea
          id="content-comment"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={5000}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !body.trim()}>
            {isSaving ? "正在发送…" : "留言"}
          </Button>
        </div>
      </form>
    </section>
  );
}
