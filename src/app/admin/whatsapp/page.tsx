import { getWhatsAppStatus, getConfiguredGroup, listGroups } from "@/lib/whatsapp";
import { requestPairingAction, selectGroupAction, sendTestMessageAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  disconnected: "غير متصل",
  connecting: "جارٍ الاتصال...",
  pairing: "بانتظار إدخال الرمز",
  connected: "متصل",
};

const STATUS_COLOR: Record<string, string> = {
  disconnected: "bg-gray-100 text-gray-700",
  connecting: "bg-yellow-100 text-yellow-700",
  pairing: "bg-yellow-100 text-yellow-700",
  connected: "bg-green-100 text-green-700",
};

export default async function WhatsAppAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>;
}) {
  const sp = await searchParams;
  const status = await getWhatsAppStatus();
  const group = await getConfiguredGroup();
  const groups = status.state === "connected" ? await listGroups() : [];

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-extrabold text-2xl mb-2">ربط واتساب</h1>
      <p className="text-muted text-sm mb-6">
        عند النشر، يُرسل الموقع تلقائياً رسالة إلى مجموعة واتساب المختارة أدناه — لكل مقال
        جديد ولكل خبر عاجل.
      </p>

      <div className="bg-white rounded-lg border border-[var(--border)] p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="font-semibold">حالة الاتصال: </span>
          <span className="text-muted">{status.detail}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[status.state]}`}>
          {STATUS_LABEL[status.state]}
        </span>
      </div>

      {sp.test === "ok" && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 mb-6 text-sm">
          تم إرسال رسالة تجريبية بنجاح ✅
        </div>
      )}
      {sp.test === "fail" && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-6 text-sm">
          فشل إرسال الرسالة التجريبية — تحقق من حالة الاتصال واختيار المجموعة.
        </div>
      )}

      {status.state === "pairing" && status.pairingCode && (
        <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-6">
          <h2 className="font-heading font-bold text-lg mb-2">رمز الربط</h2>
          <p className="text-sm text-muted mb-3">
            افتح واتساب على الهاتف الذي سيُستخدم للربط ← الإعدادات ← الأجهزة المرتبطة ←
            ربط جهاز ← &quot;ربط برقم الهاتف بدلاً من ذلك&quot;، ثم أدخل الرمز التالي خلال دقيقة
            واحدة:
          </p>
          <div dir="ltr" className="text-3xl font-mono font-bold tracking-widest text-center bg-[var(--background)] rounded-lg py-4">
            {status.pairingCode}
          </div>
        </div>
      )}

      {status.state !== "connected" && (
        <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-6">
          <h2 className="font-heading font-bold text-lg mb-3">ربط رقم جديد</h2>
          <p className="text-sm text-muted mb-3">
            أدخل رقم هاتف واتساب الذي يملك عضوية (ويفضّل صلاحية إدارة) في المجموعة المطلوبة،
            مع رمز الدولة وبدون علامة + أو أصفار بادئة (مثال: 9611234567).
          </p>
          <form action={requestPairingAction} className="flex gap-3">
            <input
              name="phone"
              required
              dir="ltr"
              placeholder="9611234567"
              className="border border-[var(--border)] rounded-lg px-3 py-2 flex-1 font-mono"
            />
            <button className="bg-brand text-white px-4 py-2 rounded-lg font-heading font-bold hover:bg-brand-dark transition whitespace-nowrap">
              طلب رمز الربط
            </button>
          </form>
        </div>
      )}

      {status.state === "connected" && (
        <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-6">
          <h2 className="font-heading font-bold text-lg mb-3">مجموعة النشر</h2>

          {group && (
            <p className="text-sm mb-4">
              المجموعة الحالية: <span className="font-semibold">{group.name}</span>
            </p>
          )}

          {groups.length === 0 ? (
            <p className="text-sm text-muted">
              لم يتم العثور على أي مجموعات لهذا الرقم. تأكد أن الرقم المرتبط عضو في المجموعة
              المطلوبة.
            </p>
          ) : (
            <form action={selectGroupAction} className="space-y-2 mb-4">
              {groups.map((grp) => (
                <label
                  key={grp.jid}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background)] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="jid"
                    value={grp.jid}
                    defaultChecked={group?.jid === grp.jid}
                    required
                  />
                  <span>{grp.name}</span>
                </label>
              ))}
              <button className="bg-brand text-white px-4 py-2 rounded-lg font-heading font-bold hover:bg-brand-dark transition mt-2">
                حفظ المجموعة المختارة
              </button>
            </form>
          )}

          {group && (
            <form action={sendTestMessageAction}>
              <button className="text-brand font-semibold hover:underline text-sm">
                إرسال رسالة تجريبية
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
