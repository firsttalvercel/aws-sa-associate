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

  // First: GET the A2D metadata endpoint to discover the well-known URL
  let wellKnown: string | null = null;
  try {
    const meta = await fetch(href, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (meta.ok) {
      const body = await meta.json();
      if (body?.wellKnown) {
        wellKnown = `${base.origin}${body.wellKnown}`;
      }
    }
  } catch { /* fall through to candidates */ }

  // Build candidate list — A2D well-known first, then standard patterns
  const candidates: string[] = [];
  if (wellKnown) candidates.push(wellKnown);
  candidates.push(href + "/.well-known/agent-card.json");
  candidates.push(new URL("/.well-known/agent-card.json", base).href);
  candidates.push(href + "/.well-known/agent.json");
  candidates.push(new URL("/.well-known/agent.json", base).href);

  let card: Record<string, unknown> | null = null;
  let lastError = "";

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) { lastError = `HTTP ${res.status}`; continue; }
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("json")) { lastError = "Non-JSON response"; continue; }
      const body = await res.json();
      if (body && typeof body === "object" && body.name && !body.error && !body.task) {
        card = body;
        break;
      }
      lastError = "Response does not look like an agent card";
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Network error";
    }
  }

  if (!card) {
    return NextResponse.json({ ok: false, error: lastError || "Could not fetch agent card." });
  }

  const name = (card.name as string) ?? "";
  const rawSkills = (card.skills as Record<string, unknown>[]) ?? [];
  const skills = rawSkills.map((s) => ({
    id: (s.id as string) ?? (s.skillId as string) ?? "",
    description: (s.description as string) ?? "",
  }));

  return NextResponse.json({ ok: true, name, skills });
}
