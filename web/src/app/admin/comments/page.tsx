"use client";

import { useMemo, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";

type CommentItem = {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  status: "visible" | "hidden";
  reply?: string;
};

const initialComments: CommentItem[] = [
  {
    id: "c1",
    name: "Hà Linh",
    email: "halinh@example.com",
    content: "Hoa đẹp, giao nhanh và rất giống ảnh mẫu. Tôi sẽ quay lại lần sau.",
    createdAt: "1 ngày trước",
    status: "visible",
    reply: "Cảm ơn chị Hà! Rất mong được phục vụ chị lần sau.",
  },
  {
    id: "c2",
    name: "Anna",
    email: "anna.schmidt@example.de",
    content: "Friendly service and a beautiful bouquet. The store atmosphere is lovely.",
    createdAt: "2 ngày trước",
    status: "visible",
  },
  {
    id: "c3",
    name: "Minh",
    email: "minh@example.com",
    content: "Chưa hài lòng về thời gian giao hàng. Mong bên shop chú ý hơn.",
    createdAt: "3 giờ trước",
    status: "hidden",
  },
];

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const filteredComments = useMemo(() => {
    if (selectedFilter === "all") return comments;
    if (selectedFilter === "visible") return comments.filter((comment) => comment.status === "visible");
    return comments.filter((comment) => comment.status === "hidden");
  }, [comments, selectedFilter]);

  const handleToggleVisibility = (id: string) => {
    setComments((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "visible" ? "hidden" : "visible",
            }
          : item,
      ),
    );
    setMessage("Trạng thái bình luận đã được cập nhật.");
  };

  const handleReply = (id: string) => {
    const reply = replyMap[id]?.trim();
    if (!reply) {
      setMessage("Vui lòng nhập nội dung trả lời.");
      return;
    }
    setComments((current) =>
      current.map((item) => (item.id === id ? { ...item, reply } : item)),
    );
    setReplyMap((current) => ({ ...current, [id]: "" }));
    setMessage("Đã lưu trả lời cho bình luận.");
  };

  const handleDelete = (id: string) => {
    setComments((current) => current.filter((item) => item.id !== id));
    setMessage("Bình luận đã được xóa.");
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
                  Tổng: {comments.length}
                </span>
                <select
                  value={selectedFilter}
                  onChange={(event) => setSelectedFilter(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="visible">Hiển thị</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
              </div>
            </div>

            {message ? <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
          </div>

          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <article key={comment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{comment.createdAt}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{comment.name}</p>
                    <p className="text-sm text-slate-500">{comment.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
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
                    <p className="mt-2 text-sm leading-6">{comment.reply}</p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(comment.id)}
                      className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                    >
                      {comment.status === "visible" ? "Ẩn" : "Hiển thị"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
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
                      className="mt-3 inline-flex items-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Lưu trả lời
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