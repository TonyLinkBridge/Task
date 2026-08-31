"use client";

import { BubbleChatUserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MessageMember, PrivateMessage } from "@/features/messages/types";

export function PrivateMessages() {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [members, setMembers] = useState<MessageMember[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/messages")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setMessages(data.messages);
        setMembers(data.members);
        setRecipientId(data.members[0]?.id ?? "");
        setUnreadCount(data.unreadCount);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!recipientId || !body.trim()) return;
    setIsSending(true);
    setError(null);
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipientId, body }),
    });
    setIsSending(false);
    if (!response.ok) {
      setError("暂时无法发送，请稍后再试。");
      return;
    }
    const data = await response.json();
    setMessages((current) => [data.message, ...current]);
    setBody("");
  }

  async function markRead() {
    const response = await fetch("/api/messages", { method: "PATCH" });
    if (!response.ok) return;
    setUnreadCount(0);
    setMessages((current) =>
      current.map((message) => ({ ...message, readAt: message.readAt ?? new Date().toISOString() }))
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`私人消息，${unreadCount} 条未读`}
            className="relative"
          />
        }
      >
        <HugeiconsIcon icon={BubbleChatUserIcon} />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle>私人消息</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0}
              onClick={() => void markRead()}
            >
              全部设为已读
            </Button>
          </div>
        </DialogHeader>

        <form className="grid gap-3 rounded-lg border p-3" onSubmit={sendMessage}>
          <label className="grid gap-1.5 text-sm">
            发给
            <select
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5"
              required
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            消息
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={5000}
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2"
              placeholder="写一段私人消息…"
              required
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-destructive">{error}</p>
            <Button type="submit" disabled={isSending || members.length === 0}>
              {isSending ? "发送中…" : "发送"}
            </Button>
          </div>
        </form>

        <div className="max-h-[38vh] space-y-2 overflow-y-auto">
          {messages.map((message) => (
            <article key={message.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{message.senderName} → {message.recipientName}</span>
                {!message.readAt ? <span className="size-2 rounded-full bg-primary" /> : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
            </article>
          ))}
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              目前没有私人消息
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
