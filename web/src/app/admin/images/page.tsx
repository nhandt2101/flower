"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/adminAuth";
import {
  deleteImage,
  listAdminImages,
  reprocessImage,
  registerImage,
  requestUploadUrl,
  updateImage,
  uploadToS3,
} from "@/lib/api/images";
import type { AdminImage, ImageCategory, LandingImageSlot } from "@/lib/api/types";

const categories: { value: ImageCategory; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "funeral", label: "Funeral" },
  { value: "other", label: "Shop / other" },
];

const landingSlots: { value: "" | LandingImageSlot; label: string }[] = [
  { value: "", label: "Gallery only" },
  { value: "hero", label: "Home hero" },
  { value: "about", label: "Our shop" },
  { value: "wedding", label: "Home wedding" },
  { value: "birthday", label: "Home birthday" },
  { value: "funeral", label: "Home funeral" },
  { value: "featured", label: "Featured gallery" },
];

const statusStyles = {
  active: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  processing: "bg-amber-100 text-amber-700 ring-amber-200",
  failed: "bg-rose-100 text-rose-700 ring-rose-200",
  unknown: "bg-slate-100 text-slate-700 ring-slate-200",
};

const uploadStatusStyles = {
  queued: "bg-slate-100 text-slate-600 ring-slate-200",
  uploading: "bg-sky-100 text-sky-700 ring-sky-200",
  done: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  error: "bg-rose-100 text-rose-700 ring-rose-200",
};

const MAX_BULK_FILES = 30;
const UPLOAD_CONCURRENCY = 3;

type UploadStatus = keyof typeof uploadStatusStyles;

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  note?: string;
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function imageStatus(image: AdminImage): "active" | "processing" | "failed" | "unknown" {
  if (image.status === "failed") return "failed";
  if (image.status === "active" && image.url && image.thumbUrl) return "active";
  if (image.status === "processing" || !image.url || !image.thumbUrl) return "processing";
  return "unknown";
}

