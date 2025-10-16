// Server API endpoint to send Telegram notifications from the app.
// Supports: plain message, CAPA reminder, and Incident alert.
// SECURITY: Optionally require NOTIFY_API_KEY in request header 'x-api-key'.

import { NextResponse } from "next/server";
import { sendTG, sendCAPAReminder, sendIncidentAlert } from "@/lib/telegram";

const REQUIRE_KEY = !!process.env.NOTIFY_API_KEY;

export async function POST(req: Request) {
  try {
    if (REQUIRE_KEY) {
      const key = req.headers.get("x-api-key");
      if (!key || key !== process.env.NOTIFY_API_KEY) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { type } = body as { type: "message" | "capa" | "incident" };

    if (!type)
      return NextResponse.json({ ok: false, error: "Missing type" }, { status: 400 });

    if (type === "message") {
      const { text, chatId, parseMode } = body as {
        text: string;
        chatId?: string;
        parseMode?: "Markdown" | "MarkdownV2" | "HTML";
      };
      if (!text)
        return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });
      const r = await sendTG(text, { chatId, parseMode });
      return NextResponse.json({ ok: true, result: r });
    }

    if (type === "capa") {
      const r = await sendCAPAReminder(body);
      return NextResponse.json({ ok: true, result: r });
    }

    if (type === "incident") {
      const r = await sendIncidentAlert(body);
      return NextResponse.json({ ok: true, result: r });
    }

    return NextResponse.json({ ok: false, error: "Unknown type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple ping endpoint
  return NextResponse.json({ ok: true, service: "notify", ts: Date.now() });
}

// Example client-side usage:
// await fetch("/api/notify", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     "x-api-key": process.env.NEXT_PUBLIC_NOTIFY_KEY ?? "",
//   },
//   body: JSON.stringify({ type: "message", text: "Hello from client" }),
// });