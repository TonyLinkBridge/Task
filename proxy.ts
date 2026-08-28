import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { buildLoginUrl } from "@/lib/auth/redirect";

const publicRoutePrefixes = ["/login", "/sso-callback", "/access-denied"];

function isPublicPath(pathname: string) {
  return publicRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isPublicPath(request.nextUrl.pathname)) {
    return;
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(buildLoginUrl(request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
