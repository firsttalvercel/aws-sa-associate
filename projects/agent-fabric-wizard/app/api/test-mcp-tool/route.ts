import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url, tool, params } = await req.json();

  if (!url?.trim()) return NextResponse.json({ ok: false, error: "No MCP URL provided." });
  if (!tool?.trim()) return NextResponse.json({ ok: false, error: "No tool name provided." });

  const href = url.trim().replace(/\/$/, "");

  try {
    const res = await fetch(href, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: tool, arguments: params ?? {} },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const ct = res.headers.get("content-type") ?? "";
    let body: Record<string, unknown>;

    if (ct.includes("text/event-stream")) {
      const text = await res.text();
      const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) return NextResponse.json({ ok: false, error: "Empty SSE response." });
      body = JSON.parse(dataLine.slice(5).trim());
    } else {
      body = await res.json();
    }

    if (body.error) {
      const err = body.error as Record<string, unknown>;
      return NextResponse.json({ ok: false, error: (err.message as string) ?? "MCP error." });
    }

    return NextResponse.json({ ok: true, result: body.result });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach MCP server.",
    });
  }
}