function uploadItemId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export default function AdminImagesPage() {
  const [token, setToken] = useState("");
  const [images, setImages] = useState<AdminImage[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [category, setCategory] = useState<ImageCategory>("wedding");
  const [landingSlot, setLandingSlot] = useState<"" | LandingImageSlot>("");
  const [alt, setAlt] = useState("");
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        category: ImageCategory;
        landingSlot: "" | LandingImageSlot;
        alt: string;
      }
    >
  >({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const skippedUploadIdsRef = useRef<Set<string>>(new Set());

  const processingCount = useMemo(
    () => images.filter((item) => imageStatus(item) === "processing").length,
    [images],
  );

  const activeCount = useMemo(
    () => images.filter((item) => imageStatus(item) === "active").length,
    [images],
  );

  const loadImages = useCallback(async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminImages(authToken, { limit: 50 });
      setImages(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load images.");
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
    const nextItems = Array.from(files)
      .slice(0, MAX_BULK_FILES)
      .map((file, index) => ({
        id: uploadItemId(file, index),
        file,
        status: "queued" as const,
      }));
    skippedUploadIdsRef.current = new Set();
    setUploadItems(nextItems);
    setMessage("");
    setError("");
    event.target.value = "";
  };

  const handleRemoveUploadItem = (id: string) => {
    skippedUploadIdsRef.current.add(id);
    setUploadItems((current) => current.filter((item) => item.id !== id));
    setMessage("");
  };

  const handleUpload = async () => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }
    if (uploadItems.length === 0) {
      setMessage("Choose at least one image to upload.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    skippedUploadIdsRef.current = new Set();

    const selectedItems = uploadItems;
    let successCount = 0;
    let failureCount = 0;
    let nextIndex = 0;

    const updateUploadItem = (id: string, patch: Partial<UploadItem>) => {
      setUploadItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    };

    const uploadOne = async (item: UploadItem) => {
      if (skippedUploadIdsRef.current.has(item.id)) return;
      const { file } = item;
      updateUploadItem(item.id, { status: "uploading", note: "Uploading" });
      try {
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
          landingSlot: landingSlot || undefined,
          alt: alt.trim() || file.name,
        });
        successCount += 1;
        updateUploadItem(item.id, { status: "done", note: "Uploaded" });
      } catch (err) {
        failureCount += 1;
        updateUploadItem(item.id, {
          status: "error",
          note: err instanceof Error ? err.message : "Upload failed",
        });
      }
    };

    const workers = Array.from(
      { length: Math.min(UPLOAD_CONCURRENCY, selectedItems.length) },
      async () => {
        while (nextIndex < selectedItems.length) {
          const item = selectedItems[nextIndex];
          nextIndex += 1;
          if (skippedUploadIdsRef.current.has(item.id)) continue;
          await uploadOne(item);
        }
      },
    );

    try {
      await Promise.all(workers);

      if (successCount > 0) {
        await loadImages(token);
      }

      setAlt("");
      setLandingSlot("");
      setUploadItems((current) => current.filter((item) => item.status === "error"));

      if (successCount > 0) {
        setMessage(`${successCount} image${successCount === 1 ? "" : "s"} uploaded. Processing may take a moment.`);
      }
      if (failureCount > 0) {
        setError(`${failureCount} image${failureCount === 1 ? "" : "s"} failed. Check the list and try again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      await deleteImage(token, id);
      setImages((current) => current.filter((item) => item.id !== id));
      setMessage("Image deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (id: string) => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }

    setReprocessingId(id);
    setError("");
    setMessage("");
    try {
      await reprocessImage(token, id);
      setMessage("Image sent for processing. Wait a few seconds, then refresh.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reprocess image.");
    } finally {
      setReprocessingId(null);
    }
  };

  const draftFor = (image: AdminImage) =>
    drafts[image.id] ?? {
      category: image.category,
      landingSlot: image.landingSlot ?? "",
      alt: image.alt ?? "",
    };

  const updateDraft = (
    id: string,
    patch: Partial<{
      category: ImageCategory;
      landingSlot: "" | LandingImageSlot;
      alt: string;
    }>,
  ) => {
    const image = images.find((item) => item.id === id);
    if (!image) return;
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? {
          category: image.category,
          landingSlot: image.landingSlot ?? "",
          alt: image.alt ?? "",
        }),
        ...patch,
      },
    }));
  };

  const handleSaveMetadata = async (image: AdminImage) => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }

    const draft = draftFor(image);
    setSavingId(image.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateImage(token, image.id, {
        category: draft.category,
        landingSlot: draft.landingSlot || undefined,
        alt: draft.alt.trim() || undefined,
      });
      setImages((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[image.id];
        return next;
      });
      setMessage("Image details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save image details.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Images">
        <section className="grid gap-4 lg:gap-6">
          <div className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-accent">Image library</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">Upload new images</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choose JPG, PNG, or WebP images. They will be optimized automatically before appearing on the site.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:w-auto">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                  <p className="font-semibold">{activeCount}</p>
                  <p>Ready</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                  <p className="font-semibold">{processingCount}</p>
                  <p>Processing</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(220px,0.9fr)_minmax(260px,1fr)_minmax(240px,0.9fr)]">
              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-silver bg-background p-5 text-center text-muted transition hover:border-accent hover:bg-accent/5">
                <span className="font-serif text-2xl font-semibold text-foreground">Choose images</span>
                <span className="mt-2 text-sm">Drop files here or click to browse</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelection}
                  className="sr-only"
                />
              </label>

              <div className="rounded-3xl border border-silver-soft bg-background p-5">
                <label className="block text-sm font-medium text-foreground">
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ImageCategory)}
                    className="mt-2 w-full rounded-2xl border border-silver-soft bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-sm font-medium text-foreground">
                  Site placement
                  <select
                    value={landingSlot}
                    onChange={(event) =>
                      setLandingSlot(event.target.value as "" | LandingImageSlot)
                    }
                    className="mt-2 w-full rounded-2xl border border-silver-soft bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {landingSlots.map((item) => (
                      <option key={item.value || "gallery"} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-sm font-medium text-foreground">
                  Alt text
                  <input
                    value={alt}
                    onChange={(event) => setAlt(event.target.value)}
                    placeholder="Example: White wedding bouquet"
                    className="mt-2 w-full rounded-2xl border border-silver-soft bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-silver-soft bg-background p-5">
                <p className="font-medium text-foreground">Selected files</p>
                <p className="mt-2 text-sm text-muted">
                  {uploadItems.length} file{uploadItems.length === 1 ? "" : "s"} selected
                </p>
                {uploadItems.length === MAX_BULK_FILES ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Only the first {MAX_BULK_FILES} files were added.
                  </p>
                ) : null}
                <ul className="mt-4 max-h-44 space-y-2 overflow-auto text-sm text-muted">
                  {uploadItems.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-silver-soft bg-surface p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-all font-medium text-foreground">{item.file.name}</p>
                          <p className="mt-1 text-xs text-muted">{formatBytes(item.file.size)}</p>
                          {item.note ? (
                            <p className="mt-1 break-words text-xs text-muted">{item.note}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ${uploadStatusStyles[item.status]}`}>
                            {item.status}
                          </span>
                          {item.status === "uploading" || item.status === "done" ? null : (
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadItem(item.id)}
                              aria-label={`Remove ${item.file.name}`}
                              title="Remove"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-silver-soft text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 20 20"
                                className="h-4 w-4"
                                fill="none"
                              >
                                <path
                                  d="M5 5L15 15M15 5L5 15"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || uploadItems.length === 0}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading batch..." : "Upload selected images"}
                </button>
              </div>
            </div>

            {message ? <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p> : null}
            {error ? <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </div>

          <div className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-accent">Library</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">Review and manage</h2>
              </div>
              <button
                type="button"
                onClick={() => token && loadImages(token)}
                disabled={loading}
                className="rounded-full border border-silver-soft bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:opacity-60"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loading ? <p className="text-sm text-muted">Loading images...</p> : null}
            {!loading && images.length === 0 ? <p className="text-sm text-muted">No images in the library yet.</p> : null}

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {images.map((image) => {
                const status = imageStatus(image);
                const isProcessing = status === "processing";
                const draft = draftFor(image);
                return (
                  <article key={image.id} className="min-w-0 overflow-hidden rounded-3xl border border-silver-soft bg-background shadow-sm">
                    {status === "active" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.thumbUrl} alt={image.alt || image.id} className="h-48 w-full object-cover sm:h-56" />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-silver-soft/40 px-4 text-center text-sm font-medium text-muted sm:h-56">
                        {status === "failed" ? "Processing failed" : "Processing image..."}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{image.alt || image.id}</p>
                          <p className="text-xs text-muted">
                            {formatDate(image.createdAt)} - {formatBytes(image.sizeBytes)}
                          </p>
                          <p className="mt-1 text-xs text-muted">{image.category}</p>
                          {image.landingSlot ? (
                            <p className="mt-1 text-xs font-semibold text-accent">
                              {landingSlots.find((item) => item.value === image.landingSlot)?.label ?? image.landingSlot}
                            </p>
                          ) : null}
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${statusStyles[status]}`}>
                          {status}
                        </span>
                      </div>

                      <div className="mb-4 grid gap-3 rounded-2xl border border-silver-soft bg-surface p-3">
                        <label className="block text-xs font-semibold text-muted">
                          Alt text
                          <input
                            value={draft.alt}
                            onChange={(event) =>
                              updateDraft(image.id, { alt: event.target.value })
                            }
                            className="mt-1 w-full rounded-2xl border border-silver-soft bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </label>
                        <label className="block text-xs font-semibold text-muted">
                          Category
                          <select
                            value={draft.category}
                            onChange={(event) =>
                              updateDraft(image.id, {
                                category: event.target.value as ImageCategory,
                              })
                            }
                            className="mt-1 w-full rounded-2xl border border-silver-soft bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          >
                            {categories.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-semibold text-muted">
                          Site placement
                          <select
                            value={draft.landingSlot}
                            onChange={(event) =>
                              updateDraft(image.id, {
                                landingSlot: event.target.value as "" | LandingImageSlot,
                              })
                            }
                            className="mt-1 w-full rounded-2xl border border-silver-soft bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          >
                            {landingSlots.map((item) => (
                              <option key={item.value || "gallery"} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveMetadata(image)}
                          disabled={savingId === image.id}
                          className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === image.id ? "Saving..." : "Save details"}
                        </button>
                        {isProcessing ? (
                          <button
                            type="button"
                            onClick={() => handleReprocess(image.id)}
                            disabled={reprocessingId === image.id}
                            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reprocessingId === image.id ? "Sending..." : "Retry"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(image.id)}
                          disabled={deletingId === image.id}
                          className="inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === image.id ? "Deleting..." : "Delete"}
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
