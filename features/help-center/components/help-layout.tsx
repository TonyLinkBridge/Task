import type { ReactNode } from "react";

export function HelpLayout({
  navigation,
  children,
  aside,
}: {
  navigation: ReactNode;
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div
      data-testid="help-three-column-layout"
      className="mx-auto grid w-full max-w-[1420px] items-start gap-8 px-4 py-6 lg:grid-cols-[15rem_minmax(0,48rem)] lg:px-6 xl:grid-cols-[15rem_minmax(0,48rem)_13rem]"
    >
      <div className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
        {navigation}
      </div>
      <div className="min-w-0">{children}</div>
      <div className="hidden xl:sticky xl:top-6 xl:block xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto">
        {aside}
      </div>
    </div>
  );
}
