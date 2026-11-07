import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  isJidGroup,
  type WASocket,
} from "baileys";
import pino from "pino";
import { getSetting, setSetting } from "./db";

// Sends newly-published articles (daily brief, manual publishes, and the
// breaking-news poller — see breakingNews.ts) to a WhatsApp group, by
// linking this server as a "linked device" on an existing WhatsApp
// account, the same mechanism as WhatsApp Web/Desktop. There is no
// official Meta API for posting into a pre-existing personal/group chat
// (the official Cloud API's Groups feature is capped at 8 participants and
// only works for groups the business itself creates), so this uses the
// `baileys` library to drive a real linked-device session instead. That
// means it is not an approach Meta endorses or guarantees; keep the
// message volume modest (this app only sends one message per published
// article, queued with a short delay between sends) to look like normal,
// not spam-like, use of a linked device.
const AUTH_DIR = path.join(process.cwd(), "data", "whatsapp-auth");
const GROUP_JID_KEY = "whatsapp_group_jid";
const GROUP_NAME_KEY = "whatsapp_group_name";
const SEND_SPACING_MS = 2500;
const MAX_RECONNECT_ATTEMPTS = 5;

export type WhatsAppStatus = {
  state: "disconnected" | "connecting" | "pairing" | "connected";
  detail: string;
  pairingCode: string | null;
};

const globalForWa = globalThis as unknown as {
  __alwaei_wa?: {
    sock: WASocket | null;
    status: WhatsAppStatus;
    starting: boolean;
    sendQueue: Promise<void>;
    reconnectAttempts: number;
  };
};

const g =
  globalForWa.__alwaei_wa ??
  {
    sock: null as WASocket | null,
    status: { state: "disconnected", detail: "غير مرتبط بعد", pairingCode: null } as WhatsAppStatus,
    starting: false,
    sendQueue: Promise.resolve(),
    reconnectAttempts: 0,
  };
if (!globalForWa.__alwaei_wa) globalForWa.__alwaei_wa = g;

const logger = pino({ level: "error" });

function ensureAuthDir() {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });
}

