import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url?.trim()) {
    return NextResponse.json({ ok: false, error: "No URL provided." }, { status: 400 });
  }

  let base: URL;
  try {
    base = new URL(url.trim());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid URL." }, { status: 400 });
  }

  const href = base.href.replace(/\/$/, "");

  // First: check if this is an A2D MCP — GET the base URL for metadata
  let mcpEndpoint = href;
  try {
    const meta = await fetch(href, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (meta.ok) {
      const body = await meta.json();
      // A2D MCP metadata shape
      if (body?.type === "mcp" && body?.endpoint) {
        mcpEndpoint = `${base.origin}${body.endpoint}`;
      }
    }
  } catch { /* fall through */ }

  // MCP streamableHttp: tools/list via POST JSON-RPC 2.0
  try {
    const res = await fetch(mcpEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `HTTP ${res.status} from MCP server.` });
    }

    const ct = res.headers.get("content-type") ?? "";
    let body: Record<string, unknown>;

    if (ct.includes("text/event-stream")) {
      // SSE transport — read first data line
      const text = await res.text();
      const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) return NextResponse.json({ ok: false, error: "Empty SSE response." });
      body = JSON.parse(dataLine.slice(5).trim());
    } else {
      body = await res.json();
    }

    // JSON-RPC error
    if (body.error) {
      const err = body.error as Record<string, unknown>;
      return NextResponse.json({ ok: false, error: (err.message as string) ?? "MCP error." });
    }

    const result = body.result as Record<string, unknown> | undefined;
    const rawTools = (result?.tools as Record<string, unknown>[]) ?? [];

    const tools = rawTools.map((t) => ({
      name: (t.name as string) ?? "",
      description: (t.description as string) ?? "",
      inputSchema: (t.inputSchema ?? null) as unknown,
    }));

    return NextResponse.json({ ok: true, tools });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach MCP server.",
    });
  }
}
