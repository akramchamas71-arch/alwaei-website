import { existsSync, mkdirSync } from "node:fs";
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
  };
};

const g =
  globalForWa.__alwaei_wa ??
  {
    sock: null as WASocket | null,
    status: { state: "disconnected", detail: "غير مرتبط بعد", pairingCode: null } as WhatsAppStatus,
    starting: false,
    sendQueue: Promise.resolve(),
  };
if (!globalForWa.__alwaei_wa) globalForWa.__alwaei_wa = g;

const logger = pino({ level: "error" });

function ensureAuthDir() {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });
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
// resume an already-linked session (e.g. on server boot).
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

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        g.status = { state: "connected", detail: "متصل بواتساب", pairingCode: null };
      } else if (connection === "connecting") {
        g.status = { ...g.status, state: "connecting", detail: "جارٍ الاتصال بواتساب..." };
      } else if (connection === "close") {
        const err = lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
        const code = err?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          g.status = {
            state: "disconnected",
            detail: "تم تسجيل الخروج من الهاتف. يلزم إعادة الربط من جديد.",
            pairingCode: null,
          };
          g.sock = null;
        } else {
          g.status = { ...g.status, state: "connecting", detail: "انقطع الاتصال، تتم إعادة المحاولة..." };
          setTimeout(() => {
            g.starting = false;
            void startWhatsApp();
          }, 5000);
          return;
        }
      }
    });

    if (phoneNumberForPairing && !state.creds.registered) {
      g.status = { state: "pairing", detail: "جارٍ طلب رمز الربط...", pairingCode: null };
      const digitsOnly = phoneNumberForPairing.replace(/[^0-9]/g, "");
      const code = await sock.requestPairingCode(digitsOnly);
      g.status = { state: "pairing", detail: "أدخل هذا الرمز في هاتفك خلال دقيقة", pairingCode: code };
    }
  } finally {
    g.starting = false;
  }
}

export async function listGroups(): Promise<{ jid: string; name: string }[]> {
  if (!g.sock || g.status.state !== "connected") return [];
  const groups = await g.sock.groupFetchAllParticipating();
  return Object.values(groups)
    .filter((meta) => isJidGroup(meta.id))
    .map((meta) => ({ jid: meta.id, name: meta.subject }));
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
