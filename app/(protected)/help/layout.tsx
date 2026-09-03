import { HelpChrome } from "@/features/help-center/components/help-chrome";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

import "katex/dist/katex.min.css";
import "@/features/help-center/gitbook/document.css";
import "@/features/help-center/gitbook/pdf.css";

export default async function HelpCenterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getVerifiedUser();

  return <HelpChrome currentUser={currentUser}>{children}</HelpChrome>;
}
