"use client";

import { useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Confirmation asks for a decision; Arc Toast reports the action's result. */
export function ConfirmActionDialog({
  open, onOpenChange, title, description, confirmLabel, pendingLabel,
  pending = false, destructive = true, onConfirm, returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  const confirming = useRef(false);

  async function confirm() {
    if (pending || confirming.current) return;
    confirming.current = true;
    try { await onConfirm(); }
    finally { confirming.current = false; }
  }

  return (
    <Dialog open={open} onOpenChange={value => {
      if (!pending && !confirming.current) onOpenChange(value);
    }}>
      <DialogContent role="alertdialog" showCloseButton={false}
        initialFocus={cancel} finalFocus={returnFocus}
        className="rounded-3xl bg-card text-card-foreground shadow-2xl"
        aria-busy={pending}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="leading-relaxed">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button ref={cancel} type="button" variant="outline" disabled={pending}
            onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" variant={destructive ? "destructive" : "default"}
            disabled={pending} onClick={() => void confirm()}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
