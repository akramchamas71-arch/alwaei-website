// Thin HTTP client for the standalone WhatsApp bridge service, which runs
// on its own dedicated VPS rather than alongside the main site on
// Railway. A baileys "linked device" session needs one persistent Node
// process and a disk that's never wiped; Railway redeploys (which happen
// on every code push to this site) tore down the container's filesystem
// and killed the WhatsApp session each time the site was updated. See the
// whatsapp-service repo for the actual baileys connection logic — this
// file just forwards to it over HTTP, keeping the same function names and
// shapes the rest of this app already calls (admin/whatsapp page +
// actions, and the publish-notification hook in data.ts), so nothing
// else had to change.
const SERVICE_URL = process.env.WHATSAPP_SERVICE_URL;
const API_KEY = process.env.WHATSAPP_SERVICE_API_KEY;

export type WhatsAppStatus = {
  state: "disconnected" | "connecting" | "pairing" | "connected";
  detail: string;
  pairingCode: string | null;
};

const OFFLINE_STATUS: WhatsAppStatus = {
  state: "disconnected",
  detail: "خدمة واتساب غير مُعدّة على هذا الموقع.",
  pairingCode: null,
};

function configured(): boolean {
  return Boolean(SERVICE_URL && API_KEY);
}

async function call<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T | null> {
  if (!configured()) return null;
  try {
    const res = await fetch(`${SERVICE_URL}${path}`, {
      method,
      headers: {
        "x-api-key": API_KEY as string,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // This is a small cross-service call to a single VPS the admin
      // panel is actively waiting on — never let it hang indefinitely.
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[whatsapp] ${method} ${path} failed with status ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[whatsapp] ${method} ${path} failed:`, err);
    return null;
  }
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  if (!configured()) return OFFLINE_STATUS;
  const res = await call<{ ok: boolean; status: WhatsAppStatus }>("GET", "/status");
  return res?.status ?? {
    state: "disconnected",
    detail: "تعذّر الاتصال بخدمة واتساب.",
    pairingCode: null,
  };
}

export async function getConfiguredGroup(): Promise<{ jid: string; name: string } | null> {
  if (!configured()) return null;
  const res = await call<{ ok: boolean; group: { jid: string; name: string } | null }>(
    "GET",
    "/status"
  );
  return res?.group ?? null;
}

export async function setConfiguredGroup(jid: string, _name: string): Promise<void> {
  // The service resolves the display name itself from a fresh group list
  // server-side (same reasoning as before: don't trust a client-supplied
  // name for whichever radio option was actually selected).
  void _name;
  await call("POST", "/group", { jid });
}

// Pass a phone number only when the admin is actively pairing a brand-new
// device; the service handles resuming an already-linked session on its
// own boot, so this site never needs to trigger that itself.
export async function startWhatsApp(phoneNumberForPairing?: string): Promise<void> {
  if (!phoneNumberForPairing) return;
  await call("POST", "/pair", { phone: phoneNumberForPairing });
}

export async function listGroups(): Promise<{ jid: string; name: string }[]> {
  const res = await call<{ ok: boolean; groups: { jid: string; name: string }[] }>(
    "GET",
    "/groups"
  );
  return res?.groups ?? [];
}

export async function sendWhatsAppTestMessage(): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "خدمة واتساب غير مُعدّة" };
  const res = await call<{ ok: boolean; error?: string }>("POST", "/test");
  return res ?? { ok: false, error: "تعذّر الاتصال بخدمة واتساب" };
}

// Fire-and-forget from the article-publishing path (see data.ts); never
// throws, so a WhatsApp hiccup can't fail a publish.
export async function sendWhatsAppText(text: string): Promise<boolean> {
  if (!configured()) return false;
  const res = await call<{ ok: boolean }>("POST", "/send", { text });
  return res?.ok ?? false;
}
