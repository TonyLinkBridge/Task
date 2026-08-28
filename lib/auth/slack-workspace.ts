type SlackOpenIdUserInfo = {
  ok: boolean;
  error?: string;
  "https://slack.com/team_id"?: string;
};

export function assertAllowedSlackTeam(actual: string, expected: string) {
  if (!actual || actual !== expected) {
    throw new Error("WRONG_SLACK_WORKSPACE");
  }
}

export async function fetchSlackTeamId(
  accessToken: string,
  fetchImplementation: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImplementation(
    "https://slack.com/api/openid.connect.userInfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const payload = (await response.json()) as SlackOpenIdUserInfo;
  const teamId = payload["https://slack.com/team_id"];

  if (!response.ok || !payload.ok || !teamId) {
    throw new Error("SLACK_IDENTITY_LOOKUP_FAILED");
  }

  return teamId;
}
