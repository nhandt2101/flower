"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";

type ImageItem = {
  id: string;
  title: string;
  uploadedAt: string;
  size: string;
  src: string;
  status: "active" | "new";
};

const initialImages: ImageItem[] = [
  {
    id: "1",
    title: "Hoa cẩm chướng",
    uploadedAt: "3 giờ trước",
    size: "1.2 MB",
    src: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&w=600&q=80",
    status: "active",
  },
  {
    id: "2",
    title: "Bó hoa tươi",
    uploadedAt: "Hôm qua",
    size: "1.7 MB",
    src: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&w=600&q=80",
    status: "active",
  },
  {
    id: "3",
    title: "Không gian cửa hàng",
    uploadedAt: "3 ngày trước",
    size: "2.3 MB",
    src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&w=600&q=80",
    status: "active",
  },
];

export default function AdminImagesPage() {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string>("");

  const pendingCount = useMemo(() => images.filter((item) => item.status === "new").length, [images]);

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const chosen = Array.from(files).slice(0, 8);
    setSelectedFiles(chosen);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setMessage("Vui lòng chọn ảnh để tải lên.");
      return;
    }

    const additions = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      title: file.name,
      uploadedAt: "Mới",
      size: `${Math.max(1, Math.round(file.size / 1024 / 1024))} MB`,
      src: URL.createObjectURL(file),
      status: "new" as const,
    }));
    setImages((current) => [...additions, ...current]);
    setSelectedFiles([]);
    setMessage(`Đã tải lên ${additions.length} ảnh mới.`);
  };

  const handleDelete = (id: string) => {
    setImages((current) => current.filter((item) => item.id !== id));
    setMessage("Ảnh đã được xóa khỏi thư viện.");
  };

  return (
    <AdminGuard>
      <AdminShell title="Quản lý hình ảnh">
        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Thư viện ảnh</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Tải ảnh mới lên</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Chọn ảnh JPG hoặc WebP đầu vào để hiển thị trong phần thư viện. Hệ thống sẽ tối ưu ảnh tự động.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Ảnh đang chờ</p>
                <p>{pendingCount} ảnh mới</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex min-h-[150px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-500 transition hover:border-slate-400 hover:bg-slate-100">
                <span className="text-xl font-semibold">Chọn ảnh</span>
                <span className="mt-2 text-sm">Kéo thả hoặc bấm vào đây</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelection}
                  className="sr-only"
                />
              </label>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-medium text-slate-800">Ảnh đã chọn</p>
                <p className="mt-2 text-sm text-slate-600">{selectedFiles.length} file</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {selectedFiles.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <button
                  type="button"
                  onClick={handleUpload}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Tải lên ảnh
                </button>
              </div>
            </div>

            {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Danh sách ảnh</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Xem và quản lý</h2>
              </div>
              <p className="text-sm text-slate-600">{images.length} ảnh trong thư viện</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image) => (
                <article key={image.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                  <img src={image.src} alt={image.title} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{image.title}</p>
                        <p className="text-xs text-slate-500">{image.uploadedAt} • {image.size}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                        {image.status === "new" ? "Mới" : "Hoạt động"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}