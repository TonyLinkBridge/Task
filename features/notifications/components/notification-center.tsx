"use client";

import { Notification01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { InAppNotification } from "@/features/notifications/in-app-types";

const dateFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "short",
  timeStyle: "short",
});

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function markAllRead() {
    setIsMarking(true);
    const response = await fetch("/api/notifications", { method: "PATCH" });
    setIsMarking(false);
    if (!response.ok) return;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, readAt }))
    );
    setUnreadCount(0);
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`通知，${unreadCount} 条未读`}
            className="relative"
          />
        }
      >
        <HugeiconsIcon icon={Notification01Icon} />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle>通知中心</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllRead()}
              disabled={isMarking || unreadCount === 0}
            >
              {isMarking ? "处理中…" : "全部设为已读"}
            </Button>
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className={`block rounded-lg border p-3 hover:bg-muted/60 ${
                notification.readAt ? "opacity-70" : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{notification.title}</p>
                {!notification.readAt ? (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {notification.body}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {dateFormatter.format(new Date(notification.createdAt))}
              </p>
            </Link>
          ))}
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              目前没有通知
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
