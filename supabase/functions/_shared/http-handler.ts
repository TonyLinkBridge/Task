function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function makeQueueHttpHandler(dependencies: {
  secret: string;
  run: () => Promise<{ claimed: number; sent: number; failed: number }>;
}) {
  return async (request: Request) => {
    if (request.method !== "POST") {
      return json({ ok: false, message: "只接受 POST 请求" }, 405);
    }
    if (request.headers.get("x-edge-secret") !== dependencies.secret) {
      return json({ ok: false, message: "没有权限" }, 401);
    }

    try {
      const summary = await dependencies.run();
      return json({ ok: true, ...summary }, 200);
    } catch {
      return json({ ok: false, message: "队列处理失败" }, 500);
    }
  };
}
