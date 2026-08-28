import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SsoCallbackPage from "@/app/sso-callback/page";

vi.mock("@clerk/nextjs", () => ({
  AuthenticateWithRedirectCallback: () => (
    <div data-testid="clerk-redirect-callback" />
  ),
}));

describe("SsoCallbackPage", () => {
  it("keeps Clerk's CAPTCHA mount point available during first sign-up", () => {
    render(<SsoCallbackPage />);

    expect(screen.getByTestId("clerk-redirect-callback")).toBeInTheDocument();
    expect(document.getElementById("clerk-captcha")).toBeInTheDocument();
  });
});
