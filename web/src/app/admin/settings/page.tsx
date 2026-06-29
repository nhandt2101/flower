"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminSettings, updateAdminSettings } from "@/lib/api/settings";
import type { ShopSettings } from "@/lib/api/types";

const defaultSettings: ShopSettings = {
  storeName: "Tường Vi Flower",
  phone: "+49 171 123 4567",
  address: "Hauptstraße 14, 10115 Berlin",
  googleMapsUrl: "https://www.google.com/maps/place/Berlin",
  openingHours: "Thứ 2 - Thứ 7: 8:00 - 19:00\nChủ nhật: 9:00 - 17:00",
  locale: "vi",
};

function mapEmbedUrl(address: string, locale: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=${encodeURIComponent(locale)}&z=15&output=embed`;
}

export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const previewMapUrl = useMemo(
    () => mapEmbedUrl(settings.address, settings.locale),
    [settings.address, settings.locale],
  );

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const session = await getAdminSession();
      if (!mounted || !session?.token) return;

      setToken(session.token);
      try {
        const data = await getAdminSettings(session.token);
        if (mounted) setSettings(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Không tải được thông tin cửa hàng.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key: keyof ShopSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await updateAdminSettings(token, settings);
      setSettings(saved);
      setMessage("Thông tin cửa hàng đã được lưu và sẽ hiển thị ngoài trang public.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được thông tin cửa hàng.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Cài đặt cửa hàng">
        <section className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Thông tin cửa hàng</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Cập nhật nội dung liên hệ</h2>
              {loading ? <p className="mt-4 text-sm text-slate-600">Đang tải thông tin...</p> : null}

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Tên cửa hàng
                  <input
                    value={settings.storeName}
                    onChange={(event) => updateField("storeName", event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Hotline
                  <input
                    value={settings.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Địa chỉ
                  <textarea
                    value={settings.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    rows={3}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Google Maps URL
                  <input
                    value={settings.googleMapsUrl}
                    onChange={(event) => updateField("googleMapsUrl", event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                  Giờ mở cửa
                  <textarea
                    value={settings.openingHours}
                    onChange={(event) => updateField("openingHours", event.target.value)}
                    rows={4}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                  Ngôn ngữ hiển thị bản đồ mặc định
                  <select
                    value={settings.locale}
                    onChange={(event) => updateField("locale", event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <p className="text-sm text-slate-600">Các trường này sẽ cập nhật cho phần liên hệ ngoài trang public.</p>
              </div>
              {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
              {error ? <p className="mt-4 rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Bản đồ</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Preview vị trí</h2>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <iframe
                  title="Google Maps preview"
                  src={previewMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full border-0"
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{settings.address}</p>
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Mở Google Maps
              </a>
            </aside>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
