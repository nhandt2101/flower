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

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
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
      setError(err instanceof Error ? err.message : "Could not load comments.");
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

  const handleToggleVisibility = async (comment: AdminComment) => {
    if (!token) {
      setError("Your admin session is no longer valid.");
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
      setMessage("Comment status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update comment.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }

    const reply = replyMap[id]?.trim();
    if (!reply) {
      setMessage("Enter a reply before saving.");
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const updated = await replyToComment(token, id, reply);
      setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setReplyMap((current) => ({ ...current, [id]: "" }));
      setMessage("Reply saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save reply.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await deleteComment(token, id);
      setComments((current) => current.filter((item) => item.id !== id));
      setMessage("Comment deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete comment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Comments">
        <section className="grid gap-6">
          <div className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-accent">Customer comments</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">Review and reply</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-silver-soft bg-background px-4 py-2 text-sm text-muted">
                  Total <span className="font-semibold text-foreground">{counts.total}</span>
                </div>
                <div className="flex rounded-2xl border border-silver-soft bg-background p-1">
                  {filters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                        selectedFilter === filter.value
                          ? "bg-accent text-background"
                          : "text-muted hover:text-accent"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => token && loadComments(token, selectedFilter)}
                  disabled={loading}
                  className="rounded-full border border-silver-soft bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
              <span>Visible: {counts.visible}</span>
              <span>Hidden: {counts.hidden}</span>
            </div>

            {message ? <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p> : null}
            {error ? <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </div>

          <div className="space-y-4">
            {loading ? <p className="rounded-3xl border border-silver-soft bg-surface p-6 text-sm text-muted">Loading comments...</p> : null}
            {!loading && comments.length === 0 ? <p className="rounded-3xl border border-silver-soft bg-surface p-6 text-sm text-muted">No comments yet.</p> : null}

            {comments.map((comment) => (
              <article key={comment.id} className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted">{formatDate(comment.createdAt)}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{comment.name}</p>
                    <p className="truncate text-sm text-muted">{comment.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      comment.status === "visible"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-silver-soft text-muted"
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>

                <p className="mt-4 leading-7 text-foreground/80">{comment.content}</p>

                {comment.reply ? (
                  <div className="mt-5 rounded-3xl border border-silver-soft bg-background p-4 text-foreground/80">
                    <p className="text-sm font-semibold text-foreground">Shop reply</p>
                    <p className="mt-2 text-sm leading-6">{comment.reply.content}</p>
                    <p className="mt-2 text-xs text-muted">{formatDate(comment.reply.createdAt)}</p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
                  <div className="flex flex-wrap items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(comment)}
                      disabled={busyId === comment.id}
                      className="rounded-full border border-silver-soft bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {comment.status === "visible" ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={busyId === comment.id}
                      className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Quick reply
                      <textarea
                        value={replyMap[comment.id] ?? ""}
                        onChange={(event) =>
                          setReplyMap((current) => ({ ...current, [comment.id]: event.target.value }))
                        }
                        placeholder="Write a reply..."
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleReply(comment.id)}
                      disabled={busyId === comment.id}
                      className="mt-3 inline-flex items-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === comment.id ? "Saving..." : "Save reply"}
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
