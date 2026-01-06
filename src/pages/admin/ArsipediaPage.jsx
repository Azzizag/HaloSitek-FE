// src/pages/admin/ArsipediaPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle, FiEdit2, FiTrash2, FiX, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken } from "../../lib/adminAuth";

/* =========================
   Config
========================= */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

const ENDPOINTS = {
    list: "/arsipedia",
    remove: (id) => `/arsipedia/${id}`,
};

/* =========================
   Utils
========================= */
function resolveImageUrl(imagePath) {
    if (!imagePath) return "";
    const s = String(imagePath).replaceAll("\\", "/").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;

    const p = s.replace(/^\/+/, "");
    if (p.startsWith("uploads/")) return `${API_ORIGIN}/${encodeURI(p)}`;
    return `${API_ORIGIN}/uploads/${encodeURI(p)}`;
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    const isPublished = s === "published";
    return (
        <span
            className={
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold " +
                (isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")
            }
        >
            {isPublished ? "Published" : "Draft"}
        </span>
    );
}

function isUnauthorized(err) {
    return String(err?.message || "").includes("UNAUTHORIZED");
}

/* =========================
   Small UI Components
========================= */
function Toast({ text, onClose }) {
    if (!text) return null;
    return (
        <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                <FiCheckCircle className="text-slate-700" />
                <span>{text}</span>
                <button
                    type="button"
                    className="ml-4 text-slate-500 hover:text-slate-800"
                    onClick={onClose}
                    aria-label="Close toast"
                >
                    <FiX />
                </button>
            </div>
        </div>
    );
}

function InlineError({ children }) {
    if (!children) return null;
    return (
        <div className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white">
            <FiAlertTriangle className="text-base" />
            <span>{children}</span>
        </div>
    );
}

function ConfirmModal({ open, title, desc, confirmText = "Hapus", onClose, onConfirm, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        disabled={loading}
                    >
                        <FiX />
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? "Menghapus..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ArsipediaCard({ item, onEdit, onDelete }) {
    const imgUrl = useMemo(() => resolveImageUrl(item?.imagePath), [item?.imagePath]);

    const excerpt = useMemo(() => {
        const text = String(item?.content || "").replace(/\s+/g, " ").trim();
        if (!text) return "—";
        return text.length > 120 ? text.slice(0, 120) + "…" : text;
    }, [item?.content]);

    const tagList = useMemo(() => {
        // biarkan tetap sederhana untuk list (editor akan handle parsing json)
        return String(item?.tags || "")
            .replace(/^\[|\]$/g, "")
            .replaceAll('"', "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 3);
    }, [item?.tags]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-40 w-full bg-slate-100">
                {imgUrl ? (
                    <img
                        src={imgUrl}
                        alt={item?.title || "image"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/no-image.png";
                        }}
                    />
                ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-500">No Image</div>
                )}
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate text-lg font-extrabold text-slate-900">{item?.title || "-"}</div>
                        <div className="mt-2 text-sm text-slate-600">{excerpt}</div>
                    </div>
                    {statusBadge(item?.status)}
                </div>

                {tagList.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {tagList.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="mt-4 text-xs text-slate-500">
                    Dibuat {formatDate(item?.createdAt)} • Update {formatDate(item?.updatedAt)}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(item?.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <FiEdit2 />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                        <FiTrash2 />
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Page
========================= */
export default function ArsipediaPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [toast, setToast] = useState("");

    const [items, setItems] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const goLogin = useCallback(() => {
        clearAdminToken();
        navigate("/admin/login", { replace: true });
    }, [navigate]);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setErr("");
            const res = await apiAdmin(ENDPOINTS.list);
            const rows = Array.isArray(res?.data) ? res.data : [];
            setItems(rows);
        } catch (e) {
            if (isUnauthorized(e)) return goLogin();
            setErr(e?.message || "Gagal mengambil data Arsipedia");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [goLogin]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const onCreate = () => {
        setToast("");
        setErr("");
        // ✅ FIX: route create yang benar sesuai App.jsx
        navigate("/admin/arsipedia/new");
    };

    const onEdit = (id) => {
        setToast("");
        setErr("");
        navigate(`/admin/arsipedia/${id}/edit`);
    };

    const onAskDelete = (item) => {
        setToast("");
        setErr("");
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget?.id) return;
        try {
            setDeleting(true);
            setErr("");
            await apiAdmin(ENDPOINTS.remove(deleteTarget.id), { method: "DELETE" });
            setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
            setToast("Artikel berhasil dihapus");
            setDeleteTarget(null);
        } catch (e) {
            if (isUnauthorized(e)) return goLogin();
            setErr(e?.message || "Gagal menghapus artikel");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <div className="flex min-h-[calc(100vh-120px)] flex-col">
                <div className="flex-1 space-y-6">
                    <header className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Arsipedia Admin</h2>
                            <p className="mt-1 text-sm text-slate-500">Kelola artikel Arsipedia (draft/publish), edit, dan hapus.</p>
                        </div>

                        <button
                            type="button"
                            onClick={onCreate}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                        >
                            <FiPlusCircle />
                            Buat Artikel
                        </button>
                    </header>

                    <Toast text={toast} onClose={() => setToast("")} />

                    {err ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                            <InlineError>{err}</InlineError>
                        </div>
                    ) : null}

                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 text-base font-bold text-slate-900">Daftar Artikel</div>

                        {loading ? (
                            <div className="py-10 text-center text-sm text-slate-500">Memuat data...</div>
                        ) : items.length ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {items.map((item) => (
                                    <ArsipediaCard key={item.id} item={item} onEdit={onEdit} onDelete={onAskDelete} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                                Belum ada artikel.
                            </div>
                        )}
                    </section>

                    <ConfirmModal
                        open={Boolean(deleteTarget)}
                        title="Hapus Artikel?"
                        desc={
                            deleteTarget ? `Anda yakin ingin menghapus artikel "${deleteTarget.title}"? Tindakan ini tidak dapat dibatalkan.` : ""
                        }
                        onClose={() => (deleting ? null : setDeleteTarget(null))}
                        onConfirm={confirmDelete}
                        loading={deleting}
                    />
                </div>

                <footer className="mt-10 border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Arsipedia Admin Panel. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
