// Server-side Telegram helper for EHS Suite (Node/Next.js)
// ENV needed in Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (and optional NOTIFY_API_KEY)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN) console.warn("[telegram] Missing TELEGRAM_BOT_TOKEN env");
if (!DEFAULT_CHAT_ID) console.warn("[telegram] Missing TELEGRAM_CHAT_ID env");

const BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

type SendOptions = {
  chatId?: string;
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
  disableNotification?: boolean;
  disableWebPagePreview?: boolean;
};

async function tgFetch<T>(method: string, params: Record<string, any>, retry = 1): Promise<T> {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const url = `${BASE}/${method}`;
  const form = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && form.append(k, String(v)));
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  if (!res.ok) {
    const txt = await res.text();
    if (retry > 0 && res.status >= 500) {
      await new Promise(r => setTimeout(r, 500));
      return tgFetch<T>(method, params, retry - 1);
    }
    throw new Error(`[telegram] ${method} failed: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(`[telegram] ${method} error: ${data.description || "unknown"}`);
  return data.result;
}

export async function sendTG(text: string, opts: SendOptions = {}) {
  const chat_id = opts.chatId ?? DEFAULT_CHAT_ID;
  if (!chat_id) throw new Error("TELEGRAM_CHAT_ID not set");
  return tgFetch("sendMessage", {
    chat_id,
    text,
    parse_mode: opts.parseMode ?? "HTML",
    disable_notification: opts.disableNotification ?? false,
    disable_web_page_preview: opts.disableWebPagePreview ?? true,
  });
}

export async function sendPhoto(photoUrl: string, caption?: string, opts: SendOptions = {}) {
  const chat_id = opts.chatId ?? DEFAULT_CHAT_ID;
  if (!chat_id) throw new Error("TELEGRAM_CHAT_ID not set");
  return tgFetch("sendPhoto", {
    chat_id,
    photo: photoUrl,
    caption,
    parse_mode: opts.parseMode ?? "HTML",
    disable_notification: opts.disableNotification ?? false,
  });
}

export async function sendDocument(fileUrl: string, caption?: string, opts: SendOptions = {}) {
  const chat_id = opts.chatId ?? DEFAULT_CHAT_ID;
  if (!chat_id) throw new Error("TELEGRAM_CHAT_ID not set");
  return tgFetch("sendDocument", {
    chat_id,
    document: fileUrl,
    caption,
    parse_mode: opts.parseMode ?? "HTML",
    disable_notification: opts.disableNotification ?? false,
  });
}

export type CAPA = {
  id: string;
  action: string;
  owner: string;
  dueAt: string | Date;
  sourceType?: string;
  sourceId?: string;
  priority?: "Low" | "Medium" | "High";
  link?: string;
};

export async function sendCAPAReminder(capa: CAPA, opts: SendOptions = {}) {
  const due = typeof capa.dueAt === "string" ? capa.dueAt : capa.dueAt.toLocaleString();
  const p = capa.priority ? ` • <b>${capa.priority}</b>` : "";
  const src = capa.sourceType ? `\nSource: <code>${capa.sourceType}</code>${capa.sourceId ? ` (#${capa.sourceId})` : ""}` : "";
  const link = capa.link ? `\n🔗 <a href="${capa.link}">Open in EHS Suite</a>` : "";
  const text =
    `✅ <b>CAPA Reminder</b>${p}\n` +
    `ID: <code>${capa.id}</code>\n` +
    `Action: <b>${escapeHtml(capa.action)}</b>\n` +
    `Owner: <code>${capa.owner}</code>\n` +
    `Due: <code>${due}</code>${src}${link}`;
  return sendTG(text, { ...opts, parseMode: "HTML" });
}

export type Incident = {
  id: string;
  type: string;
  location: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  time: string | Date;
  reporter: string;
  summary?: string;
  link?: string;
};

export async function sendIncidentAlert(inc: Incident, opts: SendOptions = {}) {
  const when = typeof inc.time === "string" ? inc.time : inc.time.toLocaleString();
  const sev = inc.severity ? ` • <b>${inc.severity}</b>` : "";
  const link = inc.link ? `\n🔗 <a href="${inc.link}">View Incident</a>` : "";
  const summary = inc.summary ? `\n<i>${escapeHtml(inc.summary)}</i>` : "";
  const text =
    `🚨 <b>Incident Reported</b>${sev}\n` +
    `ID: <code>${inc.id}</code>\n` +
    `Type: <b>${escapeHtml(inc.type)}</b>\n` +
    `Location: <code>${escapeHtml(inc.location)}</code>\n` +
    `Time: <code>${when}</code>\n` +
    `Reporter: <code>${escapeHtml(inc.reporter)}</code>${summary}${link}`;
  return sendTG(text, { ...opts, parseMode: "HTML", disableWebPagePreview: true });
}

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}