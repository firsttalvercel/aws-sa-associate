import { NextRequest, NextResponse } from "next/server";

// A2D (a2d-ai.com) uses the 2025-11-25 A2A spec: method "message/send", role "user", kind "text"
// MAF Anypoint brokers use the older spec: method "SendMessage", role "ROLE_USER", mediaType field
const isA2dUrl = (url: string) => url.includes("a2d-ai.com");

function buildPayload(message: string, isA2d: boolean) {
  const id = `test-${Date.now()}`;
  if (isA2d) {
    return {
      jsonrpc: "2.0",
      id,
      method: "message/send",
      params: {
        message: {
          messageId: id,
          role: "user",
          parts: [{ kind: "text", text: message }],
        },
      },
    };
  }
  return {
    jsonrpc: "2.0",
    id,
    method: "SendMessage",
    params: {
      message: {
        messageId: id,
        role: "ROLE_USER",
        parts: [{ text: message, mediaType: "text/plain" }],
      },
    },
  };
}

function extractResult(body: Record<string, unknown>, isA2d: boolean, expectPass?: boolean) {
  if (isA2d) {
    // 2025-11-25 spec: result.status.state is lowercase, artifacts contain the text
    const result = body?.result as Record<string, unknown> | undefined;
    if (result?.kind === "task" || result?.status) {
      const state = (result?.status as Record<string, unknown>)?.state as string | undefined;
      const completed = state === "completed";
      const inputRequired = state === "input-required";
      const ok = completed || (expectPass === false && inputRequired);
      const artifacts = result?.artifacts as { parts?: { text?: string }[] }[] | undefined;
      const agentText = artifacts?.[0]?.parts?.[0]?.text ?? null;
      return { ok, state, agentText };
    }
  } else {
    // Older MAF spec: result.task.status.state is TASK_STATE_COMPLETED
    const task = (body?.result as Record<string, unknown>)?.task as Record<string, unknown> | undefined;
    if (task) {
      const state = (task?.status as Record<string, unknown>)?.state as string | undefined;
      const ok = state === "TASK_STATE_COMPLETED" ||
        (expectPass === false && state === "TASK_STATE_INPUT_REQUIRED");
      const msgParts = ((task?.status as Record<string, unknown>)?.message as Record<string, unknown>)?.parts as { text?: string }[] | undefined;
      const agentText = msgParts?.[0]?.text ?? null;
      return { ok, state, agentText };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { url, message, expectPass } = await req.json();

  if (!url?.trim()) return NextResponse.json({ ok: false, error: "No broker URL provided." });
  if (!message?.trim()) return NextResponse.json({ ok: false, error: "No message provided." });

  const a2d = isA2dUrl(url.trim());

  try {
    const res = await fetch(url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(message, a2d)),
      signal: AbortSignal.timeout(20000),
    });

    const body = await res.json() as Record<string, unknown>;

    const extracted = extractResult(body, a2d, expectPass);
    if (extracted) {
      return NextResponse.json({ ok: extracted.ok, status: res.status, body, agentText: extracted.agentText, taskState: extracted.state });
    }

    // JSON-RPC error envelope
    if (body?.error) {
      const err = body.error as Record<string, unknown>;
      return NextResponse.json({ ok: false, status: res.status, body, error: err.message ?? String(body.error) });
    }

    return NextResponse.json({ ok: res.ok, status: res.status, body });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach broker.",
    });
  }
}
