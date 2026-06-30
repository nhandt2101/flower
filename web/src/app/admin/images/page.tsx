"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/adminAuth";
import {
  deleteImage,
  listAdminImages,
  reprocessImage,
  registerImage,
  requestUploadUrl,
  uploadToS3,
} from "@/lib/api/images";
import type { AdminImage, ImageCategory } from "@/lib/api/types";

const categories: { value: ImageCategory; label: string }[] = [
  { value: "wedding", label: "Đám cưới" },
  { value: "birthday", label: "Sinh nhật" },
  { value: "funeral", label: "Tang lễ" },
  { value: "other", label: "Khác" },
];

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminImagesPage() {
  const [token, setToken] = useState("");
  const [images, setImages] = useState<AdminImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<ImageCategory>("wedding");
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const processingCount = useMemo(
    () => images.filter((item) => item.status !== "active" || !item.url || !item.thumbUrl).length,
    [images],
  );

  const loadImages = useCallback(async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminImages(authToken, { limit: 50 });
      setImages(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách ảnh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const session = await getAdminSession();
      if (!mounted || !session?.token) return;
      setToken(session.token);
      await loadImages(session.token);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [loadImages]);

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setSelectedFiles(Array.from(files).slice(0, 8));
    setMessage("");
    setError("");
  };

  const handleUpload = async () => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }
    if (selectedFiles.length === 0) {
      setMessage("Vui lòng chọn ảnh để tải lên.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      for (const file of selectedFiles) {
        const upload = await requestUploadUrl(token, {
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        });
        await uploadToS3(upload.uploadUrl, file);
        await registerImage(token, {
          imageId: upload.imageId,
          objectKey: upload.objectKey,
          category,
          alt: alt.trim() || file.name,
        });
      }

      setSelectedFiles([]);
      setAlt("");
      setMessage(
        `Đã tải lên ${selectedFiles.length} ảnh. Ảnh sẽ xuất hiện công khai sau khi bộ xử lý tạo WebP xong.`,
      );
      await loadImages(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh lên không thành công.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      await deleteImage(token, id);
      setImages((current) => current.filter((item) => item.id !== id));
      setMessage("Ảnh đã được xóa khỏi thư viện.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được ảnh.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (id: string) => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }

    setReprocessingId(id);
    setError("");
    setMessage("");
    try {
      await reprocessImage(token, id);
      setMessage("Đã gửi ảnh vào hàng xử lý lại. Vui lòng đợi vài giây rồi bấm Làm mới.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xử lý lại được ảnh.");
    } finally {
      setReprocessingId(null);
    }
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
                  Chọn ảnh JPG, PNG hoặc WebP. Backend sẽ lưu ảnh gốc lên S3 và bộ xử lý ảnh sẽ tạo bản WebP qua CloudFront.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Đang xử lý</p>
                <p>{processingCount} ảnh chưa có URL công khai</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
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
                <label className="block text-sm font-medium text-slate-700">
                  Danh mục
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ImageCategory)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Mô tả ảnh
                  <input
                    value={alt}
                    onChange={(event) => setAlt(event.target.value)}
                    placeholder="Ví dụ: Bó hoa cưới tông trắng"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-medium text-slate-800">Ảnh đã chọn</p>
                <p className="mt-2 text-sm text-slate-600">{selectedFiles.length} file</p>
                <ul className="mt-4 max-h-24 space-y-2 overflow-auto text-sm text-slate-600">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name} · {formatBytes(file.size)}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Đang tải lên..." : "Tải lên ảnh"}
                </button>
              </div>
            </div>

            {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
            {error ? <p className="mt-4 rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Danh sách ảnh</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Xem và quản lý</h2>
              </div>
              <button
                type="button"
                onClick={() => token && loadImages(token)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-60"
              >
                {loading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>

            {loading ? <p className="text-sm text-slate-600">Đang tải danh sách ảnh...</p> : null}
            {!loading && images.length === 0 ? <p className="text-sm text-slate-600">Chưa có ảnh trong thư viện.</p> : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image) => {
                const isProcessing = image.status !== "active" || !image.url || !image.thumbUrl;
                return (
                  <article key={image.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                    {isProcessing ? (
                      <div className="flex h-48 items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
                        Đang xử lý ảnh...
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.thumbUrl} alt={image.alt || image.id} className="h-48 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{image.alt || image.id}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(image.createdAt)} · {formatBytes(image.sizeBytes)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{image.category}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          {image.status === "failed" ? "Lỗi" : isProcessing ? "Xử lý" : "Hoạt động"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isProcessing ? (
                          <button
                            type="button"
                            onClick={() => handleReprocess(image.id)}
                            disabled={reprocessingId === image.id}
                            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reprocessingId === image.id ? "Đang gửi..." : "Xử lý lại"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(image.id)}
                          disabled={deletingId === image.id}
                          className="inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === image.id ? "Đang xóa..." : "Xóa ảnh"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
