export function safeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/tasks";
  }

  return value;
}

export function buildLoginUrl(requestUrl: string): URL {
  const source = new URL(requestUrl);
  const loginUrl = new URL("/login", source);
  loginUrl.searchParams.set("redirect", `${source.pathname}${source.search}`);
  return loginUrl;
}
