"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/adminAuth";
import {
  deleteComment,
  listAdminComments,
  replyToComment,
  setCommentStatus,
} from "@/lib/api/comments";
import type { AdminComment, CommentStatus } from "@/lib/api/types";

type Filter = "all" | CommentStatus;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminCommentsPage() {
  const [token, setToken] = useState("");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      total: comments.length,
      visible: comments.filter((comment) => comment.status === "visible").length,
      hidden: comments.filter((comment) => comment.status === "hidden").length,
    }),
    [comments],
  );

  const loadComments = useCallback(async (authToken: string, filter: Filter) => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminComments(authToken, {
        limit: 50,
        status: filter === "all" ? undefined : filter,
      });
      setComments(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách bình luận.");
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
      await loadComments(session.token, selectedFilter);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [loadComments, selectedFilter]);

  const handleFilterChange = (filter: Filter) => {
    setSelectedFilter(filter);
  };

  const handleToggleVisibility = async (comment: AdminComment) => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }

    const nextStatus: CommentStatus = comment.status === "visible" ? "hidden" : "visible";
    setBusyId(comment.id);
    setError("");
    setMessage("");
    try {
      const updated = await setCommentStatus(token, comment.id, nextStatus);
      setComments((current) =>
        selectedFilter === "all"
          ? current.map((item) => (item.id === updated.id ? updated : item))
          : current.filter((item) => item.id !== updated.id),
      );
      setMessage("Trạng thái bình luận đã được cập nhật.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được bình luận.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }

    const reply = replyMap[id]?.trim();
    if (!reply) {
      setMessage("Vui lòng nhập nội dung trả lời.");
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const updated = await replyToComment(token, id, reply);
      setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setReplyMap((current) => ({ ...current, [id]: "" }));
      setMessage("Đã lưu trả lời cho bình luận.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được trả lời.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setError("Phiên đăng nhập admin không hợp lệ.");
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await deleteComment(token, id);
      setComments((current) => current.filter((item) => item.id !== id));
      setMessage("Bình luận đã được xóa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được bình luận.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Quản lý bình luận">
        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Bình luận khách hàng</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Xem và thao tác</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-3xl bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm">
                  Tổng: {counts.total}
                </span>
                <select
                  value={selectedFilter}
                  onChange={(event) => handleFilterChange(event.target.value as Filter)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="visible">Hiển thị</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
                <button
                  type="button"
                  onClick={() => token && loadComments(token, selectedFilter)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-60"
                >
                  {loading ? "Đang tải..." : "Làm mới"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>Hiển thị: {counts.visible}</span>
              <span>Đã ẩn: {counts.hidden}</span>
            </div>

            {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
            {error ? <p className="mt-4 rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </div>

          <div className="space-y-4">
            {loading ? <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Đang tải bình luận...</p> : null}
            {!loading && comments.length === 0 ? <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Chưa có bình luận nào.</p> : null}

            {comments.map((comment) => (
              <article key={comment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{formatDate(comment.createdAt)}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{comment.name}</p>
                    <p className="text-sm text-slate-500">{comment.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      comment.status === "visible"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {comment.status === "visible" ? "Hiển thị" : "Đã ẩn"}
                  </span>
                </div>

                <p className="mt-4 leading-7 text-slate-700">{comment.content}</p>

                {comment.reply ? (
                  <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-slate-700">
                    <p className="text-sm font-semibold text-slate-900">Trả lời chủ shop</p>
                    <p className="mt-2 text-sm leading-6">{comment.reply.content}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(comment.reply.createdAt)}</p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(comment)}
                      disabled={busyId === comment.id}
                      className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {comment.status === "visible" ? "Ẩn" : "Hiển thị"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={busyId === comment.id}
                      className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="min-w-[220px]">
                    <label className="block text-sm font-medium text-slate-700">
                      Trả lời nhanh
                      <textarea
                        value={replyMap[comment.id] ?? ""}
                        onChange={(event) =>
                          setReplyMap((current) => ({ ...current, [comment.id]: event.target.value }))
                        }
                        placeholder="Nhập trả lời..."
                        rows={3}
                        className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleReply(comment.id)}
                      disabled={busyId === comment.id}
                      className="mt-3 inline-flex items-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === comment.id ? "Đang lưu..." : "Lưu trả lời"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