// Wipes a never-completed or logged-out session so the next pairing
// attempt starts from a clean slate instead of repeatedly retrying
// against stale, broken credentials.
function resetAuthDir() {
  try {
    if (existsSync(AUTH_DIR)) rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (err) {
    console.error("[whatsapp] failed to reset auth dir:", err);
  }
}

export function hasStoredCredentials(): boolean {
  return existsSync(path.join(AUTH_DIR, "creds.json"));
}

export function getWhatsAppStatus(): WhatsAppStatus {
  return g.status;
}

export function getConfiguredGroup(): { jid: string; name: string } | null {
  const jid = getSetting(GROUP_JID_KEY, "");
  if (!jid) return null;
  return { jid, name: getSetting(GROUP_NAME_KEY, jid) };
}

export function setConfiguredGroup(jid: string, name: string): void {
  setSetting(GROUP_JID_KEY, jid);
  setSetting(GROUP_NAME_KEY, name);
}

// Starts (or resumes) the WhatsApp connection. Pass a phone number only
// when the admin is actively pairing a brand-new device; omit it to just
// resume an already-linked session (e.g. on server boot). Never throws —
// every failure is reported through getWhatsAppStatus() instead, so a
// bad phone number or a dropped connection can't crash the admin page
// that triggered it (or, via the boot-time auto-resume, the server).
export async function startWhatsApp(phoneNumberForPairing?: string): Promise<void> {
  if (g.starting) return;
  g.starting = true;
  try {
    ensureAuthDir();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      browser: ["Alwaei News", "Chrome", "1.0"],
    });
    g.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    // Requesting a pairing code only works once the socket has completed its
    // initial handshake with WhatsApp's servers and emitted a `qr` value —
    // calling sock.requestPairingCode() right after makeWASocket() (before
    // that handshake finishes) races the connection and baileys throws
    // "Connection Closed" almost immediately, before any code is ever
    // issued. So instead of requesting it eagerly, request it from inside
    // connection.update, gated on `qr` being present, matching baileys' own
    // official pairing-code example.
    let pairingRequested = false;

    if (phoneNumberForPairing && !state.creds.registered) {
      g.status = { state: "pairing", detail: "جارٍ طلب رمز الربط...", pairingCode: null };
    }

    sock.ev.on("connection.update", (update) => {
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr && phoneNumberForPairing && !state.creds.registered && !pairingRequested) {
          pairingRequested = true;
          const digitsOnly = phoneNumberForPairing.replace(/[^0-9]/g, "");
          sock
            .requestPairingCode(digitsOnly)
            .then((code) => {
              g.status = { state: "pairing", detail: "أدخل هذا الرمز في هاتفك خلال دقيقة", pairingCode: code };
            })
            .catch((err) => {
              console.error("[whatsapp] requestPairingCode failed:", err);
              g.status = {
                state: "disconnected",
                detail: "تعذّر طلب رمز الربط. حاول مجدداً.",
                pairingCode: null,
              };
            });
        }

        if (connection === "open") {
          g.reconnectAttempts = 0;
          g.status = { state: "connected", detail: "متصل بواتساب", pairingCode: null };
        } else if (connection === "connecting") {
          g.status = { ...g.status, state: "connecting", detail: "جارٍ الاتصال بواتساب..." };
        } else if (connection === "close") {
          const err = lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
          const code = err?.output?.statusCode;

          if (code === DisconnectReason.loggedOut || !state.creds.registered) {
            // Either the phone unlinked us, or this session never finished
            // pairing in the first place (e.g. the code expired before it
            // was entered). Either way, retrying against these credentials
            // would just fail the same way forever — stop and clear them
            // so the next attempt from /admin/whatsapp starts clean.
            g.sock = null;
            g.reconnectAttempts = 0;
            resetAuthDir();
            g.status = {
              state: "disconnected",
              detail:
                code === DisconnectReason.loggedOut
                  ? "تم تسجيل الخروج من الهاتف. يلزم إعادة الربط من جديد."
                  : "لم تكتمل عملية الربط (قد يكون الرمز انتهت صلاحيته). حاول الربط من جديد.",
              pairingCode: null,
            };
            return;
          }

          g.reconnectAttempts += 1;
          if (g.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            g.sock = null;
            g.reconnectAttempts = 0;
            g.status = {
              state: "disconnected",
              detail: "تعذّرت إعادة الاتصال بعد عدة محاولات. حاول لاحقاً من صفحة الإدارة.",
              pairingCode: null,
            };
            return;
          }

          g.status = { ...g.status, state: "connecting", detail: "انقطع الاتصال، تتم إعادة المحاولة..." };
          const delay = Math.min(5000 * g.reconnectAttempts, 60_000);
          setTimeout(() => {
            g.starting = false;
            startWhatsApp().catch((e) => console.error("[whatsapp] reconnect failed:", e));
          }, delay);
        }
      } catch (err) {
        console.error("[whatsapp] connection.update handler error:", err);
      }
    });
  } catch (err) {
    console.error("[whatsapp] startWhatsApp failed:", err);
    g.status = {
      state: "disconnected",
      detail: "تعذّر بدء الاتصال بواتساب. حاول مجدداً بعد قليل.",
      pairingCode: null,
    };
    g.sock = null;
  } finally {
    g.starting = false;
  }
}

export async function listGroups(): Promise<{ jid: string; name: string }[]> {
  if (!g.sock || g.status.state !== "connected") return [];
  try {
    const groups = await g.sock.groupFetchAllParticipating();
    return Object.values(groups)
      .filter((meta) => isJidGroup(meta.id))
      .map((meta) => ({ jid: meta.id, name: meta.subject }));
  } catch (err) {
    console.error("[whatsapp] listGroups failed:", err);
    return [];
  }
}

export async function sendWhatsAppTestMessage(): Promise<{ ok: boolean; error?: string }> {
  const group = getConfiguredGroup();
  if (!group) return { ok: false, error: "لم يتم اختيار مجموعة بعد" };
  const ok = await sendWhatsAppText("✅ تم ربط موقع الوعي بنجاح بهذه المجموعة.");
  return { ok, error: ok ? undefined : "فشل الإرسال — تحقق من حالة الاتصال" };
}

// Fire-and-forget from the article-publishing path: queued so concurrent
// publishes (e.g. a burst of breaking-news items) go out one at a time
// with a short gap between them, instead of several messages landing in
// the same instant — a steadier, less bot-like pace.
export function sendWhatsAppText(text: string): Promise<boolean> {
  const task = g.sendQueue.then(async () => {
    const group = getConfiguredGroup();
    if (!group || !g.sock || g.status.state !== "connected") return false;
    try {
      await g.sock.sendMessage(group.jid, { text });
      return true;
    } catch (err) {
      console.error("[whatsapp] send failed:", err);
      return false;
    } finally {
      await new Promise((r) => setTimeout(r, SEND_SPACING_MS));
    }
  });
  // Keep the queue chain alive regardless of this call's outcome.
  g.sendQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}
