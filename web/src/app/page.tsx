import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";

const overview = [
  { label: "Ảnh đã đăng", value: "142", description: "Ảnh trong thư viện" },
  { label: "Bình luận", value: "28", description: "Tổng bình luận khách" },
  { label: "Chờ xử lý", value: "5", description: "Bình luận chưa trả lời" },
  { label: "Lưu trữ", value: "72%", description: "Dung lượng ảnh đã sử dụng" },
];

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <section className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview.map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tình trạng cửa hàng</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Tổng quan quản trị</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Chế độ quản lý</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Đơn giản, trực quan</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Ngôn ngữ admin</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Tiếng Việt (có thể mở rộng)</p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Gợi ý triển khai tiếp theo</p>
              <ul className="mt-3 space-y-2">
                <li>• Kết nối API để lưu ảnh lên server / storage.</li>
                <li>• Thêm CAPTCHA và rate limit cho form bình luận công khai.</li>
                <li>• Tích hợp Google Maps trong trang chủ và cài đặt địa điểm.</li>
              </ul>
            </div>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}