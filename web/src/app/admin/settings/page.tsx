"use client";

import { useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("Tường Vi Flower");
  const [phone, setPhone] = useState("+49 171 123 4567");
  const [address, setAddress] = useState("Hauptstraße 14, 10115 Berlin");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("https://www.google.com/maps/place/Berlin");
  const [openingHours, setOpeningHours] = useState("Thứ 2 - Thứ 7: 8:00 - 19:00\nChủ nhật: 9:00 - 17:00");
  const [locale, setLocale] = useState("vi");
  const [message, setMessage] = useState("");

  const handleSave = () => {
    setMessage("Thông tin đã được lưu tạm thời trong giao diện này.");
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <AdminGuard>
      <AdminShell title="Cài đặt cửa hàng">
        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Thông tin cửa hàng</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Cập nhật nội dung liên hệ</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Tên cửa hàng
                <input
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Hotline
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Địa chỉ
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={3}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Google Maps URL
                <input
                  value={googleMapsUrl}
                  onChange={(event) => setGoogleMapsUrl(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                Giờ mở cửa
                <textarea
                  value={openingHours}
                  onChange={(event) => setOpeningHours(event.target.value)}
                  rows={4}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                Ngôn ngữ quản trị mặc định
                <select
                  value={locale}
                  onChange={(event) => setLocale(event.target.value)}
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
                className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Lưu thay đổi
              </button>
              <p className="text-sm text-slate-600">Thông tin này sẽ được lưu khi kết nối với backend thực tế.</p>
            </div>
            {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Google Maps</p>
              <p className="mt-2">Đường dẫn hiển thị bản đồ khách mở chỉ đường.</p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Mở Google Maps
              </a>
            </div>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}