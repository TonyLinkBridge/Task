import { workspaceHref } from "@/lib/navigation/workspace-href";

export function safeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/marketing";
  }

  if (/^\/(?:login|sso-callback)(?:[/?#]|$)/.test(value)) return "/marketing";
  return workspaceHref(value);
}

export function buildLoginUrl(requestUrl: string): URL {
  const source = new URL(requestUrl);
  const loginUrl = new URL("/login", source);
  loginUrl.searchParams.set("redirect", safeRedirectPath(`${source.pathname}${source.search}`));
  return loginUrl;
}
