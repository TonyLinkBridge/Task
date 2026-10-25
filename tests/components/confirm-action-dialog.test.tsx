import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ConfirmActionDialog } from "@/components/feedback/confirm-action-dialog";

it("blocks duplicate submissions and closing while a confirmed operation is pending", async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  const operation = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  function Harness() {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    return <>
      <button ref={trigger} onClick={() => setOpen(true)}>删除</button>
      <ConfirmActionDialog open={open} onOpenChange={setOpen} title="确认删除？"
        description="删除后不能恢复。" confirmLabel="永久删除" pendingLabel="正在删除…"
        returnFocus={trigger} pending={pending} onConfirm={async () => {
          setPending(true);
          await operation();
          setPending(false);
          setOpen(false);
        }} />
    </>;
  }
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "删除" }));
  await user.dblClick(screen.getByRole("button", { name: "永久删除" }));
  expect(operation).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "正在删除…" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  finish();
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "删除" })).toHaveFocus();
});
