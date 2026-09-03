import type { ReactNode } from "react";

const hintStyles = {
  info: { label: "提示", icon: "ⓘ", className: "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100" },
  warning: { label: "警告", icon: "!", className: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" },
  danger: { label: "危险", icon: "!", className: "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100" },
  success: { label: "完成", icon: "✓", className: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100" },
} as const;

// Adapted from GitBook's Hint component.
export function HelpHint({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof hintStyles;
  title?: string;
  children: ReactNode;
}) {
  const style = hintStyles[type];
  return (
    <aside role="note" aria-label={style.label} className={`my-5 grid grid-cols-[auto_1fr] gap-3 rounded-xl border p-4 ${style.className}`}>
      <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full border text-sm font-bold">{style.icon}</span>
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </aside>
  );
}
