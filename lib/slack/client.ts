type SlackChannelRow = {
  id: string;
  name: string;
  is_private?: boolean;
  is_member?: boolean;
};

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

type SlackResponse = {
  ok: boolean;
  error?: string;
  ts?: string;
  channels?: SlackChannelRow[];
  channel?: SlackChannelRow;
  response_metadata?: { next_cursor?: string };
};

export function makeSlackClient({
  token,
  fetch: fetcher = fetch,
}: {
  token: string;
  fetch?: typeof fetch;
}) {
  async function get(path: string, parameters: Record<string, string>) {
    const url = new URL(`https://slack.com/api/${path}`);
    for (const [key, value] of Object.entries(parameters)) {
      if (value) url.searchParams.set(key, value);
    }
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as SlackResponse;
    if (!response.ok || !data.ok) {
      throw new Error(`SLACK_API_ERROR:${data.error ?? response.status}`);
    }
    return data;
  }

  async function post(path: string, body: unknown) {
    const response = await fetcher(`https://slack.com/api/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as SlackResponse;
    if (!response.ok || !data.ok) {
      throw new Error(`SLACK_API_ERROR:${data.error ?? response.status}`);
    }
    return data;
  }

  return {
    async listAllowedChannels(): Promise<SlackChannel[]> {
      const channels: SlackChannel[] = [];
      let cursor = "";
      do {
        const data = await get("conversations.list", {
          types: "public_channel,private_channel",
          exclude_archived: "true",
          limit: "200",
          cursor,
        });
        for (const channel of data.channels ?? []) {
          const isPrivate = channel.is_private === true;
          if (!isPrivate || channel.is_member === true) {
            channels.push({
              id: channel.id,
              name: channel.name,
              isPrivate,
            });
          }
        }
        cursor = data.response_metadata?.next_cursor ?? "";
      } while (cursor);
      return channels.sort((a, b) => a.name.localeCompare(b.name));
    },

    async getAllowedChannel(id: string): Promise<SlackChannel> {
      const data = await get("conversations.info", { channel: id });
      const channel = data.channel;
      if (!channel) throw new Error("SLACK_CHANNEL_NOT_FOUND");
      const isPrivate = channel.is_private === true;
      if (isPrivate && channel.is_member !== true) {
        throw new Error("SLACK_APP_NOT_IN_CHANNEL");
      }
      return { id: channel.id, name: channel.name, isPrivate };
    },

    async postMessage(input: {
      channel: string;
      text: string;
      blocks?: unknown[];
    }): Promise<{ timestamp: string }> {
      const data = await post("chat.postMessage", input);
      if (!data.ts) throw new Error("SLACK_API_ERROR:MISSING_TIMESTAMP");
      return { timestamp: data.ts };
    },
  };
}
