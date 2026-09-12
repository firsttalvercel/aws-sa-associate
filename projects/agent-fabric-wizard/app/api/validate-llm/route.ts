import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { provider, apiKey, baseUrl } = await req.json();

  if (!apiKey?.trim()) {
    return NextResponse.json({ ok: false, error: "No API key provided." }, { status: 400 });
  }

  try {
    let res: Response;

    if (provider === "openai") {
      const base = baseUrl?.trim().replace(/\/$/, "") || "https://api.openai.com/v1";
      res = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

    } else if (provider === "anthropic") {
      const base = baseUrl?.trim().replace(/\/$/, "") || "https://api.anthropic.com";
      res = await fetch(`${base}/v1/models`, {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      });

    } else if (provider === "gemini") {
      const base = baseUrl?.trim().replace(/\/$/, "") || "https://generativelanguage.googleapis.com/v1beta";
      res = await fetch(`${base}/models?key=${encodeURIComponent(apiKey)}`);

    } else if (provider === "bedrock") {
      // Bedrock uses AWS SigV4 — can't test a plain API key here
      return NextResponse.json({ ok: false, error: "Bedrock uses AWS credentials. Manual verification required." }, { status: 422 });

    } else {
      return NextResponse.json({ ok: false, error: "Unknown provider." }, { status: 400 });
    }

    if (res.ok) {
      return NextResponse.json({ ok: true });
    }

    // Try to surface the provider's error message
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.error ?? body?.message ?? message;
    } catch { /* ignore */ }

    return NextResponse.json({ ok: false, error: message }, { status: 200 });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
