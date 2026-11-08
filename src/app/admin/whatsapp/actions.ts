"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import {
  startWhatsApp,
  setConfiguredGroup,
  sendWhatsAppTestMessage,
  listGroups,
} from "@/lib/whatsapp";

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requestPairingAction(formData: FormData) {
  await requireAuth();
  const phone = String(formData.get("phone") || "").trim();
  if (phone) {
    await startWhatsApp(phone);
  }
  revalidatePath("/admin/whatsapp");
  redirect("/admin/whatsapp");
}

export async function selectGroupAction(formData: FormData) {
  await requireAuth();
  const jid = String(formData.get("jid") || "").trim();
  if (jid) {
    // Resolve the display name server-side from a fresh group list rather
    // than trusting a same-named hidden field per radio option (which the
    // browser can't correlate to the selected radio reliably).
    const groups = await listGroups();
    const match = groups.find((g) => g.jid === jid);
    await setConfiguredGroup(jid, match?.name || jid);
  }
  revalidatePath("/admin/whatsapp");
  redirect("/admin/whatsapp");
}

export async function sendTestMessageAction() {
  await requireAuth();
  const result = await sendWhatsAppTestMessage();
  revalidatePath("/admin/whatsapp");
  redirect(`/admin/whatsapp?test=${result.ok ? "ok" : "fail"}`);
}
