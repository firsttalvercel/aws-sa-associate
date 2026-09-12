import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url, message, expectPass } = await req.json();

  if (!url?.trim()) return NextResponse.json({ ok: false, error: "No broker URL provided." });
  if (!message?.trim()) return NextResponse.json({ ok: false, error: "No message provided." });

  try {
    const res = await fetch(url.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `test-${Date.now()}`,
        method: "SendMessage",
        params: {
          message: {
            messageId: `test-${Date.now()}`,
            role: "ROLE_USER",
            parts: [{ text: message, mediaType: "text/plain" }],
          },
        },
      }),
      signal: AbortSignal.timeout(20000),
    });

    const body = await res.json();

    // A2A response: pass when COMPLETED, or INPUT_REQUIRED on unhappy path tests
    if (body?.result?.task) {
      const state = body.result.task.status?.state;
      const ok = state === "TASK_STATE_COMPLETED" ||
        (expectPass === false && state === "TASK_STATE_INPUT_REQUIRED");
      const agentText = body.result.task.status?.message?.parts?.[0]?.text ?? null;
      return NextResponse.json({ ok, status: res.status, body, agentText, taskState: state });
    }

    // JSON-RPC error envelope
    if (body?.error) {
      return NextResponse.json({ ok: false, status: res.status, body, error: body.error.message });
    }

    return NextResponse.json({ ok: res.ok, status: res.status, body });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach broker.",
    });
  }
}
